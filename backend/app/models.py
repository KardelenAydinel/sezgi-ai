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
    search_results: Optional[List[dict]] = None  # Bulunan ürünler

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
    common_queries: Optional[List[str]] = None
    image_base64: Optional[str] = None  # AI generated base64 image
    visual_representation: Optional[str] = None  # Visual description for image generation
    
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

# A/B Test models
class ABTestRequest(BaseModel):
    """A/B test başlatma isteği"""
    product_id: str
    test_field: str  # 'title' or 'description' 
    a_variant: str
    b_variant: str
    start_date: str

class ABTestInfo(BaseModel):
    """A/B test bilgileri"""
    product_id: str
    test_field: str
    a_variant: str
    b_variant: str
    start_date: str
    is_active: bool = True

class ABTestResponse(BaseModel):
    """A/B test durumu response"""
    success: bool
    message: str
    test_id: Optional[str] = None

# Two-phase suggestions models
class SuggestionsTextRequest(BaseModel):
    """İlk aşama: Sadece text generation isteği"""
    description: str

class ProductTextOnly(BaseModel):
    """Resim olmadan ürün bilgileri"""
    urun_adi: str
    urun_aciklama: str
    urun_adi_en: str
    visual_representation: str

class SuggestionsTextResponse(BaseModel):
    """İlk aşama: Sadece text response"""
    number_of_cards: int
    products: List[ProductTextOnly]

class SuggestionImagesRequest(BaseModel):
    """İkinci aşama: Image generation isteği"""
    products: List[ProductTextOnly]

class SuggestionImagesResponse(BaseModel):
    """İkinci aşama: Resimli ürün response"""
    number_of_cards: int
    products: List[ProductCard]
