// Data Models converted from Flutter Dart classes to TypeScript interfaces
import type { ReactNode } from 'react';

export enum Sender {
  USER = 'user',
  LLM = 'llm'
}

export interface ChatMessage {
  sender: Sender;
  text?: string;
  content?: ReactNode;
  products?: Product[];
  numberOfCards?: number;
  searchResults?: EcommerceProduct[];
  tagResult?: TagGenerationResult;
  fromDatabase?: boolean;
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
  rating: number;
  reviewCount: number;
  salesCount: number;
}

export interface ABTestInfo {
  testField: string; // 'title' or 'description'
  aVariant: string;
  bVariant: string;
  startDate: Date;
}

export interface Sale {
  productName: string;
  amount: number;
  date: Date;
}

export interface Review {
  productName: string;
  rating: number;
  comment: string;
  date: Date;
}

// Factory functions for creating objects from JSON (similar to Flutter's fromJson)
export const createProductFromJson = (json: any): Product => ({
  name: json.urun_adi || 'İsimsiz Ürün',
  description: json.urun_aciklama || 'Açıklama yok.',
  imageBase64: json.image_base64,
  visualRepresentation: json.visual_representation,
  similarityScore: typeof json.similarity_score === 'number' ? json.similarity_score : undefined,
  rating: typeof json.rating === 'number' ? json.rating : undefined,
  reviewCount: json.review_count,
  subcategory: json.subcategory,
});

export const createEcommerceProductFromJson = (json: any): EcommerceProduct => ({
  id: json.id || '',
  name: json.name || 'İsimsiz Ürün',
  description: json.description || 'Açıklama yok.',
  price: json.price || 0.0,
  currency: json.currency || 'TL',
  imageUrl: json.image_url,
  tags: json.tags || [],
  category: json.category || 'Genel',
  subcategory: json.subcategory,
  brand: json.brand,
  stock: json.stock || 0,
  rating: json.rating,
  reviewCount: json.review_count,
  similarityScore: json.similarity_score,
});

export const createABTestInfoFromJson = (json: any): ABTestInfo => ({
  testField: json.test_field || 'title',
  aVariant: json.a_variant || '',
  bVariant: json.b_variant || '',
  startDate: new Date(json.start_date || new Date().toISOString()),
});