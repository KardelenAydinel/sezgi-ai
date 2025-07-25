"""
Database module for product and e-commerce data management.
Contains all database initialization, CRUD operations and search functionality.
"""
import json
import sqlite3
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.models import EcommerceProduct

# Database paths
DB_PATH = Path(__file__).parent / "data" / "products.db"
ECOMMERCE_DB_PATH = Path(__file__).parent / "data" / "ecommerce.db"

# Ensure data directory exists
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

def get_all_ecommerce_products(limit: int = 20) -> List[EcommerceProduct]:
    """Tüm e-ticaret ürünlerini getir"""
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
    
    return products

def initialize_all_databases():
    """Tüm veritabanlarını başlat"""
    print("Initializing databases...")
    init_database()
    init_ecommerce_database()
    print("Databases initialized successfully!") 