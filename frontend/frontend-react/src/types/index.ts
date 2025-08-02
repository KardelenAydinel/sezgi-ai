// Data Models
export enum Sender {
  USER = 'user',
  LLM = 'llm'
}

export interface ChatMessage {
  sender: Sender;
  text?: string;
  products?: Product[];
  numberOfCards?: number;
  searchResults?: EcommerceProduct[];
  tagResult?: TagGenerationResult;
}

export interface TagGenerationResult {
  tags: string[];
  confidence: number;
  category: string;
  reasoning: string;
  visualDescription: string;
}

export interface Product {
  name: string;
  description: string;
  imageBase64?: string;
  visualRepresentation?: string;
  similarityScore?: number;
  rating?: number;
  reviewCount?: number;
  subcategory?: string;
}

export interface EcommerceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  tags: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  similarityScore?: number;
}

export interface BusinessProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  reviewCount: number;
  stock: number;
} 