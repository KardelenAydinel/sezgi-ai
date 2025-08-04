import axios from 'axios';
import { Product, EcommerceProduct, createProductFromJson, createEcommerceProductFromJson, ABTestInfo } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatResponse {
  response: string;
  products?: Product[];
  search_results?: EcommerceProduct[];
  tag_result?: any;
  number_of_cards?: number; // Backend'den gelen ghost cards sayısı
}

// Two-phase API interfaces
export interface TextOnlyProduct {
  urun_adi: string;
  urun_aciklama: string;
  urun_adi_en: string;
  visual_representation: string;
}

export interface SuggestionsTextResponse {
  number_of_cards: number;
  products: TextOnlyProduct[];
}

export interface SuggestionsImagesResponse {
  number_of_cards: number;
  products: Product[];
}

export interface ABTestStartRequest {
  product_id: string;
  test_field: string;
  a_variant: string;
  b_variant: string;
  start_date: string;
}

// Two-phase API calls
export const getSuggestionsText = async (message: string): Promise<SuggestionsTextResponse> => {
  const response = await api.post('/generate_suggestions_text', {
    description: message
  });
  return response.data;
};

export const getSuggestionsImages = async (textOnlyProducts: TextOnlyProduct[]): Promise<SuggestionsImagesResponse> => {
  const response = await api.post('/generate_suggestion_images', {
    products: textOnlyProducts
  });
  return response.data;
};

// New two-phase chat message function
export const sendChatMessageTwoPhase = async (
  message: string,
  onGhostCardsReady?: (count: number) => void
): Promise<ChatResponse> => {
  try {
    // Phase 1: Get text-only suggestions (Fast)
    console.log('[PHASE 1] Getting text suggestions...');
    const textResponse = await getSuggestionsText(message);
    
    // Trigger ghost cards immediately
    if (onGhostCardsReady) {
      onGhostCardsReady(textResponse.number_of_cards);
    }
    
    console.log(`[PHASE 1] Got ${textResponse.number_of_cards} text suggestions`);
    
    // Phase 2: Generate images (Slow)
    console.log('[PHASE 2] Generating images...');
    const imagesResponse = await getSuggestionsImages(textResponse.products);
    
    console.log(`[PHASE 2] Generated images for ${imagesResponse.products.length} products`);
    
    return {
      response: `🤔 Aradığın 'o şey' bunlardan biri olabilir mi?`,
      products: imagesResponse.products.map(createProductFromJson),
      search_results: [],
      tag_result: undefined,
      number_of_cards: imagesResponse.number_of_cards
    };
  } catch (error) {
    console.error('Two-phase API Error:', error);
    return {
      response: 'Üzgünüm, şu anda hizmet kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
      products: [],
      search_results: [],
      tag_result: undefined
    };
  }
};

// Legacy single-phase function (keeping for backward compatibility)
export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  try {
    // Use gemini_suggestions endpoint for initial image generation
    const response = await api.post('/gemini_suggestions', { 
      description: message
    });
    
    return {
      // response: `"${message}" için ${response.data.number_of_cards || 0} ürün önerisi oluşturuldu:`,
      response: `🤔 Aradığın 'o şey' bunlardan biri olabilir mi?`,

      products: (response.data.products || []).map(createProductFromJson),
      search_results: [],
      tag_result: undefined,
      number_of_cards: response.data.number_of_cards // Backend'den gelen ghost cards sayısı
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      response: 'Üzgünüm, şu anda hizmet kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
      products: [],
      search_results: [],
      tag_result: undefined
    };
  }
};

export const sendImageWithMessage = async (imageBase64: string, message: string): Promise<ChatResponse> => {
  try {
    // For image uploads, we can use generate_tags_with_visual
    const response = await api.post('/generate_tags_with_visual', {
      product_description: message || 'Bu görseli analiz et',
      image_base64: imageBase64
    });
    
    return {
      response: 'Görsel analiz edildi ve etiketler oluşturuldu:',
      products: [],
      search_results: [],
      tag_result: response.data
    };
  } catch (error) {
    console.error('Image API Error:', error);
    return {
      response: 'Görsel analiz edilirken bir hata oluştu.',
      products: [],
      search_results: [],
      tag_result: undefined
    };
  }
};

export const generateProductTags = async (productDescription: string): Promise<any> => {
  const response = await api.post('/generate-tags', {
    product_description: productDescription,
  });
  return response.data;
};

// Search API calls
export const searchProducts = async (query: string): Promise<Product[]> => {
  const response = await api.get(`/search?query=${encodeURIComponent(query)}`);
  return response.data.map(createProductFromJson);
};

export const searchEcommerceProducts = async (query: string): Promise<EcommerceProduct[]> => {
  const response = await api.get(`/search-ecommerce?query=${encodeURIComponent(query)}`);
  return response.data.map(createEcommerceProductFromJson);
};

// A/B Testing API calls
export const startABTest = async (data: ABTestStartRequest): Promise<void> => {
  await api.post('/ab-tests/start', data);
};

export const getActiveABTests = async (): Promise<ABTestInfo[]> => {
  const response = await api.get('/ab-tests/active');
  return response.data;
};

export const getABTestResults = async (productId: string): Promise<any> => {
  const response = await api.get(`/ab-tests/results/${productId}`);
  return response.data;
};

// Similar products search for "Bunun Gibileri Göster" functionality
export const findSimilarProducts = async (productName: string, productDescription?: string): Promise<Product[]> => {
  try {
    // Use the correct endpoint that triggers agentic AI tag generation
    const response = await api.post('/similar_products', {
      product: {
        urun_adi: productName,
        urun_aciklama: productDescription || `Benzer ürünler: ${productName}`,
        urun_adi_en: productName, // Use same name for English
      }
    });
    return response.data.products?.map(createProductFromJson) || [];
  } catch (error) {
    console.error('Similar products search error:', error);
    return [];
  }
};

export default api;