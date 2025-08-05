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
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

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

def cosine_similarity_search(search_tags: List[str], product_data: List[Dict[str, Any]], min_threshold: float = 0.1) -> List[Dict[str, Any]]:
    """
    Search for products using cosine similarity between search tags and product tags.
    This enables finding products even when tag order is different (e.g., 'bluetooth_kulaklık' matches 'kulaklık_bluetooth').
    
    Args:
        search_tags: List of tags to search for
        product_data: List of product dictionaries with 'tags' field
        min_threshold: Minimum similarity threshold to include results
        
    Returns:
        List of products sorted by similarity score
    """
    if not search_tags or not product_data:
        return []
    
    try:
        # Prepare text data for vectorization
        search_text = ' '.join(search_tags)
        product_texts = []
        
        for product in product_data:
            product_tags = product.get('tags', [])
            if isinstance(product_tags, str):
                product_tags = json.loads(product_tags) if product_tags else []
            product_text = ' '.join(product_tags) if product_tags else ''
            product_texts.append(product_text)
        
        # Only proceed if we have product texts
        if not any(product_texts):
            return []
        
        # Combine search text with product texts for vectorization
        all_texts = [search_text] + product_texts
        
        # Use character n-grams to catch partial matches like bluetooth_kulaklık vs kulaklık_bluetooth
        vectorizer = TfidfVectorizer(
            analyzer='char_wb',  # Character-based with word boundaries
            ngram_range=(3, 8),  # N-gram range for character analysis
            lowercase=True,
            max_features=10000,
            min_df=1  # Include terms that appear in at least 1 document
        )
        
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        
        # Calculate cosine similarity between search query (first vector) and all products
        search_vector = tfidf_matrix[0]
        product_vectors = tfidf_matrix[1:]
        
        similarities = cosine_similarity(search_vector, product_vectors).flatten()
        
        # Create results with similarity scores
        results = []
        for i, product in enumerate(product_data):
            similarity_score = similarities[i]
            
            # Boost score for exact tag matches
            product_tags = product.get('tags', [])
            if isinstance(product_tags, str):
                product_tags = json.loads(product_tags) if product_tags else []
            
            exact_matches = set(search_tags) & set(product_tags)
            if exact_matches:
                similarity_score *= (1.0 + len(exact_matches) * 0.3)
            
            # Apply minimum threshold
            if similarity_score > min_threshold:
                product_with_score = product.copy()
                product_with_score['similarity_score'] = float(similarity_score)
                results.append(product_with_score)
        
        # Sort by similarity score
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return results
        
    except Exception as e:
        print(f"🔍 Cosine similarity error: {e}")
        # Fallback to simple tag intersection
        results = []
        for product in product_data:
            product_tags = product.get('tags', [])
            if isinstance(product_tags, str):
                product_tags = json.loads(product_tags) if product_tags else []
            
            matching_tags = set(search_tags) & set(product_tags)
            similarity_score = len(matching_tags) / max(len(search_tags), 1)
            
            if similarity_score > min_threshold:
                product_with_score = product.copy()
                product_with_score['similarity_score'] = similarity_score
                results.append(product_with_score)
        
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return results

def _create_tag_generator_agent() -> Agent:
    """Step 1: Visual description'dan tag'ler üretir"""
    
    tag_generator = Agent(
        name="Tag Generator",
        role="Visual description'dan e-ticaret tag'leri üretir",
        model=Gemini(id="gemini-2.0-flash-lite", api_key=GEMINI_API_KEY),
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
        debug_mode=True,
    )
    
    return tag_generator

