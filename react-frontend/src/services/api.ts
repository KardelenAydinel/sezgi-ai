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
}

export interface ABTestStartRequest {
  product_id: string;
  test_field: string;
  a_variant: string;
  b_variant: string;
  start_date: string;
}

// Chat API calls - using the original flow
export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  try {
    // Use gemini_suggestions endpoint for initial image generation
    const response = await api.post('/gemini_suggestions', { 
      description: message
    });
    
    return {
      response: `"${message}" için ${response.data.number_of_cards || 0} ürün önerisi oluşturuldu:`,
      products: (response.data.products || []).map(createProductFromJson),
      search_results: [],
      tag_result: undefined
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
export const findSimilarProducts = async (productName: string): Promise<Product[]> => {
  try {
    const response = await api.post('/search_products', {
      query: productName,
      limit: 10
    });
    return response.data.products?.map(createProductFromJson) || [];
  } catch (error) {
    console.error('Similar products search error:', error);
    return [];
  }
};

export default api;