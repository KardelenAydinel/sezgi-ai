"""
Agent module for generating tags from product information.
This will be enhanced with actual AI agent functionality later.
"""
import os
import json
from typing import List, Dict, Any, Optional
import asyncio
from pathlib import Path
from textwrap import dedent

# --- Agno Kütüphaneleri ---
from agno.agent import Agent
from agno.models.google import Gemini
from agno.team import Team

# --- Araç Setleri (Tools) ---
from agno.tools.reasoning import ReasoningTools

# --- Bilgi Bankası (Knowledge Base) ve Veritabanı (Vector DB) ---
from agno.knowledge.markdown import MarkdownKnowledgeBase
from agno.vectordb.lancedb import LanceDb

# --- Hafıza Yönetimi (Memory Management) ---
from agno.memory.v2 import Memory, MemoryManager
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.storage.sqlite import SqliteStorage

# --- Proje Konfigürasyonu ---
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

from dotenv import load_dotenv
load_dotenv()

# --- API KEY ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- TAKIM OTURUM DEPOLAMA (TEAM SESSION STORAGE) ---
TEAM_STORAGE_DB_FILE = OUTPUT_DIR / "memory/tag_team_sessions.db"
TEAM_STORAGE_DB_FILE.parent.mkdir(parents=True, exist_ok=True)
team_storage = SqliteStorage(table_name="tag_generation_sessions", db_file=str(TEAM_STORAGE_DB_FILE))


def _create_visual_analyzer_agent() -> Agent:
    """Visual description'ları analiz ederek tag önerileri üreten agent"""
    
    visual_analyzer_agent = Agent(
        name="Visual Analyzer Agent",
        role="Visual description'lardan ürün özelliklerini çıkarır ve tag önerileri üretir",
        model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_API_KEY),
        instructions=[
            "Sen bir görsel analiz uzmanısın. Görevin, LLM tarafından image generation için üretilen visual description'ları analiz etmektir.",
            "Visual description verildiğinde, bundan şu bilgileri çıkar:",
            "1. Ürünün fiziksel özelliklerini (renk, şekil, materyal, boyut)",
            "2. Ürünün kullanım amacını ve kategorisini",
            "3. Ürünün hangi ortamlarda kullanıldığını",
            "4. Ürünün teknik özelliklerini",
            "5. E-ticaret'te aranabilecek anahtar kelimelerini",
            "Visual description'dan çıkardığın bilgileri şu formatta döndür:",
            "{'physical_features': List[str], 'usage_purpose': str, 'category': str, 'environment': List[str], 'technical_specs': List[str], 'search_keywords': List[str]}",
            "Örnek: 'a tube of thick paste-like grout filler' -> category: 'yapı_malzemesi', usage_purpose: 'derz_doldurma', physical_features: ['tüp', 'macun_kıvamı'], search_keywords: ['derz_dolgusu', 'banyo_onarım']"
        ],
        tools=[ReasoningTools()],
        monitoring=True,
    )
    
    return visual_analyzer_agent

def _create_tag_decider_agent() -> Agent:
    """Tag'leri karar veren ve optimize eden agent"""
    
    tag_decider_agent = Agent(
        name="Tag Decider Agent", 
        role="Toplanan bilgilerden optimal tag'leri üretir ve karar verir",
        model=Gemini(id="gemini-2.5-flash", api_key=GEMINI_API_KEY),
        instructions=[
            "Sen bir tag generation uzmanısın. Görevin, visual analyzer'dan gelen bilgileri birleştirerek optimal tag'ler üretmektir.",
            "Visual analysis sonuçlarını alarak:",
            "1. En relevant ve aranabilir tag'leri belirle",
            "2. Visual description'dan gelen fiziksel özellik tag'lerini dahil et",
            "3. Tag'leri önem sırasına göre sırala",
            "4. Çok genel veya çok spesifik tag'leri filtrele",
            "5. E-ticaret arama davranışlarına uygun tag'ler üret",
            "6. Türkçe arama trendlerini dikkate al",
            "Tag selection kriterlerin:",
            "- Visual description'daki fiziksel özellikler mutlaka dahil edilmeli",
            "- Arama hacmi potansiyeli yüksek olmalı",
            "- Ürünü net şekilde tanımlamalı", 
            "- Kullanıcı arama davranışlarıyla uyumlu olmalı",
            "- Hem genel hem spesifik tag'ler dengelenmiş olmalı",
            "Sonucu şu formatta döndür:",
            "{'primary_tags': List[str], 'secondary_tags': List[str], 'confidence_score': float, 'reasoning': str}",
            "Primary tags: En önemli 3-5 tag, Secondary tags: Destekleyici 3-7 tag"
        ],
        tools=[ReasoningTools()],
        monitoring=True,
    )
    
    return tag_decider_agent