def _create_product_evaluator_agent() -> Agent:
    """Step 2: Database'den ürün getirir ve değerlendirir"""
    
    product_evaluator = Agent(
        name="Product Evaluator",
        role="Tag'lere göre ürün bulur ve kalitesini değerlendirir",
        model=Gemini(id="gemini-2.0-flash-lite", api_key=GEMINI_API_KEY),
        instructions=[
            "Sen bir ürün sıralama uzmanısın. Verilen tag'ler ve bulunan ürünler için:",
            "1. Her ürünün tag'lerle uyumunu değerlendir",
            "2. Fiyat ve kalite dengesine bak",
            "3. Rating'i yüksek olanları öncelik ver",
            "Sonucu sıralı bir JSON formatında döndür:",
            "{'selected_products': [product_list], 'reasoning': 'seçim gerekçesi', 'quality_score': 0.8}",
            "Sana verilen ürün listesinden asla ürün silme. Bütün ürünleri döndür. Sen sadece sıralama yapıyorsun."
        ],
        #tools=[cosine_similarity_search],
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
                model=Gemini(id="gemini-2.0-flash-lite", api_key=GEMINI_API_KEY),
                tools=[mcp_tools],
                instructions=[
                    "Sen bir ürün arama uzmanısın.",
                    "search_ecommerce_products_by_tags tool'unu kullanarak database'de ürün ararsın.",
                    "Verilen tag'ler ve limit ile arama yapar, sonuçları JSON formatında dönersin."
                ],
                markdown=False,
                debug_mode=True
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
            print(f"   📦 MCP Agent Response received: {str(mcp_response)}...")
            
            # MCP response'u parse et
            if hasattr(mcp_response, 'content'):
                response_content = mcp_response.content
            else:
                response_content = str(mcp_response)
            
            print(f"   🔧 Parsing MCP response...")
            
            # MCP response'u parse et - JSON formatını direkt ara
            products_dict = []
            
            try:
                import re
                import json
                
                # İlk önce markdown code block içindeki JSON'u dene (```json ... ```)
                json_block_match = re.search(r'```json\s*(\{.*?\})\s*```', response_content, re.DOTALL)
                if json_block_match:
                    json_str = json_block_match.group(1)
                    print(f"   📝 Found JSON in markdown block")
                else:
                    # JSON object veya array'i bul
                    json_match = re.search(r'[\{\[].*[\}\]]', response_content, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                        print(f"   📝 Found JSON data")
                    else:
                        json_str = None
                        print(f"   ⚠️ No JSON found in response")
                
                if json_str:
                    parsed_data = json.loads(json_str)
                    
                    # MCP response wrapper'ını handle et
                    if isinstance(parsed_data, dict) and 'search_ecommerce_products_by_tags_response' in parsed_data:
                        result_data = parsed_data['search_ecommerce_products_by_tags_response'].get('result', [])
                        
                        # Check if result is a JSON string that needs to be parsed again
                        if isinstance(result_data, str):
                            try:
                                products_data = json.loads(result_data)
                                print(f"   📦 Found MCP wrapped response with {len(products_data)} products")
                            except json.JSONDecodeError:
                                print(f"   ⚠️ Failed to parse result string as JSON")
                                products_data = []
                        else:
                            products_data = result_data
                            print(f"   📦 Found MCP wrapped response with {len(products_data)} products")
                    elif isinstance(parsed_data, list):
                        products_data = parsed_data
                        print(f"   📝 Found direct array with {len(products_data)} products")
                    else:
                        products_data = []
                        print(f"   ⚠️ Unexpected JSON format: {type(parsed_data)}")
                    
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
                    
                    print(f"   ✅ Successfully parsed {len(products_dict)} products from MCP JSON")
                else:
                    print(f"   ⚠️ No valid JSON found in MCP response")
                    print(f"   📄 Response content: {response_content[:300]}...")
                        
            except (json.JSONDecodeError, AttributeError) as parse_error:
                print(f"   ⚠️ JSON parsing failed: {parse_error}")
                print(f"   📄 Raw response: {response_content[:300]}...")
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

# Main search function that tries MCP first, then fallback, then applies cosine similarity
async def search_ecommerce_products_async(tags: List[str], limit: int = 8) -> List[dict]:
    """Main search function: MCP first, fallback second, cosine similarity filtering"""
    try:
        print(f"🔍 [STEP 1] Getting all products from MCP...")
        # İlk önce daha fazla ürün iste (cosine similarity filtreleme için) - limit reasonable olarak ayarla
        search_limit = min(100, limit * 5)  # Mak 100 ürün iste, küçük DB için yeterli
        all_products = await search_ecommerce_products_via_mcp_agent(tags, limit=search_limit)
        
        if not all_products:
            print(f"   🔄 No products from MCP, trying fallback...")
            all_products = await search_ecommerce_products_fallback(tags, limit=search_limit)
        
        if not all_products:
            print(f"   ❌ No products found")
            return []
        
        print(f"🔍 [STEP 2] Applying cosine similarity filtering...")
        print(f"   📊 Input: {len(all_products)} products, target: {limit} products")
        
        # Cosine similarity tool'unu kullan
        similarity_results = cosine_similarity_search(
            search_tags=tags,
            product_data=all_products,
            min_threshold=0.05  # Düşük threshold ile daha fazla ürün dahil et
        )
        
        # Top results'ı al
        final_results = similarity_results[:limit]
        
        print(f"   ✅ Cosine similarity applied: {len(final_results)} products selected")
        print(f"📦 Found {len(final_results)} products for evaluation")
        
        # Debug: İlk birkaç seçilmiş ürünün tag'lerini göster  
        for i, product in enumerate(final_results[:3]):
            name = product.get('name', 'Unknown')
            product_tags = product.get('tags', [])
            similarity_score = product.get('similarity_score', 0)
            print(f"   Selected {i+1}: {name[:30]}... Tags: {product_tags[:3] if product_tags else 'No tags'} (score: {similarity_score:.3f})")
        
        print(f"\n📊 [DEBUG] Final products with similarity scores:")
        for i, product in enumerate(final_results[:3]):  # İlk 3'ünü göster
            score = product.get('similarity_score', 0)
            name = product.get('name', 'Unknown')
            tags_count = len(product.get('tags', []))
            print(f"   {i+1}. {name} (score: {score:.3f}, tags: {tags_count})")
        
        return final_results
        
    except Exception as e:
        print(f"   ⚠️ Main search error: {e}")
        # Final fallback
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
                # Smart fallback for non-dict response
                if isinstance(tag_response, dict):
                    tag_result = tag_response
                else:
                    product_name = product.get('urun_adi', '').lower()
                    if 'kulaklık' in product_name or 'headphone' in product_name:
                        tag_result = {"tags": ["bluetooth_kulaklik"], "category": "elektronik", "confidence": 0.5}
                    else:
                        tag_result = {"tags": ["genel_urun"], "category": "genel", "confidence": 0.5}
                
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Tag parsing error: {e}")
            # Smart fallback for JSON parsing errors
            product_name = product.get('urun_adi', '').lower()
            product_desc = product.get('urun_aciklama', '').lower()
            all_text = f"{product_name} {product_desc} {visual_description.lower()}"
            
            # Generate appropriate fallback tags based on content
            if any(keyword in all_text for keyword in ['kulaklık', 'headphone', 'bluetooth', 'kablosuz', 'ses']):
                fallback_tags = ['bluetooth_kulaklik', 'kablosuz_kulaklik']
            elif any(keyword in all_text for keyword in ['sehpa', 'masa', 'mobilya', 'ahşap']):
                fallback_tags = ['mobilya', 'ev_dekorasyonu']
            elif any(keyword in all_text for keyword in ['mutfak', 'kitchen']):
                fallback_tags = ['mutfak_gereci', 'ev_aletleri']
            else:
                fallback_tags = ['genel_urun', 'ev_gerecleri']
                
            tag_result = {"tags": fallback_tags, "category": "genel", "confidence": 0.5}
        
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
            for product in found_products:
                simplified = {
                    'id': product.get('id', ''),
                    'name': product.get('name', ''),
                    'price': product.get('price', 0),
                    'tags': product.get('tags', [])[:8],  # Max 8 tag
                    'category': product.get('category', '')
                }
                simplified_products.append(simplified)
            
            evaluation_prompt = f"""
            Generated Tags: {generated_tags}
            Found Products (simplified): {json.dumps(simplified_products, ensure_ascii=False)}
            
            Bu ürünleri uygunluğuna göre değerlendir.
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
                    eval_result = {"selected_products": found_products, "reasoning": "Standart seçim", "quality_score": 0.7}
                    
            except (json.JSONDecodeError, AttributeError) as e:
                print(f"Evaluation parsing error: {e}")
                eval_result = {"selected_products": found_products, "reasoning": "Parsing hatası, ilk 4 ürün seçildi", "quality_score": 0.7}
            
            # Evaluator'ın seçtiği ürünlerin ID'lerini al
            evaluator_selected = eval_result.get('selected_products', found_products)
            selected_ids = set()
            
            # Evaluator sonucundan ID'leri çıkar
            for product in evaluator_selected:
                if isinstance(product, dict):
                    selected_ids.add(product.get('id', ''))
                else:
                    # String veya başka format olabilir
                    try:
                        product_data = json.loads(str(product)) if isinstance(product, str) else product
                        selected_ids.add(product_data.get('id', ''))
                    except:
                        pass
            
            # Orijinal found_products'tan similarity score'ları koruyarak seç
            selected_products = []
            for product in found_products:
                if product.get('id') in selected_ids:
                    selected_products.append(product)

            
            """            # Eğer yeterli ürün yoksa, ilk 4'ünü al
            if len(selected_products) < 4:
                selected_products = found_products[:4]"""
            
            # Similarity score'a göre sırala (en yüksekten en düşüğe)
            selected_products.sort(key=lambda x: x.get('similarity_score', 0), reverse=True)
            
            reasoning = eval_result.get('reasoning', 'Ürünler başarıyla seçildi')
            quality_score = eval_result.get('quality_score', 0.7)
        else:
            selected_products = []
            reasoning = "Uygun ürün bulunamadı"
            quality_score = 0.0
        
        # Similarity score debug bilgisi ekle
        print(f"\n📊 [DEBUG] Final products with similarity scores:")
        for i, product in enumerate(selected_products):
            score = product.get('similarity_score', 0)
            name = product.get('name', 'Unknown')
            print(f"   {i+1}. {name}: {score:.3f}")
        
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
        
        # Smart Fallback: Extract meaningful tags from product name/description
        fallback_tags = []
        product_name = product.get('urun_adi', '').lower()
        product_desc = product.get('urun_aciklama', '').lower()
        visual_desc = visual_description.lower()
        
        # Extract category-specific tags based on product content
        all_text = f"{product_name} {product_desc} {visual_desc}"
        
        # Electronics & Tech keywords
        if any(keyword in all_text for keyword in ['kulaklık', 'headphone', 'bluetooth', 'kablosuz', 'ses', 'audio', 'musik', 'oyun', 'gaming']):
            fallback_tags = ['bluetooth_kulaklik', 'kablosuz_kulaklik', 'ses_cihazi', 'elektronik']
        # Furniture keywords  
        elif any(keyword in all_text for keyword in ['sehpa', 'masa', 'sandalye', 'dolap', 'mobilya', 'ahşap', 'koltuk']):
            fallback_tags = ['mobilya', 'ev_dekorasyonu', 'ahsap_mobilya', 'modern_mobilya']
        # Kitchen keywords
        elif any(keyword in all_text for keyword in ['mutfak', 'kitchen', 'ocak', 'buzdolabı', 'fırın', 'blender']):
            fallback_tags = ['mutfak_gereci', 'ev_aletleri', 'yemek_hazırlık']
        # Bathroom keywords
        elif any(keyword in all_text for keyword in ['banyo', 'bathroom', 'duş', 'lavabo', 'tuvalet', 'hijyen']):
            fallback_tags = ['banyo_aksesuari', 'hijyen_urunleri', 'ev_gerecleri']
        # Default fallback
        else:
            fallback_tags = ['genel_urun', 'ev_gerecleri', 'gunluk_kullanim']
            
        print(f"🎯 Smart fallback tags generated: {fallback_tags}")
        fallback_products = await search_ecommerce_products_async(fallback_tags)
        
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

def _slugify(text: str) -> str:
    import re, unicodedata
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip().lower()
    return text.replace(' ', '_')


def generate_tags_for_product(product: Dict[str, Any]) -> List[str]:
    """Generate simple heuristic tags from product name and description."""
    name = product.get('urun_adi') or product.get('name') or ''
    desc = product.get('urun_aciklama') or product.get('description') or ''
    combined = f"{name} {desc}"
    # Extract unique words longer than 2 characters
    words = {_slugify(w) for w in combined.split() if len(w) > 2}
    # Remove empty strings and generic stopwords
    stopwords = {'the', 'and', 'with', 'for', 'this', 'that', 'those', 'these', 'urun', 'product', 'kulaklik'}
    tags = [w for w in words if w and w not in stopwords]
    # Ensure at least some generic tag if empty
    if not tags:
        tags = ['genel_urun']
    # Limit to 7 tags
    return tags[:7]

def process_product_for_tags(product: Dict[str, Any]) -> Dict[str, Any]:
    """Process a product and add generated tags to it"""
    tags = generate_tags_for_product(product)
    product_with_tags = product.copy()
    product_with_tags['tags'] = tags
    return product_with_tags

async def generate_ab_test_suggestion(product_id: str, current_text: str, test_field: str) -> Dict[str, Any]:
    """
    Generate AI-powered A/B test suggestions based on product data and common queries
    
    Args:
        product_id: The product ID to get common queries for
        current_text: Current product title or description being tested
        test_field: 'title' or 'description' - what field is being tested
        
    Returns:
        Dictionary with suggested text and reasoning
    """
    print("\n" + "="*80)
    print("🧪 [A/B TEST AI] Starting AI Suggestion Generation")
    print("="*80)
    print(f"📋 Product ID: {product_id}")
    print(f"📝 Current Text: {current_text[:100]}...")
    print(f"🎯 Test Field: {test_field}")
    print("="*80)
    
    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY ortam değişkeni ayarlanmamış.")
        raise ValueError("GEMINI_API_KEY ortam değişkeni ayarlanmamış.")

    try:
        # Get product data and common queries from database
        print("\n🔍 [STEP 1] Getting product data from database...")
        
        from app.database import get_ecommerce_product_by_id
        product_data = get_ecommerce_product_by_id(product_id)
        
        if not product_data:
            print(f"⚠️ Product with ID {product_id} not found in database")
            return {
                "suggestion": current_text,
                "reasoning": "Ürün veritabanında bulunamadı, orijinal metin kullanıldı.",
                "confidence": 0.0
            }
        
        # Extract common queries for this product
        common_queries = product_data.get('common_queries', [])
        if isinstance(common_queries, str):
            try:
                import json
                common_queries = json.loads(common_queries)
            except:
                common_queries = []
        
        print(f"📊 Found {len(common_queries)} common queries for product: {common_queries}")
        
        # Get all common queries from similar products in the same category
        print("\n🔍 [STEP 2] Getting common queries from similar products...")
        
        from app.database import get_common_queries_by_category
        category_queries = get_common_queries_by_category(product_data.get('category', ''))
        
        print(f"📂 Found {len(category_queries)} queries from category '{product_data.get('category', '')}'")
        
        # Combine all queries for context
        all_queries = list(set(common_queries + category_queries))
        print(f"🎯 Total unique queries for analysis: {len(all_queries)}")
        
        # Create AI agent for suggestion generation
        print("\n🤖 [STEP 3] Creating AI suggestion agent...")
        
        suggestion_agent = Agent(
            name="A/B Test Suggestion Generator",
            role="A/B test için ürün başlığı/açıklaması önerileri oluşturur",
            model=Gemini(id="gemini-2.0-flash-lite", api_key=GEMINI_API_KEY),
            instructions=[
                "Sen bir A/B test optimizasyon uzmanısın.",
                "Görevin, mevcut ürün başlığı/açıklamasını analiz ederek hafif değişiklikler önermektir.",
                "Bu değişiklikler:",
                "1. Orijinalden çok FARKLI olmamalı (A/B testin izole edilebilmesi için)",
                "2. Kullanıcı arama sorguları verilerine dayanmalı",
                "3. Daha dikkat çekici veya açıklayıcı olmalı",
                "4. Aynı ürünü tanımlayabilir olmalı",
                "5. Türkçe dilbilgisi kurallarına uygun olmalı",
                "",
                "Örnekler:",
                "- 'Modern C Yan Sehpa' → 'Şık C Şeklinde Yan Sehpa'",
                "- 'Bluetooth Kulaklık' → 'Kablosuz Bluetooth Kulaklık'", 
                "- 'Laptop için ideal' → 'Laptop kullanımına özel tasarlandı'",
                "",
                "Sonucu JSON formatında döndür:",
                "{'suggestion': 'yeni metin', 'reasoning': 'değişiklik gerekçesi', 'confidence': 0.8}"
            ],
            debug_mode=True
        )
        
        # Prepare prompt for AI
        queries_text = ', '.join(all_queries[:10]) if all_queries else "Özel sorgu verisi bulunamadı"
        
        suggestion_prompt = f"""
        A/B Test Optimizasyonu:
        
        Ürün Bilgileri:
        - Ürün Adı: {product_data.get('name', 'Bilinmiyor')}
        - Kategori: {product_data.get('category', 'Genel')}
        - Mevcut {test_field}: "{current_text}"
        
        Kullanıcı Arama Sorguları:
        {queries_text}
        
        Bu {'başlık' if test_field == 'title' else 'açıklama'} için A/B test varyantı öner. 
        Değişiklik çok radikal olmamalı ama performansı artırabilecek hafif iyileştirmeler içermeli.
        Kullanıcı sorgu verilerini dikkate al.
        """
        
        print("🔄 Sending prompt to AI agent...")
        print(f"📝 Prompt preview: {suggestion_prompt[:200]}...")
        
        suggestion_response = await suggestion_agent.arun(message=suggestion_prompt)
        print(f"✅ AI agent responded: {str(suggestion_response)[:200]}...")
        
        # Parse AI response
        try:
            if isinstance(suggestion_response, str):
                response_content = suggestion_response
            elif hasattr(suggestion_response, 'content'):
                response_content = suggestion_response.content
            else:
                response_content = str(suggestion_response)
            
            # Extract JSON from response
            import re
            import json
            
            # Try to find JSON in markdown block first
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', response_content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find any JSON object
                json_match = re.search(r'\{[^{}]*"suggestion"[^{}]*\}', response_content, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                else:
                    json_str = None
            
            if json_str:
                suggestion_result = json.loads(json_str)
                suggested_text = suggestion_result.get('suggestion', current_text)
                reasoning = suggestion_result.get('reasoning', 'AI tarafından önerildi')
                confidence = suggestion_result.get('confidence', 0.7)
            else:
                # Fallback: Extract suggestion from text response
                lines = response_content.split('\n')
                suggested_text = current_text  # Default fallback
                for line in lines:
                    if 'suggestion' in line.lower() or '→' in line:
                        # Try to extract suggested text
                        if '→' in line:
                            suggested_text = line.split('→')[1].strip().strip('"').strip("'")
                        break
                
                reasoning = "AI yanıtından otomatik çıkarıldı"
                confidence = 0.5
                
        except Exception as parse_error:
            print(f"⚠️ AI response parsing failed: {parse_error}")
            # Smart fallback based on common patterns
            if test_field == 'title':
                # Add descriptive words for titles
                if 'modern' not in current_text.lower():
                    suggested_text = f"Modern {current_text}"
                elif 'şık' not in current_text.lower():
                    suggested_text = f"Şık {current_text}"
                else:
                    suggested_text = current_text.replace(' ', ' Premium ')
            else:
                # Add compelling words for descriptions
                if 'ideal' not in current_text.lower():
                    suggested_text = f"{current_text} İdeal tasarım."
                elif 'özel' not in current_text.lower():
                    suggested_text = f"Özel olarak tasarlanmış {current_text.lower()}"
                else:
                    suggested_text = current_text + " Yüksek kalite garantisi."
            
            reasoning = f"Parsing hatası nedeniyle otomatik öneri: {parse_error}"
            confidence = 0.3
        
        # Ensure the suggestion is different from original
        if suggested_text.strip() == current_text.strip():
            # Force a small change if identical
            if test_field == 'title':
                suggested_text = f"Premium {current_text}"
            else:
                suggested_text = f"{current_text} Kaliteli malzeme."
            reasoning += " (Özgün metinden farklılaştırıldı)"
        
        print(f"💡 Generated Suggestion: {suggested_text}")
        print(f"🧠 Reasoning: {reasoning}")
        print(f"📊 Confidence: {confidence:.1%}")
        
        final_result = {
            "suggestion": suggested_text,
            "reasoning": reasoning,
            "confidence": confidence,
            "original_text": current_text,
            "test_field": test_field,
            "queries_used": len(all_queries)
        }
        
        print(f"\n✅ [SUCCESS] A/B Test Suggestion Generated!")
        print(f"📋 Final Result: {final_result}")
        print("="*80)
        
        return final_result
        
    except Exception as e:
        print(f"\n❌ [ERROR] A/B Test suggestion generation error: {e}")
        print("🔄 Using smart fallback...")
        
        # Smart fallback based on test field and content
        fallback_suggestion = current_text
        
        if test_field == 'title':
            # Title improvements
            words = current_text.split()
            if len(words) > 1:
                # Add adjective if missing
                adjectives = ['Premium', 'Şık', 'Modern', 'Kaliteli', 'Özel']
                existing_adj = any(adj.lower() in current_text.lower() for adj in adjectives)
                if not existing_adj:
                    fallback_suggestion = f"Premium {current_text}"
                else:
                    # Rearrange or enhance
                    fallback_suggestion = current_text.replace('-', ' |')
        else:
            # Description improvements
            if not current_text.endswith('.'):
                fallback_suggestion = f"{current_text}."
            if 'ideal' not in current_text.lower():
                fallback_suggestion = f"{fallback_suggestion} İdeal seçim."
        
        fallback_result = {
            "suggestion": fallback_suggestion,
            "reasoning": f"Hata nedeniyle otomatik öneri kullanıldı: {e}",
            "confidence": 0.3,
            "original_text": current_text,
            "test_field": test_field,
            "queries_used": 0
        }
        
        print(f"🔄 Fallback result: {fallback_result}")
        print("="*80)
        
        return fallback_result 