import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
import base64
from io import BytesIO
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
import warnings
import uuid
from typing import List, Dict, Any
import sqlite3
from pathlib import Path

# Suppress the specific UserWarning from the Vertex AI SDK
warnings.filterwarnings(
    "ignore",
    message="This feature is deprecated as of June 24, 2025 and will be removed on June 24, 2026.",
    category=UserWarning
)

# Vertex AI SDK
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel

# Import agent module and models
from app.agent import process_product_for_tags, run_tag_generation_with_visual
from app.models import ProductCard, ProductCollection, TagGenerationRequest, TagGenerationResponse

router = APIRouter()

# Database setup
DB_PATH = Path(__file__).parent / "data" / "products.db"
DB_PATH.parent.mkdir(exist_ok=True)

def init_database():
    """Initialize the products database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            urun_adi TEXT NOT NULL,
            urun_aciklama TEXT,
            urun_adi_en TEXT,
            visual_representation TEXT,
            image_base64 TEXT,
            tags TEXT,  -- JSON string
            confidence_score REAL,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_database()

class DescriptionRequest(BaseModel):
    description: str

class ProductTagRequest(BaseModel):
    product: dict

class SaveProductRequest(BaseModel):
    """Ürün kartlarını kaydetmek için request modeli"""
    products: List[dict]

class ProductQueryRequest(BaseModel):
    """Ürün sorgulama request modeli"""
    query: str
    limit: int = 10

def save_product_to_db(product: dict) -> str:
    """Ürünü veritabanına kaydet"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    product_id = str(uuid.uuid4())
    tags_json = json.dumps(product.get('tags', []))
    
    cursor.execute('''
        INSERT INTO products (id, urun_adi, urun_aciklama, urun_adi_en, 
                            visual_representation, image_base64, tags, 
                            confidence_score, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        product_id,
        product.get('urun_adi'),
        product.get('urun_aciklama'),
        product.get('urun_adi_en'),
        product.get('visual_representation'),
        product.get('image_base64'),
        tags_json,
        product.get('confidence_score'),
        product.get('category')
    ))
    
    conn.commit()
    conn.close()
    
    return product_id

def get_products_from_db(limit: int = 10) -> List[dict]:
    """Veritabanından ürünleri getir"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, urun_adi, urun_aciklama, urun_adi_en, 
               visual_representation, image_base64, tags, 
               confidence_score, category, created_at
        FROM products 
        ORDER BY created_at DESC 
        LIMIT ?
    ''', (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    products = []
    for row in rows:
        product = {
            'id': row[0],
            'urun_adi': row[1],
            'urun_aciklama': row[2],
            'urun_adi_en': row[3],
            'visual_representation': row[4],
            'image_base64': row[5],
            'tags': json.loads(row[6]) if row[6] else [],
            'confidence_score': row[7],
            'category': row[8],
            'created_at': row[9]
        }
        products.append(product)
    
    return products

def search_products_by_visual_description(query: str, limit: int = 10) -> List[dict]:
    """Visual description'larda arama yap"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, urun_adi, urun_aciklama, urun_adi_en, 
               visual_representation, image_base64, tags, 
               confidence_score, category, created_at
        FROM products 
        WHERE visual_representation LIKE ? 
           OR urun_adi LIKE ? 
           OR urun_aciklama LIKE ?
        ORDER BY created_at DESC 
        LIMIT ?
    ''', (f'%{query}%', f'%{query}%', f'%{query}%', limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    products = []
    for row in rows:
        product = {
            'id': row[0],
            'urun_adi': row[1],
            'urun_aciklama': row[2],
            'urun_adi_en': row[3],
            'visual_representation': row[4],
            'image_base64': row[5],
            'tags': json.loads(row[6]) if row[6] else [],
            'confidence_score': row[7],
            'category': row[8],
            'created_at': row[9]
        }
        products.append(product)
    
    return products

def resize_image(image_bytes: bytes, size: tuple[int, int] = (256, 256)) -> bytes:
    """Resizes an image to the specified size."""
    with Image.open(BytesIO(image_bytes)) as img:
        img.thumbnail(size)
        buf = BytesIO()
        img.save(buf, format='PNG')
        return buf.getvalue()

def generate_image_with_vertex(prompt: str, negative_prompt: str) -> str | None:
    """Generates an image using Vertex AI, resizes it, and returns it as a Base64 encoded string."""
    try:
        model = ImageGenerationModel.from_pretrained("imagegeneration@006")
        response = model.generate_images(
            prompt=prompt,
            number_of_images=1,
            aspect_ratio="1:1",
            negative_prompt=negative_prompt,
        )
        if response.images:
            image_bytes = response.images[0]._image_bytes
            # Resize the image before encoding
            resized_image_bytes = resize_image(image_bytes)
            return base64.b64encode(resized_image_bytes).decode('utf-8')
        return None
    except Exception as e:
        print(f"Error during Vertex AI image generation: {e}")
        return None


def ask_llm_for_safer_prompt(original_representation: str) -> str:
    """If the initial visual representation fails, ask the text LLM to create a simpler, safer version."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "a generic product" # Fallback if key is missing

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={api_key}"
    
    prompt_for_llm = (
        f"The following visual description for an image generation AI failed, likely due to safety filters or being too complex: '{original_representation}'. "
        "Please rewrite this into a shorter, simpler, safer, and more direct visual description of the core product. "
        "Focus on the main object. Do not add extra commentary. Give me only the new description."
    )
    
    payload = {"contents": [{"parts": [{"text": prompt_for_llm}]}]}
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        safer_prompt = response.json()['candidates'][0]['content']['parts'][0]['text']
        print(f"LLM generated a safer prompt: '{safer_prompt}'")
        return safer_prompt
    except Exception as e:
        print(f"Could not get a safer prompt from LLM, falling back to product name. Error: {e}")
        return "a generic, new, and clean product"


def generate_and_encode_image(product: dict) -> dict:
    """Task function to generate an image for a single product and add the base64 string to it. Includes a retry mechanism."""
    
    # --- Primary Attempt using detailed visual representation ---
    visual_description = product.get('visual_representation')
    if not visual_description:
        subject = product.get('urun_adi_en') or product.get('urun_adi', 'product')
        visual_description = f"a generic, new, and clean {subject}"
    
    style_prompt = (
        f"Professional product photograph of {visual_description}. "
        "The product is shown by itself, isolated on a seamless, solid pure white background. "
        "The entire product must be fully visible and centered in the frame, not cropped or cut off. "
        "Shot in a professional photo studio with bright, soft, even commercial lighting. "
        "Photorealistic, hyper-detailed, 4K, e-commerce style, online marketplace photo."
    )
    
    negative_style_prompt = (
        "text, words, logo, branding, labels, writing, signature, watermark, packaging with text, "
        "people, person, human, hands, fingers, faces"
        "clutter, messy, floor, table, shadows, complex background, real-world environment, "
        "3D render, CGI, drawing, sketch, illustration, cartoon, painting, art, unrealistic"
    )

    base64_image = generate_image_with_vertex(
        prompt=style_prompt,
        negative_prompt=negative_style_prompt
    )
    
    # --- Fallback Attempt if the first one fails ---
    if base64_image is None:
        print(f"Primary image generation failed for '{product.get('urun_adi')}', '{product.get('visual_representation')}' . Asking LLM for a safer prompt.")
        
        # Ask the text LLM to refine the failing prompt
        safer_visual_description = ask_llm_for_safer_prompt(visual_description)
        
        # Retry with the new, safer prompt
        safer_style_prompt = (
            f"Professional product photograph of {safer_visual_description}. "
            "The entire product must be fully visible and centered in the frame, not cropped or cut off. "
            "The product is perfectly isolated on a seamless, solid pure white background. "
            "Shot in a professional photo studio with bright, soft, even commercial lighting. "
            "Photorealistic, hyper-detailed, 4K, e-commerce style, online marketplace photo."
        )
        
        base64_image = generate_image_with_vertex(
            prompt=safer_style_prompt,
            negative_prompt=negative_style_prompt
        )
        
        # If it still fails, use a final, super-safe fallback
        if base64_image is None:
            print("LLM-assisted retry also failed. Using a generic prompt as a last resort.")
            subject = product.get('urun_adi_en') or product.get('urun_adi', 'product')
            super_safe_prompt = f"Professional product photograph of a generic {subject}."
            base64_image = generate_image_with_vertex(
                prompt=super_safe_prompt,
                negative_prompt=negative_style_prompt
            )

    product['image_base64'] = base64_image
    return product


@router.post("/generate_tags_with_visual", response_model=TagGenerationResponse)
async def generate_tags_with_visual(req: TagGenerationRequest):
    """
    Visual description kullanarak tag üret
    
    Args:
        req: Request containing product information and visual description
        
    Returns:
        Generated tags with visual description metadata
    """
    try:
        # Session ID oluştur
        session_id = str(uuid.uuid4())
        
        # Agent'ları visual description ile çalıştır
        result = await run_tag_generation_with_visual(
            product=req.product,
            visual_description=req.visual_description,
            session_id=session_id
        )
        
        return TagGenerationResponse(
            tags=result.get('tags', []),
            confidence=result.get('confidence', 0.0),
            category=result.get('category', 'unknown'),
            reasoning=result.get('reasoning', 'No reasoning provided'),
            visual_description_used=result.get('visual_description_used', req.visual_description)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tag generation with visual description failed: {e}")

@router.post("/save_products")
def save_products(req: SaveProductRequest):
    """
    Ürün kartlarını veritabanına kaydet
    
    Args:
        req: Request containing list of products to save
        
    Returns:
        Success message with saved product IDs
    """
    try:
        saved_ids = []
        for product in req.products:
            product_id = save_product_to_db(product)
            saved_ids.append(product_id)
        
        return {
            "success": True, 
            "message": f"{len(saved_ids)} products saved successfully",
            "product_ids": saved_ids
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save products: {e}")

@router.get("/products", response_model=ProductCollection)
def get_products(limit: int = 10):
    """
    Kayıtlı ürünleri getir
    
    Args:
        limit: Maximum number of products to return
        
    Returns:
        List of saved products
    """
    try:
        products = get_products_from_db(limit)
        return ProductCollection(
            number_of_cards=len(products),
            products=products
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve products: {e}")

@router.post("/search_products", response_model=ProductCollection)
def search_products(req: ProductQueryRequest):
    """
    Visual description'larda arama yap
    
    Args:
        req: Request containing search query and limit
        
    Returns:
        Matching products
    """
    try:
        products = search_products_by_visual_description(req.query, req.limit)
        return ProductCollection(
            number_of_cards=len(products),
            products=products
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search products: {e}")

@router.get("/visual_descriptions")
def get_all_visual_descriptions(limit: int = 50):
    """
    Tüm visual description'ları getir (agent'lar için veri kaynağı)
    
    Args:
        limit: Maximum number of descriptions to return
        
    Returns:
        List of visual descriptions with product context
    """
    try:
        products = get_products_from_db(limit)
        descriptions = []
        
        for product in products:
            if product.get('visual_representation'):
                descriptions.append({
                    'product_id': product['id'],
                    'product_name': product['urun_adi'],
                    'visual_description': product['visual_representation'],
                    'existing_tags': product.get('tags', []),
                    'category': product.get('category')
                })
        
        return {
            "success": True,
            "count": len(descriptions),
            "visual_descriptions": descriptions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve visual descriptions: {e}")

@router.post("/generate_tags")
def generate_tags(req: ProductTagRequest):
    """
    Generate tags for a given product.
    
    Args:
        req: Request containing product information
        
    Returns:
        Product with generated tags
    """
    try:
        # Process the product to generate tags
        product_with_tags = process_product_for_tags(req.product)
        
        return {"success": True, "product_with_tags": product_with_tags}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tag generation failed: {e}")

@router.post("/gemini_suggestions")
def gemini_suggestions(req: DescriptionRequest):
    # --- Environment Variable Checks ---
    api_key = os.getenv("GEMINI_API_KEY")
    project_id = os.getenv("GCP_PROJECT_ID")
    location = os.getenv("GCP_REGION")

    if not all([api_key, project_id, location]):
        raise HTTPException(status_code=500, detail="Required environment variables (GEMINI_API_KEY, GCP_PROJECT_ID, GCP_REGION) are not set.")

    # --- Initialize Vertex AI ---
    try:
        vertexai.init(project=project_id, location=location)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize Vertex AI: {e}")


    # --- AŞAMA 1: SİSTEM TALİMATINI GÜNCELLEME ---
    system_instructions = (
        "Sen bir e-ticaret asistanısın. Sana ürün ismi unutan insanlar gelip belirsiz kelimelerle ürünlerini tanımlar. "
        "Önce, kaç tane ürün önereceğini belirle (2, 3 veya 4). Eğer kullanıcının tarifi çok spesifikse 2, orta düzeyde açıksa 3, çok genişse ve birbirinden farklı viable seçenekler bulabiliyorsan 4 öneri yap. "
        "Bu sayıyı 'number_of_cards' alanında belirt. "
        "Bu önerileri, kullanıcının tarifine en çok uyandan en az uyana doğru sıralamalısın. "
        "Sonucu sadece JSON formatında döndür. JSON şu yapıda olmalı: { 'number_of_cards': [2, 3 veya 4], 'urunler': [...] }. "
        "Her ürün listesi objesi 'urun_adi' (Türkçe), 'urun_aciklama' (Türkçe), 'urun_adi_en' (İngilizce) ve 'visual_representation' (İngilizce) alanları içermelidir. "
        "Bu 'visual_representation' alanı, bir görsel üretim yapay zekası için talimattır. Ürünün markasız, jenerik bir versiyonunun nasıl göründüğünü detaylıca tarif etmelidir. Üründe renk sınırlaması yoktur. "
        "Örneğin, 'derz dolgusu' için 'a tube of thick paste-like grout filler with a nozzle at the end, shown next to a small amount of the product squeezed out' gibi bir tanım olmalıdır. "
        "Bu tanım, ürünün fiziksel özelliklerini, şeklini ve materyalini içermeli ancak marka, yazı veya logo içermemelidir. "
        "Ayrıca, bu tanım ürünün tamamının görüneceği ve hiçbir parçasının kırpılmayacağı/kesilmeyeceği şekilde yapılmalıdır. "
        "JSON dışında kesinlikle başka metin ekleme."
    )

    
    combined_prompt = f"{system_instructions}\n\nKullanıcı tarifi: '{req.description}'"
    text_generation_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": combined_prompt}]}]}

    try:
        # --- Text Generation ---
        response = requests.post(text_generation_url, json=payload, timeout=90)
        response.raise_for_status()

        gemini_response_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        if gemini_response_text.strip().startswith("```json"):
            gemini_response_text = gemini_response_text.strip()[7:-3].strip()
        
        product_data = json.loads(gemini_response_text)
        number_of_cards = product_data.get("number_of_cards", 4)
        products = product_data.get("urunler", [])
        
        # Ensure we don't exceed the specified number of cards
        products = products[:number_of_cards]

        print(f"Number of cards: {number_of_cards}")
        print(products)
        
        # --- Concurrent Image Generation ---
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit all image generation tasks to the thread pool
            future_to_product = {executor.submit(generate_and_encode_image, p): p for p in products}
            
            # Collect results as they complete
            updated_products = []
            for future in as_completed(future_to_product):
                try:
                    updated_product = future.result()
                    updated_products.append(updated_product)
                    print(f"Added product: {updated_product.get('urun_adi')} - Total so far: {len(updated_products)}")
                except Exception as exc:
                    print(f"A product image generation task generated an exception: {exc}")
                    # Optionally, you can add the original product without an image
                    original_product = future_to_product[future]
                    original_product['image_base64'] = None
                    updated_products.append(original_product)
                    print(f"Added failed product: {original_product.get('urun_adi')} - Total so far: {len(updated_products)}")
            
            print(f"Final response: number_of_cards={number_of_cards}, products_count={len(updated_products)}")
            
            # Otomatik olarak ürünleri kaydet (isteğe bağlı)
            # save_request = SaveProductRequest(products=updated_products)
            # save_products(save_request)
            
            return {"number_of_cards": number_of_cards, "products": updated_products}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"API request failed: {e}")
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {e}, Response Text: {gemini_response_text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")