def _create_tag_generation_team(session_id: str) -> Team:
    """Tag generation için agent takımını oluşturur"""
        
    # Agent'ları oluştur
    visual_analyzer = _create_visual_analyzer_agent()
    tag_decider = _create_tag_decider_agent()
    
    team_instructions = dedent(f"""
        Sen, ürün bilgilerinden optimal tag'ler üreten bir takım liderisin. Amacın, verilen ürün bilgileri ve visual description'ı analiz ederek en etkili tag'leri üretmektir.

        **SÜREÇ AKIŞI:**
        Ürün bilgisi ve visual description verildiğinde aşağıdaki akışı takip et:

        1. Visual Analysis:
            - `Visual Analyzer Agent`'ı çağır
            - Visual description'ı vererek fiziksel özellikler ve kategorileri analiz etmesini iste
            - Görsel özelliklerden tag önerileri çıkarmasını iste

        2. Tag Generation:
            - `Tag Decider Agent`'ı çağır
            - Visual analyzer'dan gelen bilgileri vererek optimal tag'ler üretmesini iste
            - Hem primary hem secondary tag'ler oluşturmasını iste

        3. Quality Control:
            - Üretilen tag'leri gözden geçir
            - Visual description'daki önemli fiziksel özelliklerin tag'lerde yer aldığından emin ol
            - E-ticaret arama davranışlarına uygunluğunu kontrol et
            - Final tag listesini oluştur

        **ÇIKTI FORMAT:**
        Her zaman şu formatta JSON döndür:
        {{
            "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
            "confidence": 0.85,
            "category": "ürün_kategorisi",
            "reasoning": "Tag seçim gerekçesi ve visual description etkisi",
            "visual_description_used": "kullanılan visual description"
        }}

        **KURALLAR:**
        - Tag'ler Türkçe olmalı
        - Arama dostu olmalı (alt çizgi kullan)
        - 5-8 arası tag üret
        - Visual description'daki fiziksel özellikler mutlaka tag'lerde yer almalı
        - Hem genel hem spesifik tag'ler olsun
        - E-ticaret terminolojisini kullan
        - Visual description'ın tag generation'a nasıl katkıda bulunduğunu açıkla
    """)
    
    tag_team = Team(
        name="Tag Generation Team",
        mode="coordinate", 
        model=Gemini(id="gemini-2.5-pro", api_key=GEMINI_API_KEY),
        members=[visual_analyzer, tag_decider],
        tools=[],
        storage=team_storage,
        session_id=session_id,
        description="Ürün bilgileri ve visual description'dan optimal tag'ler üreten AI takımı",
        instructions=team_instructions,
        add_datetime_to_instructions=True,
        markdown=False,
        debug_mode=True,
    )
    
    return tag_team

