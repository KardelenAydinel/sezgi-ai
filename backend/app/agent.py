"""
Agent module for generating tags from product information.
Simplified 2-step agent system for better performance and less API calls.
"""
import os
import json
import requests
from typing import List, Dict, Any, Optional
import asyncio
from pathlib import Path

# --- Agno Kütüphaneleri ---
from agno.agent import Agent
from agno.models.google import Gemini

# --- MCP Tools for database access ---
from agno.tools.mcp import MCPTools

# --- Proje Konfigürasyonu ---
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

from dotenv import load_dotenv
load_dotenv()

# --- API KEY ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MCP_SERVER_COMMAND = "fastmcp run mcp_server.py"

def _create_tag_generator_agent() -> Agent:
    """Step 1: Visual description'dan tag'ler üretir"""
    
    tag_generator = Agent(
        name="Tag Generator",
        role="Visual description'dan e-ticaret tag'leri üretir",
        model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_API_KEY),
        instructions=[
            "Sen bir e-ticaret tag üretim uzmanısın. Visual description verildiğinde:",
            "1. Ürünün ana kategorisini belirle",
            "2. Fiziksel özelliklerden tag'ler çıkar (renk, materyal, şekil)",
            "3. Kullanım amacından tag'ler çıkar",
            "4. 5-7 adet arama dostu tag üret",
            "5. Tag'ler Türkçe ve alt çizgi kullan (banyo_aksesuari gibi)",
            "Sonucu JSON formatında döndür:",
            "{'tags': ['tag1', 'tag2', 'tag3'], 'category': 'kategori', 'confidence': 0.9}"
        ],
        tools=[],
        monitoring=False,
    )
    
    return tag_generator

def _create_product_evaluator_agent() -> Agent:
    """Step 2: Database'den ürün getirir ve değerlendirir"""
    
    product_evaluator = Agent(
        name="Product Evaluator",
        role="Tag'lere göre ürün bulur ve kalitesini değerlendirir",
        model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_API_KEY),
        instructions=[
            "Sen bir ürün değerlendirme uzmanısın. Verilen tag'ler ve bulunan ürünler için:",
            "1. En uygun 4 ürünü seç",
            "2. Her ürünün tag'lerle uyumunu değerlendir",
            "3. Fiyat ve kalite dengesine bak",
            "4. Rating'i yüksek olanları öncelik ver",
            "Sonucu JSON formatında döndür:",
            "{'selected_products': [product_list], 'reasoning': 'seçim gerekçesi', 'quality_score': 0.8}"
        ],
        tools=[],
        monitoring=False,
    )
    
    return product_evaluator

