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
import time

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
from app.models import (ProductCard, ProductCollection, TagGenerationRequest, 
                       TagGenerationResponse, EcommerceProduct, SearchRequest, SearchResponse)

router = APIRouter()

# Database setup
DB_PATH = Path(__file__).parent / "data" / "products.db"
ECOMMERCE_DB_PATH = Path(__file__).parent / "data" / "ecommerce.db"
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

def init_ecommerce_database():
    """Initialize the e-commerce database with dummy products"""
    conn = sqlite3.connect(ECOMMERCE_DB_PATH)
    cursor = conn.cursor()
    
    # Create e-commerce products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ecommerce_products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            currency TEXT DEFAULT 'TL',
            image_url TEXT,
            tags TEXT,  -- JSON string
            category TEXT,
            subcategory TEXT,
            brand TEXT,
            stock INTEGER DEFAULT 0,
            rating REAL,
            review_count INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Check if we already have products
    cursor.execute('SELECT COUNT(*) FROM ecommerce_products')
    if cursor.fetchone()[0] == 0:
        # Insert dummy products
        dummy_products = [
            {
                'id': str(uuid.uuid4()),
                'name': 'Beyaz Derz Dolgusu - Premium',
                'description': 'Su geçirmez, esnek yapıda profesyonel derz dolgusu. Banyo ve mutfak uygulamaları için ideal.',
                'price': 25.90,
                'image_url': 'https://example.com/derz1.jpg',
                'tags': json.dumps(['derz_dolgusu', 'beyaz_derz', 'banyo_aksesuari', 'su_gecirmez', 'esnek_yapi']),
                'category': 'Yapı Malzemeleri',
                'subcategory': 'Derz Dolgular',
                'brand': 'BuildPro',
                'stock': 150,
                'rating': 4.5,
                'review_count': 89
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Fayans Arası Derz Macunu',
                'description': 'Profesyonel kullanım için özel formülasyon. Antibakteriyel özellik ile hijyenik koruma.',
                'price': 19.90,
                'image_url': 'https://example.com/derz2.jpg',
                'tags': json.dumps(['fayans_dolgusu', 'derz_macunu', 'antibakteriyel', 'hijyenik', 'profesyonel']),
                'category': 'Yapı Malzemeleri',
                'subcategory': 'Derz Dolgular',
                'brand': 'TilePro',
                'stock': 200,
                'rating': 4.3,
                'review_count': 156
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Silikon Derz Dolgusu Tüp',
                'description': 'Hassas uygulama için özel başlıklı tüp. Küf direnci olan formülasyon.',
                'price': 15.50,
                'image_url': 'https://example.com/derz3.jpg',
                'tags': json.dumps(['hassas_uygulama_derz', 'plastik_tüp_derz', 'silikon_derz', 'küf_direnci']),
                'category': 'Yapı Malzemeleri',
                'subcategory': 'Derz Dolgular',
                'brand': 'SealMaster',
                'stock': 75,
                'rating': 4.7,
                'review_count': 203
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Suya Dayanıklı Banyo Derzi',
                'description': 'Özel banyo formülasyonu. Uzun ömürlü ve renk değişimi yapmayan yapısı.',
                'price': 32.00,
                'image_url': 'https://example.com/derz4.jpg',
                'tags': json.dumps(['banyo_derz_dolgusu', 'suya_dayanıklı_derz', 'uzun_omurlu', 'renk_sabiti']),
                'category': 'Yapı Malzemeleri',
                'subcategory': 'Derz Dolgular',
                'brand': 'AquaSeal',
                'stock': 120,
                'rating': 4.6,
                'review_count': 178
            },
            # Farklı kategorilerden ürünler ekleyelim
            {
                'id': str(uuid.uuid4()),
                'name': 'Modern Banyo Aksesuarı Seti',
                'description': 'Paslanmaz çelik banyo aksesuarı seti. Minimalist tasarım ve uzun ömürlü.',
                'price': 89.90,
                'image_url': 'https://example.com/banyo1.jpg',
                'tags': json.dumps(['banyo_aksesuari', 'paslanmaz_celik', 'modern_tasarim', 'minimalist']),
                'category': 'Banyo',
                'subcategory': 'Aksesuarlar',
                'brand': 'ModernHome',
                'stock': 45,
                'rating': 4.4,
                'review_count': 92
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Profesyonel Mutfak Temizleyici',
                'description': 'Yağ çözücü özellik ile mutfak yüzeylerini etkili temizler. Doğal içerikli.',
                'price': 12.75,
                'image_url': 'https://example.com/mutfak1.jpg',
                'tags': json.dumps(['mutfak_gereci', 'temizlik_urun', 'yag_cozucu', 'dogal_icerikli']),
                'category': 'Temizlik',
                'subcategory': 'Mutfak Temizlik',
                'brand': 'CleanMax',
                'stock': 300,
                'rating': 4.2,
                'review_count': 445
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Ev Dekorasyon Duvar Sticker',
                'description': 'Çıkarılabilir duvar süsleme sticker\'ı. Çocuk odaları için güvenli.',
                'price': 24.90,
                'image_url': 'https://example.com/dekor1.jpg',
                'tags': json.dumps(['ev_dekorasyonu', 'duvar_susleme', 'cikarilabilir', 'cocuk_guvenli']),
                'category': 'Dekorasyon',
                'subcategory': 'Duvar Süslemeleri',
                'brand': 'DecoArt',
                'stock': 80,
                'rating': 4.1,
                'review_count': 67
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Yapıştırıcı Güçlendirici',
                'description': 'Çok amaçlı yapıştırıcı. Metal, plastik ve ahşap için uygun.',
                'price': 18.60,
                'image_url': 'https://example.com/yapi1.jpg',
                'tags': json.dumps(['yapi_malzeme', 'cok_amacli', 'metal_uyumlu', 'plastik_uyumlu', 'ahsap_uyumlu']),
                'category': 'Yapı Malzemeleri',
                'subcategory': 'Yapıştırıcılar',
                'brand': 'FixAll',
                'stock': 95,
                'rating': 4.8,
                'review_count': 234
            }
        ]
        
        for product in dummy_products:
            cursor.execute('''
                INSERT INTO ecommerce_products 
                (id, name, description, price, currency, image_url, tags, category, subcategory, brand, stock, rating, review_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                product['id'], product['name'], product['description'], product['price'], 
                'TL', product['image_url'], product['tags'], product['category'], 
                product['subcategory'], product['brand'], product['stock'], 
                product['rating'], product['review_count']
            ))
    
    conn.commit()
    conn.close()

def search_products_by_tags(search_tags: List[str], limit: int = 4, min_price: float = None, 
                           max_price: float = None, category: str = None) -> List[EcommerceProduct]:
    """Tag'lere göre ürün arama"""
    conn = sqlite3.connect(ECOMMERCE_DB_PATH)
    cursor = conn.cursor()
    
    # Base query
    query = '''
        SELECT id, name, description, price, currency, image_url, tags, category, 
               subcategory, brand, stock, rating, review_count
        FROM ecommerce_products 
        WHERE stock > 0
    '''
    params = []
    
    # Price filters
    if min_price is not None:
        query += ' AND price >= ?'
        params.append(min_price)
    
    if max_price is not None:
        query += ' AND price <= ?'
        params.append(max_price)
    
    # Category filter
    if category:
        query += ' AND category = ?'
        params.append(category)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    # Calculate tag similarity and score products
    products_with_scores = []
    
    for row in rows:
        product_tags = json.loads(row[6]) if row[6] else []
        
        # Calculate similarity score (intersection of tags)
        matching_tags = set(search_tags) & set(product_tags)
        similarity_score = len(matching_tags) / max(len(search_tags), 1)
        
        # Boost score if multiple tags match
        if len(matching_tags) >= 2:
            similarity_score *= 1.5
        
        # Add slight random factor to avoid always same results
        import random
        similarity_score += random.uniform(0, 0.1)
        
        if similarity_score > 0:  # Only include products with at least one matching tag
            product = EcommerceProduct(
                id=row[0],
                name=row[1],
                description=row[2],
                price=row[3],
                currency=row[4],
                image_url=row[5],
                tags=product_tags,
                category=row[7],
                subcategory=row[8],
                brand=row[9],
                stock=row[10],
                rating=row[11],
                review_count=row[12]
            )
            products_with_scores.append((product, similarity_score))
    
    # Sort by similarity score and return top results
    products_with_scores.sort(key=lambda x: x[1], reverse=True)
    return [product for product, score in products_with_scores[:limit]]

# Initialize databases on startup
init_database()
init_ecommerce_database()

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


@router.post("/search_ecommerce", response_model=SearchResponse)
def search_ecommerce_products(req: SearchRequest):
    """
    Tag'lere göre e-ticaret ürünlerinde arama yap
    
    Args:
        req: Arama kriterleri
        
    Returns:
        Bulunan ürünler ve arama bilgileri
    """
    try:
        start_time = time.time()
        
        products = search_products_by_tags(
            search_tags=req.tags,
            limit=req.limit,
            min_price=req.min_price,
            max_price=req.max_price,
            category=req.category
        )
        
        execution_time = time.time() - start_time
        
        return SearchResponse(
            products=products,
            total_found=len(products),
            search_tags=req.tags,
            execution_time=execution_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

@router.get("/ecommerce_products", response_model=SearchResponse)
def get_all_ecommerce_products(limit: int = 20):
    """
    Tüm e-ticaret ürünlerini getir
    
    Args:
        limit: Maksimum ürün sayısı
        
    Returns:
        Ürün listesi
    """
    try:
        conn = sqlite3.connect(ECOMMERCE_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, description, price, currency, image_url, tags, category, 
                   subcategory, brand, stock, rating, review_count
            FROM ecommerce_products 
            WHERE stock > 0
            ORDER BY rating DESC, review_count DESC
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        products = []
        for row in rows:
            product = EcommerceProduct(
                id=row[0],
                name=row[1],
                description=row[2],
                price=row[3],
                currency=row[4],
                image_url=row[5],
                tags=json.loads(row[6]) if row[6] else [],
                category=row[7],
                subcategory=row[8],
                brand=row[9],
                stock=row[10],
                rating=row[11],
                review_count=row[12]
            )
            products.append(product)
        
        return SearchResponse(
            products=products,
            total_found=len(products),
            search_tags=[],
            execution_time=0.0
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get products: {e}")

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