async def run_tag_generation_with_visual(product: Dict[str, Any], visual_description: str, session_id: str) -> Dict[str, Any]:
    """
    Visual description ile tag generation fonksiyonu - agent takımını çalıştırır
    
    Args:
        product: Ürün bilgileri
        visual_description: LLM'in image generation için yazdığı detaylı açıklama
        session_id: Oturum ID'si
        
    Returns:
        Generated tags ve metadata
    """
    
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY ortam değişkeni ayarlanmamış.")

    # Tag generation takımını oluştur
    tag_team = _create_tag_generation_team(session_id)
    
    # Ürün bilgilerini ve visual description'ı mesaj formatına çevir
    product_message = f"""
    Ürün Adı: {product.get('urun_adi', 'Bilinmiyor')}
    Ürün Açıklaması: {product.get('urun_aciklama', 'Açıklama yok')}
    İngilizce Adı: {product.get('urun_adi_en', 'Bilinmiyor')}
    
    Visual Description (LLM tarafından image generation için üretildi):
    {visual_description}
    
    Bu ürün ve visual description için optimal tag'ler üret. Visual description'daki fiziksel özellikler ve görsel detaylar özellikle önemli.
    """
    
    # Takımı çalıştır
    response = await tag_team.arun(message=product_message)
    
    # Response'u parse et ve return et
    try:
        # Gelen response'un string olup olmadığını kontrol et
        if isinstance(response, str):
            # String'i JSON'a çevir
            # Bazen ```json ... ``` formatında gelebiliyor, onu temizleyelim
            if response.strip().startswith("```json"):
                response_content = response.strip()[7:-3].strip()
            else:
                response_content = response
            result = json.loads(response_content)
        elif hasattr(response, 'content') and isinstance(response.content, str):
            # Eğer 'content' attribute'u varsa ve string ise onu kullan
            response_content = response.content
            if response_content.strip().startswith("```json"):
                response_content = response_content.strip()[7:-3].strip()
            result = json.loads(response_content)
        else:
            # Diğer durumlar için (e.g. dict)
            result = response if isinstance(response, dict) else json.loads(str(response))
        
        # Visual description'ı response'a ekle
        result['visual_description_used'] = visual_description
        return result
    except (json.JSONDecodeError, TypeError) as e:
        print(f"Agent response parse edilemedi. Hata: {e}, Gelen Response: {response}")
        # Fallback: static tags
        return {
            "tags": ["ev_dekorasyonu", "banyo_aksesuari", "mutfak_gereci", "temizlik_urun", "yapi_malzeme"],
            "confidence": 0.5,
            "category": "genel",
            "reasoning": f"Agent response parse edilemedi: {e}",
            "visual_description_used": visual_description
        }

async def run_tag_generation(product: Dict[str, Any], session_id: str) -> Dict[str, Any]:
    """
    Ana tag generation fonksiyonu - agent takımını çalıştırır
    
    Args:
        product: Ürün bilgileri
        session_id: Oturum ID'si
        
    Returns:
        Generated tags ve metadata
    """
    
    # Visual description'ı product'tan al
    visual_description = product.get('visual_representation', 'Görsel açıklama bulunamadı')
    
    # Visual description ile tag generation yap
    return await run_tag_generation_with_visual(product, visual_description, session_id)

# --- Mevcut fonksiyonlar (şimdilik değişmeden) ---

def generate_tags_for_product(product: Dict[str, Any]) -> List[str]:
    """
    Generate search tags for a given product.
    
    Args:
        product: Dictionary containing product information with keys like:
                'urun_adi', 'urun_aciklama', 'urun_adi_en', etc.
    
    Returns:
        List of generated tags
    """
    
    # For now, return static tags
    # This will be replaced with actual AI agent logic later
    static_tags = [
        "ev_dekorasyonu",
        "banyo_aksesuari", 
        "mutfak_gereci",
        "temizlik_urun",
        "yapi_malzeme",
        "elektronik_esya",
        "ofis_malzeme",
        "bahce_urun",
        "kisisel_bakim",
        "giyim_aksesuar"
    ]
    
    # Return first 5 tags for consistency
    return static_tags[:5]


def process_product_for_tags(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a product and add generated tags to it.
    
    Args:
        product: Product dictionary
        
    Returns:
        Product dictionary with added 'tags' field
    """
    
    # Generate tags for the product
    tags = generate_tags_for_product(product)
    
    # Add tags to product data
    product_with_tags = product.copy()
    product_with_tags['tags'] = tags
    
    return product_with_tags 