async def search_ecommerce_products_via_mcp_agent(tags: List[str], limit: int = 8) -> List[dict]:
    """MCP Agent kullanarak e-ticaret ürünlerinde arama"""
    print(f"🔍 [AGENT] Starting MCP product search via Agent...")
    print(f"   🏷️ Tags: {tags}")
    print(f"   📊 Limit: {limit}")
    
    try:
        # MCP üzerinden database'e erişim - Agent kullanarak
        print(f"   🔗 Connecting to MCP server...")
        
        async with MCPTools(MCP_SERVER_COMMAND, timeout_seconds=60) as mcp_tools:
            print(f"   ✅ MCP connection established")
            
            # MCP tool'unu Agent'a vererek kullan
            print(f"   🤖 Creating MCP-enabled search agent...")
            
            search_agent = Agent(
                name="MCP Search Agent",
                role="Database'de ürün arar",
                model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_API_KEY),
                tools=[mcp_tools],
                instructions=[
                    "Sen bir ürün arama uzmanısın.",
                    "search_ecommerce_products_by_tags tool'unu kullanarak database'de ürün ararsın.",
                    "Verilen tag'ler ve limit ile arama yapar, sonuçları JSON formatında dönersin."
                ],
                markdown=False
            )
            
            # Agent'a arama yaptır
            search_prompt = f"""
            Lütfen aşağıdaki parametrelerle ürün arama yap:
            - search_tags: {tags}
            - limit: {limit}
            
            search_ecommerce_products_by_tags tool'unu kullan ve sonuçları döndür.
            """
            
            print(f"   🔄 Calling MCP agent with search request...")
            mcp_response = await search_agent.arun(message=search_prompt)
            print(f"   📦 MCP Agent Response received: {str(mcp_response)[:150]}...")
            
            # MCP response'u parse et
            if hasattr(mcp_response, 'content'):
                response_content = mcp_response.content
            else:
                response_content = str(mcp_response)
            
            print(f"   🔧 Parsing MCP response...")
            
            # MCP'den dönen response genellikle string olur, içinde ürün bilgileri var
            # Response'u parse etmeye çalış
            products_dict = []
            
            # MCP response'u parse et
            products_dict = []
            
            if "Found" in response_content and "products" in response_content:
                print(f"   ✅ MCP search completed successfully")
                
                # MCP response'tan JSON parse etmeye çalış
                try:
                    import re
                    import json
                    # JSON array'i bul
                    json_match = re.search(r'\[.*\]', response_content, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                        products_data = json.loads(json_str)
                        
                        # Her product'ı dict'e çevir (EcommerceProduct'tan gelebilir)
                        for product in products_data:
                            if isinstance(product, dict):
                                products_dict.append(product)
                            else:
                                # Object to dict conversion
                                product_dict = {
                                    'id': getattr(product, 'id', ''),
                                    'name': getattr(product, 'name', ''),
                                    'description': getattr(product, 'description', ''),
                                    'price': getattr(product, 'price', 0),
                                    'currency': getattr(product, 'currency', 'TL'),
                                    'image_url': getattr(product, 'image_url', ''),
                                    'tags': getattr(product, 'tags', []),
                                    'category': getattr(product, 'category', ''),
                                    'subcategory': getattr(product, 'subcategory', ''),
                                    'brand': getattr(product, 'brand', ''),
                                    'stock': getattr(product, 'stock', 0),
                                    'rating': getattr(product, 'rating', None),
                                    'review_count': getattr(product, 'review_count', None)
                                }
                                products_dict.append(product_dict)
                        
                        print(f"   🔧 Successfully parsed {len(products_dict)} products from MCP JSON")
                        
                except (json.JSONDecodeError, AttributeError) as parse_error:
                    print(f"   ⚠️ JSON parsing failed: {parse_error}")
                    print(f"   📄 Raw response: {response_content[:300]}...")
                    products_dict = []
            else:
                print(f"   ⚠️ Unexpected MCP response format")
                print(f"   📄 Response content: {response_content[:300]}...")
                products_dict = []
            
            print(f"   📦 MCP Agent search returned {len(products_dict)} products")
            return products_dict
            
    except Exception as e:
        print(f"   ❌ MCP Agent search error: {e}")
        print(f"   🔄 Falling back to direct database search...")
        return await search_ecommerce_products_fallback(tags, limit)

async def search_ecommerce_products_fallback(tags: List[str], limit: int = 8) -> List[dict]:
    """Fallback: Direct database search without MCP"""
    try:
        from app.database import search_products_by_tags
        products = search_products_by_tags(search_tags=tags, limit=limit)
        
        # Convert to dict format
        products_dict = []
        for product in products:
            product_dict = {
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'price': product.price,
                'currency': product.currency,
                'image_url': product.image_url,
                'tags': product.tags,
                'category': product.category,
                'subcategory': product.subcategory,
                'brand': product.brand,
                'stock': product.stock,
                'rating': product.rating,
                'review_count': product.review_count
            }
            products_dict.append(product_dict)
        
        print(f"   🔄 Fallback search returned {len(products_dict)} products")
        return products_dict
        
    except Exception as fallback_error:
        print(f"   ❌ Fallback also failed: {fallback_error}")
        return []

# Main search function that tries MCP first, then fallback
async def search_ecommerce_products_async(tags: List[str], limit: int = 8) -> List[dict]:
    """Main search function: MCP first, fallback second"""
    try:
        # İlk MCP Agent ile dene
        return await search_ecommerce_products_via_mcp_agent(tags, limit)
    except Exception as e:
        print(f"   ⚠️ MCP method failed: {e}")
        # Fallback'e düş
        return await search_ecommerce_products_fallback(tags, limit)

async def run_simple_tag_generation(product: Dict[str, Any], visual_description: str) -> Dict[str, Any]:
    """
    Basit 2-step tag generation ve ürün bulma süreci
    
    Args:
        product: Ürün bilgileri
        visual_description: LLM'in image generation için yazdığı detaylı açıklama
        
    Returns:
        Generated tags, metadata ve search results
    """
    
    print("\n" + "="*80)
    print("🤖 [AGENT SYSTEM] Starting Simple Tag Generation Process")
    print("="*80)
    print(f"📋 Product: {product.get('urun_adi', 'Unknown')}")
    print(f"👁️ Visual Description: {visual_description[:100]}...")
    print("="*80)
    
    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY ortam değişkeni ayarlanmamış.")
        raise ValueError("GEMINI_API_KEY ortam değişkeni ayarlanmamış.")

    try:
        # STEP 1: TAG GENERATION
        print("\n🏷️ [STEP 1] TAG GENERATION PHASE")
        print("-" * 50)
        
        tag_generator = _create_tag_generator_agent()
        print("✅ Tag Generator Agent initialized")
        
        tag_prompt = f"""
        Ürün: {product.get('urun_adi', 'Bilinmiyor')}
        Açıklama: {product.get('urun_aciklama', 'Açıklama yok')}
        Visual Description: {visual_description}
        
        Bu ürün için optimal e-ticaret tag'leri üret.
        """
        
        print("🔄 Sending prompt to Tag Generator...")
        tag_response = await tag_generator.arun(message=tag_prompt)
        print(f"✅ Tag Generator responded: {str(tag_response)[:200]}...")
        
        # Parse tag response
        try:
            if isinstance(tag_response, str):
                if tag_response.strip().startswith("```json"):
                    tag_content = tag_response.strip()[7:-3].strip()
                else:
                    tag_content = tag_response
                tag_result = json.loads(tag_content)
            elif hasattr(tag_response, 'content'):
                tag_content = tag_response.content
                if tag_content.strip().startswith("```json"):
                    tag_content = tag_content.strip()[7:-3].strip()
                tag_result = json.loads(tag_content)
            else:
                tag_result = tag_response if isinstance(tag_response, dict) else {"tags": ["ev_dekorasyonu"], "category": "genel", "confidence": 0.5}
                
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Tag parsing error: {e}")
            tag_result = {"tags": ["ev_dekorasyonu", "banyo_aksesuari"], "category": "genel", "confidence": 0.5}
        
        generated_tags = tag_result.get('tags', [])
        category = tag_result.get('category', 'genel')
        confidence = tag_result.get('confidence', 0.5)
        
        print(f"🎯 Generated Tags: {generated_tags}")
        print(f"📂 Category: {category}")
        print(f"📊 Confidence: {confidence:.1%}")
        
        # STEP 2: PRODUCT SEARCH & EVALUATION
        print(f"\n🔍 [STEP 2] PRODUCT SEARCH & EVALUATION PHASE")
        print("-" * 50)
        
        print("🔄 Searching for products with generated tags...")
        found_products = await search_ecommerce_products_async(generated_tags, limit=8)
        print(f"📦 Found {len(found_products)} products for evaluation")
        
        if found_products:
            print("🤖 Initializing Product Evaluator Agent...")
            evaluator = _create_product_evaluator_agent()
            print("✅ Product Evaluator Agent initialized")
            
            # Ürün listesini kısalt - sadece önemli alanlar
            simplified_products = []
            for product in found_products[:8]:  # Max 8 ürün
                simplified = {
                    'id': product.get('id', ''),
                    'name': product.get('name', ''),
                    'price': product.get('price', 0),
                    'tags': product.get('tags', [])[:5],  # Max 5 tag
                    'category': product.get('category', '')
                }
                simplified_products.append(simplified)
            
            evaluation_prompt = f"""
            Generated Tags: {generated_tags}
            Found Products (simplified): {json.dumps(simplified_products, ensure_ascii=False)}
            
            Bu ürünlerden en uygun 4'ünü seç ve değerlendir.
            JSON formatında yanıt ver: {{"selected_products": [...], "reasoning": "...", "quality_score": 0.8}}
            """
            
            print("🔄 Sending products to evaluator...")
            eval_response = await evaluator.arun(message=evaluation_prompt)
            print(f"✅ Evaluator responded: {str(eval_response)[:200]}...")
            
            # Parse evaluation response
            try:
                if isinstance(eval_response, str):
                    if eval_response.strip().startswith("```json"):
                        eval_content = eval_response.strip()[7:-3].strip()
                    else:
                        eval_content = eval_response
                    eval_result = json.loads(eval_content)
                elif hasattr(eval_response, 'content'):
                    eval_content = eval_response.content
                    if eval_content.strip().startswith("```json"):
                        eval_content = eval_content.strip()[7:-3].strip()
                    eval_result = json.loads(eval_content)
                else:
                    eval_result = {"selected_products": found_products[:4], "reasoning": "Standart seçim", "quality_score": 0.7}
                    
            except (json.JSONDecodeError, AttributeError) as e:
                print(f"Evaluation parsing error: {e}")
                eval_result = {"selected_products": found_products[:4], "reasoning": "Parsing hatası, ilk 4 ürün seçildi", "quality_score": 0.7}
            
            selected_products = eval_result.get('selected_products', found_products[:4])
            reasoning = eval_result.get('reasoning', 'Ürünler başarıyla seçildi')
            quality_score = eval_result.get('quality_score', 0.7)
        else:
            selected_products = []
            reasoning = "Uygun ürün bulunamadı"
            quality_score = 0.0
        
        final_result = {
            "tags": generated_tags,
            "confidence": confidence,
            "category": category,
            "reasoning": f"Tag generation confidence: {confidence:.1%}. {reasoning}",
            "visual_description_used": visual_description,
            "search_results": selected_products,
            "quality_score": quality_score
        }
        
        print(f"\n✅ [SUCCESS] Tag Generation Process Completed!")
        print(f"📋 Final Result Summary:")
        print(f"   🏷️ Tags: {len(generated_tags)} tags generated")
        print(f"   🛍️ Products: {len(selected_products)} products selected")
        print(f"   ⭐ Quality: {quality_score:.1%}")
        print("="*80)
        
        return final_result
        
    except Exception as e:
        print(f"\n❌ [ERROR] Simple tag generation error: {e}")
        print("🔄 Using fallback response...")
        
        # Fallback: static response
        fallback_tags = ["ev_dekorasyonu", "banyo_aksesuari", "mutfak_gereci"]
        fallback_products = await search_ecommerce_products_async(fallback_tags, limit=4)
        
        fallback_result = {
            "tags": fallback_tags,
            "confidence": 0.5,
            "category": "genel",
            "reasoning": f"Hata nedeniyle fallback kullanıldı: {e}",
            "visual_description_used": visual_description,
            "search_results": fallback_products
        }
        
        print(f"🔄 Fallback result prepared with {len(fallback_products)} products")
        print("="*80)
        
        return fallback_result

# Legacy functions - backward compatibility
async def run_tag_generation_with_visual(product: Dict[str, Any], visual_description: str, session_id: str) -> Dict[str, Any]:
    """Legacy function - redirects to simplified version"""
    return await run_simple_tag_generation(product, visual_description)

async def run_tag_generation(product: Dict[str, Any], session_id: str) -> Dict[str, Any]:
    """Legacy function - redirects to simplified version"""
    visual_description = product.get('visual_representation', 'Görsel açıklama bulunamadı')
    return await run_simple_tag_generation(product, visual_description)

def generate_tags_for_product(product: Dict[str, Any]) -> List[str]:
    """Static tag generation fallback"""
    static_tags = [
        "ev_dekorasyonu",
        "banyo_aksesuari", 
        "mutfak_gereci",
        "temizlik_urun",
        "yapi_malzeme"
    ]
    return static_tags[:5]

def process_product_for_tags(product: Dict[str, Any]) -> Dict[str, Any]:
    """Process a product and add generated tags to it"""
    tags = generate_tags_for_product(product)
    product_with_tags = product.copy()
    product_with_tags['tags'] = tags
    return product_with_tags 