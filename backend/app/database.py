"""
Database module for product and e-commerce data management.
Contains all database initialization, CRUD operations and search functionality.
"""
import json
import sqlite3
import uuid
import csv
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models import EcommerceProduct

# Database paths
DB_PATH = Path(__file__).parent / "data" / "products.db"
ECOMMERCE_DB_PATH = Path(__file__).parent / "data" / "ecommerce.db"
CSV_PATH = Path(__file__).parent / "ecommerce_products.csv"

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
            common_queries TEXT,  -- JSON string for common search queries
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Check if we already have products
    cursor.execute('SELECT COUNT(*) FROM ecommerce_products')
    if cursor.fetchone()[0] == 0:
        # Insert dummy products
        dummy_products = [
            # C Yan Sehpalar
            {
                'id': str(uuid.uuid4()),
                'name': 'Modern C Yan Sehpa - Siyah',
                'description': 'Minimalist tasarımlı, koltuk yanına kolayca yerleştirilebilen C şeklinde yan sehpa.',
                'price': 249.90,
                'image_url': 'https://example.com/c-sehpa1.jpg',
                'tags': json.dumps(['c_sehpa', 'yan_sehpa', 'modern_mobilya', 'minimalist', 'siyah_sehpa']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'ModernLine',
                'stock': 25,
                'rating': 4.7,
                'review_count': 156
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Ahşap Detaylı C Yan Sehpa',
                'description': 'Metal gövde ve ahşap tablalı şık C sehpa. Koltuk yanı kullanım için ideal.',
                'price': 299.90,
                'image_url': 'https://example.com/c-sehpa2.jpg',
                'tags': json.dumps(['c_sehpa', 'ahsap_sehpa', 'metal_sehpa', 'yan_sehpa', 'modern_mobilya']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'WoodLife',
                'stock': 15,
                'rating': 4.8,
                'review_count': 92
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Cam Tablalı C Yan Sehpa',
                'description': 'Şeffaf temperli cam tabla ve krom metal gövdeli modern C sehpa.',
                'price': 349.90,
                'image_url': 'https://example.com/c-sehpa3.jpg',
                'tags': json.dumps(['c_sehpa', 'cam_sehpa', 'krom_sehpa', 'modern_mobilya', 'yan_sehpa']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'GlassModern',
                'stock': 20,
                'rating': 4.6,
                'review_count': 78
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Beyaz C Yan Sehpa',
                'description': 'Mat beyaz boyalı, minimalist C sehpa. Her tarza uyumlu tasarım.',
                'price': 279.90,
                'image_url': 'https://example.com/c-sehpa4.jpg',
                'tags': json.dumps(['c_sehpa', 'beyaz_sehpa', 'minimalist', 'yan_sehpa', 'modern_mobilya']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'ModernLine',
                'stock': 30,
                'rating': 4.5,
                'review_count': 124
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Gold C Yan Sehpa',
                'description': 'Gold renk metal gövde ve siyah cam tablalı lüks C sehpa.',
                'price': 399.90,
                'image_url': 'https://example.com/c-sehpa5.jpg',
                'tags': json.dumps(['c_sehpa', 'luks_sehpa', 'gold_sehpa', 'cam_tabla', 'yan_sehpa']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'LuxuryLine',
                'stock': 10,
                'rating': 4.9,
                'review_count': 45
            },
            
            # Kucak Sehpaları
            {
                'id': str(uuid.uuid4()),
                'name': 'Ayarlanabilir Kucak Sehpası - Siyah',
                'description': 'Yüksekliği ayarlanabilir, tekerlekli kucak sehpası. Laptop ve tablet kullanımı için ideal.',
                'price': 189.90,
                'image_url': 'https://example.com/kucak1.jpg',
                'tags': json.dumps(['kucak_sehpasi', 'laptop_sehpasi', 'ayarlanabilir_sehpa', 'tekerlekli_sehpa']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'ComfortDesk',
                'stock': 40,
                'rating': 4.7,
                'review_count': 234
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Ahşap Kucak Sehpası',
                'description': 'Doğal ahşap malzemeden üretilmiş, hafif ve şık kucak sehpası.',
                'price': 159.90,
                'image_url': 'https://example.com/kucak2.jpg',
                'tags': json.dumps(['kucak_sehpasi', 'ahsap_sehpa', 'hafif_sehpa', 'dogal_ahsap']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'WoodLife',
                'stock': 25,
                'rating': 4.6,
                'review_count': 167
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Katlanabilir Kucak Sehpası',
                'description': 'Kolay taşınabilir ve katlanabilir özellikli kompakt kucak sehpası.',
                'price': 129.90,
                'image_url': 'https://example.com/kucak3.jpg',
                'tags': json.dumps(['kucak_sehpasi', 'katlanabilir_sehpa', 'portatif_sehpa', 'kompakt_sehpa']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'SmartFurniture',
                'stock': 50,
                'rating': 4.5,
                'review_count': 312
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Çok Fonksiyonlu Kucak Sehpası',
                'description': 'Bardak tutucu ve tablet standı özellikli premium kucak sehpası.',
                'price': 219.90,
                'image_url': 'https://example.com/kucak4.jpg',
                'tags': json.dumps(['kucak_sehpasi', 'cok_fonksiyonlu', 'tablet_standi', 'premium_sehpa']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'MultiDesk',
                'stock': 20,
                'rating': 4.8,
                'review_count': 145
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Minimal Kucak Sehpası',
                'description': 'Sade tasarımlı, hafif ve dayanıklı kucak sehpası.',
                'price': 149.90,
                'image_url': 'https://example.com/kucak5.jpg',
                'tags': json.dumps(['kucak_sehpasi', 'minimal_sehpa', 'hafif_sehpa', 'sade_tasarim']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'ModernLine',
                'stock': 35,
                'rating': 4.4,
                'review_count': 189
            },
            
            # Normal Sehpalar
            {
                'id': str(uuid.uuid4()),
                'name': 'Modern Orta Sehpa',
                'description': 'Geniş tablalı, modern tasarımlı oturma odası orta sehpası.',
                'price': 449.90,
                'image_url': 'https://example.com/sehpa1.jpg',
                'tags': json.dumps(['orta_sehpa', 'modern_sehpa', 'salon_sehpasi', 'genis_tabla']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'ModernLine',
                'stock': 15,
                'rating': 4.7,
                'review_count': 234
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Ahşap Kare Sehpa',
                'description': 'Masif ahşaptan üretilmiş, klasik tasarımlı kare sehpa.',
                'price': 399.90,
                'image_url': 'https://example.com/sehpa2.jpg',
                'tags': json.dumps(['kare_sehpa', 'ahsap_sehpa', 'klasik_sehpa', 'masif_ahsap']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'WoodLife',
                'stock': 20,
                'rating': 4.8,
                'review_count': 167
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Cam Orta Sehpa',
                'description': 'Temperli cam ve metal ayaklı modern orta sehpa.',
                'price': 549.90,
                'image_url': 'https://example.com/sehpa3.jpg',
                'tags': json.dumps(['orta_sehpa', 'cam_sehpa', 'metal_ayakli', 'modern_tasarim']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'GlassModern',
                'stock': 10,
                'rating': 4.6,
                'review_count': 145
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Yuvarlak Orta Sehpa',
                'description': 'Modern tasarımlı, yuvarlak formlu orta sehpa.',
                'price': 479.90,
                'image_url': 'https://example.com/sehpa4.jpg',
                'tags': json.dumps(['yuvarlak_sehpa', 'orta_sehpa', 'modern_sehpa', 'salon_sehpasi']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'ModernLine',
                'stock': 25,
                'rating': 4.5,
                'review_count': 189
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Endüstriyel Orta Sehpa',
                'description': 'Metal ve ahşap kombinli endüstriyel tasarım orta sehpa.',
                'price': 529.90,
                'image_url': 'https://example.com/sehpa5.jpg',
                'tags': json.dumps(['endustriyel_sehpa', 'metal_ahsap', 'orta_sehpa', 'modern_tasarim']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'IndustrialDesign',
                'stock': 15,
                'rating': 4.7,
                'review_count': 156
            },
            
            # Zigon Sehpalar
            {
                'id': str(uuid.uuid4()),
                'name': 'Modern Zigon Sehpa Seti',
                'description': '3\'lü modern tasarımlı zigon sehpa seti.',
                'price': 599.90,
                'image_url': 'https://example.com/zigon1.jpg',
                'tags': json.dumps(['zigon_sehpa', 'sehpa_seti', 'modern_sehpa', '3lu_sehpa']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'ModernLine',
                'stock': 10,
                'rating': 4.8,
                'review_count': 123
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Ahşap Zigon Sehpa',
                'description': 'Doğal ahşap kaplamalı 3\'lü zigon sehpa takımı.',
                'price': 649.90,
                'image_url': 'https://example.com/zigon2.jpg',
                'tags': json.dumps(['zigon_sehpa', 'ahsap_sehpa', 'sehpa_takimi', 'dogal_ahsap']),
                'category': 'Mobilya',
                'subcategory': 'Sehpalar',
                'brand': 'WoodLife',
                'stock': 8,
                'rating': 4.7,
                'review_count': 98
            },
            
            # Yemek Masası
            {
                'id': str(uuid.uuid4()),
                'name': 'Modern Yemek Masası',
                'description': '6 kişilik, açılabilir modern yemek masası.',
                'price': 1299.90,
                'image_url': 'https://example.com/masa1.jpg',
                'tags': json.dumps(['yemek_masasi', 'acilabilir_masa', 'modern_masa', '6_kisilik']),
                'category': 'Mobilya',
                'subcategory': 'Masalar',
                'brand': 'ModernLine',
                'stock': 5,
                'rating': 4.9,
                'review_count': 87
            },
            
            # Silikon Mastikler
            {
                'id': str(uuid.uuid4()),
                'name': 'Şeffaf Silikon Mastik',
                'description': 'Genel amaçlı, şeffaf silikon mastik. Su geçirmez özellikli.',
                'price': 49.90,
                'image_url': 'https://example.com/mastik1.jpg',
                'tags': json.dumps(['silikon_mastik', 'seffaf_silikon', 'su_gecirmez', 'genel_amacli']),
                'category': 'Yapı Market',
                'subcategory': 'Yapı Kimyasalları',
                'brand': 'SealMaster',
                'stock': 100,
                'rating': 4.6,
                'review_count': 234
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Beyaz Silikon Mastik',
                'description': 'Banyo ve mutfak için özel formüllü beyaz silikon mastik.',
                'price': 54.90,
                'image_url': 'https://example.com/mastik2.jpg',
                'tags': json.dumps(['silikon_mastik', 'beyaz_silikon', 'banyo_silikonu', 'mutfak_silikonu']),
                'category': 'Yapı Market',
                'subcategory': 'Yapı Kimyasalları',
                'brand': 'SealMaster',
                'stock': 80,
                'rating': 4.7,
                'review_count': 189
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Akvaryum Silikonu',
                'description': 'Akvaryum için özel üretilmiş, yüksek mukavemetli silikon.',
                'price': 79.90,
                'image_url': 'https://example.com/mastik3.jpg',
                'tags': json.dumps(['silikon_mastik', 'akvaryum_silikonu', 'yuksek_mukavemet', 'ozel_silikon']),
                'category': 'Yapı Market',
                'subcategory': 'Yapı Kimyasalları',
                'brand': 'AquaSeal',
                'stock': 50,
                'rating': 4.8,
                'review_count': 156
            },
            
            # Kulaklıklar
            {
                'id': str(uuid.uuid4()),
                'name': 'Pro Gaming Kulaklık',
                'description': 'Profesyonel oyuncular için tasarlanmış kablolu gaming kulaklık.',
                'price': 699.90,
                'image_url': 'https://example.com/kulaklik1.jpg',
                'tags': json.dumps(['kablolu_kulaklik', 'gaming_kulaklik', 'profesyonel_kulaklik', '7_1_ses']),
                'category': 'Elektronik',
                'subcategory': 'Kulaklıklar',
                'brand': 'GamePro',
                'stock': 30,
                'rating': 4.8,
                'review_count': 456
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Stüdyo Referans Kulaklık',
                'description': 'Profesyonel stüdyo kullanımı için referans kulaklık.',
                'price': 1299.90,
                'image_url': 'https://example.com/kulaklik2.jpg',
                'tags': json.dumps(['kablolu_kulaklik', 'studyo_kulaklik', 'referans_kulaklik', 'profesyonel']),
                'category': 'Elektronik',
                'subcategory': 'Kulaklıklar',
                'brand': 'StudioPro',
                'stock': 15,
                'rating': 4.9,
                'review_count': 234
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Premium Bluetooth Kulaklık',
                'description': 'Aktif gürültü önleme özellikli premium bluetooth kulaklık.',
                'price': 899.90,
                'image_url': 'https://example.com/kulaklik3.jpg',
                'tags': json.dumps(['bluetooth_kulaklik', 'kablosuz_kulaklik', 'gurultu_onleme', 'premium']),
                'category': 'Elektronik',
                'subcategory': 'Kulaklıklar',
                'brand': 'SoundMaster',
                'stock': 25,
                'rating': 4.7,
                'review_count': 345
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Sport Bluetooth Kulaklık',
                'description': 'Ter ve su dirençli spor bluetooth kulaklık.',
                'price': 449.90,
                'image_url': 'https://example.com/kulaklik4.jpg',
                'tags': json.dumps(['bluetooth_kulaklik', 'spor_kulaklik', 'su_direncli', 'kablosuz']),
                'category': 'Elektronik',
                'subcategory': 'Kulaklıklar',
                'brand': 'SportSound',
                'stock': 40,
                'rating': 4.6,
                'review_count': 289
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Mini TWS Bluetooth Kulaklık',
                'description': 'Kompakt tasarımlı, şarj kutulu gerçek kablosuz kulaklık.',
                'price': 349.90,
                'image_url': 'https://example.com/kulaklik5.jpg',
                'tags': json.dumps(['bluetooth_kulaklik', 'tws_kulaklik', 'kablosuz_kulaklik', 'kompakt']),
                'category': 'Elektronik',
                'subcategory': 'Kulaklıklar',
                'brand': 'TechSound',
                'stock': 50,
                'rating': 4.5,
                'review_count': 412
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Kemik İletimli Spor Kulaklık',
                'description': 'Sporculara özel tasarlanmış kemik iletim teknolojili kulaklık.',
                'price': 799.90,
                'image_url': 'https://example.com/kulaklik6.jpg',
                'tags': json.dumps(['kemik_iletimli', 'spor_kulaklik', 'bluetooth_kulaklik', 'ozel_tasarim']),
                'category': 'Elektronik',
                'subcategory': 'Kulaklıklar',
                'brand': 'BoneTech',
                'stock': 20,
                'rating': 4.7,
                'review_count': 167
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Kemik İletimli Yüzücü Kulaklık',
                'description': 'Su altında kullanılabilen, yüzücüler için özel kemik iletimli kulaklık.',
                'price': 899.90,
                'image_url': 'https://example.com/kulaklik7.jpg',
                'tags': json.dumps(['kemik_iletimli', 'su_gecirmez', 'yuzucu_kulaklik', 'ozel_tasarim']),
                'category': 'Elektronik',
                'subcategory': 'Kulaklıklar',
                'brand': 'SwimSound',
                'stock': 15,
                'rating': 4.8,
                'review_count': 134
            },
        ]
        
        # Insert all products
        cursor.executemany('''
            INSERT INTO ecommerce_products (
                id, name, description, price, currency, image_url, tags,
                category, subcategory, brand, stock, rating, review_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', [(
            p['id'], p['name'], p['description'], p['price'],
            p.get('currency', 'TL'), p.get('image_url'), p['tags'],
            p['category'], p.get('subcategory'), p.get('brand'),
            p.get('stock', 0), p.get('rating'), p.get('review_count')
        ) for p in dummy_products])
        
        conn.commit()
    
    conn.close()

def load_ecommerce_data_from_csv():
    """CSV dosyasından e-ticaret ürünlerini yükle"""
    print(f"Loading e-commerce data from CSV: {CSV_PATH}")
    
    if not CSV_PATH.exists():
        print(f"CSV file not found at {CSV_PATH}")
        return []
    
    products = []
    try:
        with open(CSV_PATH, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            
            # İlk satır başlık, ikinci satır sütun isimleri
            if len(lines) < 3:
                print("CSV file has insufficient data")
                return []
            
            # Header'ı parse et (2. satır)
            header_line = lines[1].strip()
            headers = header_line.split(';')
            print(f"CSV Headers: {headers}")
            
            # Veri satırlarını parse et (3. satırdan başlayarak)
            for line_num, line in enumerate(lines[2:], start=3):
                line = line.strip()
                if not line:
                    continue
                    
                try:
                    values = line.split(';')
                    if len(values) != len(headers):
                        print(f"Warning: Line {line_num} has {len(values)} values but expected {len(headers)}")
                        continue
                    
                    # Veriyi dictionary'e dönüştür
                    product_data = dict(zip(headers, values))
                    
                    # JSON stringlerini parse et
                    try:
                        tags_str = product_data.get('tags', '[]')
                        # Remove outer quotes if present
                        if tags_str.startswith('"') and tags_str.endswith('"'):
                            tags_str = tags_str[1:-1]
                        # Fix escaped quotes in CSV
                        tags_str = tags_str.replace('""', '"')
                        tags = json.loads(tags_str)
                    except json.JSONDecodeError:
                        tags = []
                    
                    try:
                        queries_str = product_data.get('common_queries', '[]')
                        # Remove outer quotes if present
                        if queries_str.startswith('"') and queries_str.endswith('"'):
                            queries_str = queries_str[1:-1]
                        # Fix escaped quotes in CSV
                        queries_str = queries_str.replace('""', '"')
                        common_queries = json.loads(queries_str)
                    except json.JSONDecodeError:
                        common_queries = []
                    
                    # Numeric değerleri dönüştür
                    try:
                        price = float(product_data.get('price', 0))
                        stock = int(product_data.get('stock', 0))
                        rating = float(product_data.get('rating', 0)) if product_data.get('rating') else None
                        review_count = int(product_data.get('review_count', 0)) if product_data.get('review_count') else None
                    except ValueError as e:
                        print(f"Warning: Invalid numeric data in line {line_num}: {e}")
                        continue
                    
                    product = {
                        'id': product_data.get('id'),
                        'name': product_data.get('name', ''),
                        'description': product_data.get('description', ''),
                        'price': price,
                        'currency': product_data.get('currency', 'TL'),
                        'image_url': product_data.get('image_url'),
                        'tags': tags,
                        'category': product_data.get('category', ''),
                        'subcategory': product_data.get('subcategory'),
                        'brand': product_data.get('brand'),
                        'stock': stock,
                        'rating': rating,
                        'review_count': review_count,
                        'common_queries': common_queries
                    }
                    
                    products.append(product)
                    
                except Exception as e:
                    print(f"Error parsing line {line_num}: {e}")
                    continue
        
        print(f"Successfully loaded {len(products)} products from CSV")
        return products
        
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return []

def init_ecommerce_database_from_csv():
    """Initialize the e-commerce database from CSV file"""
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
            common_queries TEXT,  -- JSON string for common search queries
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Check if we already have products
    cursor.execute('SELECT COUNT(*) FROM ecommerce_products')
    if cursor.fetchone()[0] == 0:
        print("Loading products from CSV...")
        products = load_ecommerce_data_from_csv()
        
        if products:
            # Insert all products from CSV
            cursor.executemany('''
                INSERT INTO ecommerce_products (
                    id, name, description, price, currency, image_url, tags,
                    category, subcategory, brand, stock, rating, review_count, common_queries
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', [(
                p['id'], p['name'], p['description'], p['price'],
                p['currency'], p['image_url'], json.dumps(p['tags']),
                p['category'], p['subcategory'], p['brand'],
                p['stock'], p['rating'], p['review_count'], json.dumps(p['common_queries'])
            ) for p in products])
            
            conn.commit()
            print(f"Successfully inserted {len(products)} products into database")
        else:
            print("No products found in CSV, falling back to dummy data")
            # CSV bulunamazsa eski dummy data'yı kullan
            init_ecommerce_database()
            return
    else:
        print("Database already contains products, skipping CSV load")
    
    conn.close()

def get_ecommerce_product_by_id(product_id: str) -> dict:
    """Get ecommerce product by ID"""
    conn = sqlite3.connect(ECOMMERCE_DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM ecommerce_products WHERE id = ?', (product_id,))
    result = cursor.fetchone()
    
    if result:
        columns = [desc[0] for desc in cursor.description]
        product_dict = dict(zip(columns, result))
        
        # Parse JSON fields
        if product_dict.get('tags'):
            try:
                product_dict['tags'] = json.loads(product_dict['tags'])
            except:
                product_dict['tags'] = []
        
        if product_dict.get('common_queries'):
            try:
                product_dict['common_queries'] = json.loads(product_dict['common_queries'])
            except:
                product_dict['common_queries'] = []
        
        conn.close()
        return product_dict
    
    conn.close()
    return None

def get_common_queries_by_category(category: str) -> List[str]:
    """Get all common queries from products in the same category"""
    conn = sqlite3.connect(ECOMMERCE_DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT common_queries FROM ecommerce_products WHERE category = ?', (category,))
    results = cursor.fetchall()
    conn.close()
    
    all_queries = []
    for result in results:
        if result[0]:
            try:
                queries = json.loads(result[0])
                if isinstance(queries, list):
                    all_queries.extend(queries)
            except:
                continue
    
    # Remove duplicates and return
    return list(set(all_queries))

def search_products_by_tags(search_tags: List[str], limit: int = 4, min_price: float = None, 
                           max_price: float = None, category: str = None) -> List[EcommerceProduct]:
    """Tag'lere göre ürün arama"""
    conn = sqlite3.connect(ECOMMERCE_DB_PATH)
    cursor = conn.cursor()
    
    # Check if new columns exist
    cursor.execute("PRAGMA table_info(ecommerce_products)")
    columns = [column[1] for column in cursor.fetchall()]
    
    # Base query with conditional columns
    if 'image_base64' in columns and 'visual_representation' in columns:
        query = '''
            SELECT id, name, description, price, currency, image_url, tags, category, 
                   subcategory, brand, stock, rating, review_count, common_queries,
                   image_base64, visual_representation
            FROM ecommerce_products 
            WHERE stock > 0
        '''
    else:
        query = '''
            SELECT id, name, description, price, currency, image_url, tags, category, 
                   subcategory, brand, stock, rating, review_count, common_queries
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
            common_queries = json.loads(row[13]) if row[13] else []
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
                review_count=row[12],
                common_queries=common_queries,
                image_base64=row[14] if len(row) > 14 else None,
                visual_representation=row[15] if len(row) > 15 else None
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
    
    # Check if new columns exist
    cursor.execute("PRAGMA table_info(ecommerce_products)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'image_base64' in columns and 'visual_representation' in columns:
        cursor.execute('''
            SELECT id, name, description, price, currency, image_url, tags, category, 
                   subcategory, brand, stock, rating, review_count, common_queries,
                   image_base64, visual_representation
            FROM ecommerce_products 
            WHERE stock > 0
            ORDER BY rating DESC, review_count DESC
            LIMIT ?
        ''', (limit,))
    else:
        cursor.execute('''
            SELECT id, name, description, price, currency, image_url, tags, category, 
                   subcategory, brand, stock, rating, review_count, common_queries
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
            review_count=row[12],
            common_queries=json.loads(row[13]) if row[13] else [],
            image_base64=row[14] if len(row) > 14 else None,
            visual_representation=row[15] if len(row) > 15 else None
        )
        products.append(product)
    
    return products

def update_product_image_base64(product_id: str, image_base64: str, visual_representation: str = None):
    """Update product with generated image base64 data"""
    conn = sqlite3.connect(ECOMMERCE_DB_PATH)
    cursor = conn.cursor()
    
    # Add image_base64 column if it doesn't exist
    cursor.execute("PRAGMA table_info(ecommerce_products)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'image_base64' not in columns:
        cursor.execute('ALTER TABLE ecommerce_products ADD COLUMN image_base64 TEXT')
        print("Added image_base64 column to ecommerce_products table")
    
    if 'visual_representation' not in columns:
        cursor.execute('ALTER TABLE ecommerce_products ADD COLUMN visual_representation TEXT')
        print("Added visual_representation column to ecommerce_products table")
    
    # Update the product
    if visual_representation:
        cursor.execute('''
            UPDATE ecommerce_products 
            SET image_base64 = ?, visual_representation = ?
            WHERE id = ?
        ''', (image_base64, visual_representation, product_id))
    else:
        cursor.execute('''
            UPDATE ecommerce_products 
            SET image_base64 = ?
            WHERE id = ?
        ''', (image_base64, product_id))
    
    conn.commit()
    conn.close()

def get_all_ecommerce_products_for_image_generation() -> List[Dict[str, Any]]:
    """Get all ecommerce products specifically for image generation processing"""
    conn = sqlite3.connect(ECOMMERCE_DB_PATH)
    cursor = conn.cursor()
    
    # Check if image_base64 column exists
    cursor.execute("PRAGMA table_info(ecommerce_products)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'image_base64' in columns and 'visual_representation' in columns:
        cursor.execute('''
            SELECT id, name, description, price, currency, image_url, tags, category, 
                   subcategory, brand, stock, rating, review_count, image_base64, visual_representation
            FROM ecommerce_products 
            ORDER BY rating DESC, review_count DESC
        ''')
    elif 'image_base64' in columns:
        cursor.execute('''
            SELECT id, name, description, price, currency, image_url, tags, category, 
                   subcategory, brand, stock, rating, review_count, image_base64, NULL as visual_representation
            FROM ecommerce_products 
            ORDER BY rating DESC, review_count DESC
        ''')
    else:
        cursor.execute('''
            SELECT id, name, description, price, currency, image_url, tags, category, 
                   subcategory, brand, stock, rating, review_count, NULL as image_base64, NULL as visual_representation
            FROM ecommerce_products 
            ORDER BY rating DESC, review_count DESC
        ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    products = []
    for row in rows:
        product = {
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'price': row[3],
            'currency': row[4],
            'image_url': row[5],
            'tags': json.loads(row[6]) if row[6] else [],
            'category': row[7],
            'subcategory': row[8],
            'brand': row[9],
            'stock': row[10],
            'rating': row[11],
            'review_count': row[12],
            'image_base64': row[13] if len(row) > 13 else None,
            'visual_representation': row[14] if len(row) > 14 else None
        }
        products.append(product)
    
    return products

def initialize_all_databases():
    """Tüm veritabanlarını başlat"""
    print("Initializing databases...")
    init_database()
    init_ecommerce_database_from_csv()  # CSV'den yükle
    print("Databases initialized successfully!") 