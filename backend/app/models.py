from pydantic import BaseModel
from typing import List, Optional

class ExampleRequest(BaseModel):
    text: str

class ProductCard(BaseModel):
    """Ürün kartı için veri modeli"""
    urun_adi: str
    urun_aciklama: str
    urun_adi_en: str
    visual_representation: str  # LLM'in image generation için yazdığı detaylı açıklama
    image_base64: Optional[str] = None  # Base64 encoded image
    tags: Optional[List[str]] = None  # Agent'lar tarafından üretilen tag'ler
    confidence_score: Optional[float] = None  # Tag generation güven skoru
    category: Optional[str] = None  # Ana kategori
    
class ProductCollection(BaseModel):
    """Ürün kartları koleksiyonu"""
    number_of_cards: int
    products: List[ProductCard]
    
class TagGenerationRequest(BaseModel):
    """Tag generation için istek modeli"""
    product: dict
    visual_description: str  # Agent'lara gönderilecek visual description
    
class TagGenerationResponse(BaseModel):
    """Tag generation response modeli"""
    tags: List[str]
    confidence: float
    category: str
    reasoning: str
    visual_description_used: str  # Hangi visual description kullanıldığını track etmek için

# E-ticaret için yeni modeller
class EcommerceProduct(BaseModel):
    """E-ticaret ürünü modeli"""
    id: str
    name: str
    description: str
    price: float
    currency: str = "TL"
    image_url: Optional[str] = None
    tags: List[str]
    category: str
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    stock: int = 0
    rating: Optional[float] = None
    review_count: Optional[int] = None
    
class SearchRequest(BaseModel):
    """Arama isteği modeli"""
    tags: List[str]
    limit: int = 4
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    category: Optional[str] = None
    
class SearchResponse(BaseModel):
    """Arama sonucu modeli"""
    products: List[EcommerceProduct]
    total_found: int
    search_tags: List[str]
    execution_time: Optional[float] = None
