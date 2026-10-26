/**
 * Multilingual RAG (Retrieval-Augmented Generation) Type Definitions
 */

export interface IngestedDocumentEntry {
  id: string;
  title: string;
  content: string;
  language: string;
  category: string;
  source?: string;
  keywords?: string[];
  tenantTag?: string;
  createdAt: string;
  updatedAt: string;
  chunkCount?: number;
}

export interface RagChunk {
  id: string;
  documentId: string;
  title: string;
  content: string;
  language: string;
  category: string;
  embedding?: number[];
  keywords?: string[];
  score?: number;
  source?: string;
}

export interface VectorStoreStats {
  totalChunks: number;
  distinctLanguages: string[];
  distinctCategories: string[];
  totalDocuments?: number;
  connectedToFirebase?: boolean;
  firestoreCollections?: {
    documents: string;
    embeddings: string;
  };
}

export interface RagQueryResult {
  query: string;
  targetLanguage: string;
  queryLanguage?: string;
  translatedQuery?: string;
  chunks: RagChunk[];
  totalRetrieved: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  answer: string;
  sources?: {
    title: string;
    category: string;
    language: string;
    excerpt: string;
  }[];
  translations?: Record<string, string>;
  latencyMs?: number;
}

export interface DocumentImproveResult {
  improvedTitle: string;
  improvedContent: string;
  summary: string;
}

export interface AutoSortResult {
  title: string;
  category: string;
  keywords: string[];
  language: string;
  confidence: number;
}
