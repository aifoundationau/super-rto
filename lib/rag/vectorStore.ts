/**
 * In-Memory & Persistent Vector Store for Multilingual RAG
 * 
 * Supports similarity retrieval, multilingual chunk indexing, category filtering,
 * and vector statistics.
 */

import type { IngestedDocumentEntry, RagChunk, VectorStoreStats } from './types.ts';
import { db, isFirebaseConfigured } from '../firebase/admin.ts';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Deterministically generates a 768-dimensional normalized float embedding vector
 * based on text token hashing and positioning. Compatible with Firestore FieldValue.vector(768).
 */
export function generate768Embedding(text: string): number[] {
  const vector = new Array(768).fill(0);
  const clean = (text || '').toLowerCase().trim();
  if (!clean) return vector;

  const words = clean.split(/[\s,.;:!?+*()、，。！？]+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % 768;
    vector[idx] += 1.0 / (1 + i * 0.05);
    const secondaryIdx = Math.abs((hash * 31) ^ (i * 17)) % 768;
    vector[secondaryIdx] += 0.5;
  }

  // L2 Normalize
  let norm = 0;
  for (let i = 0; i < 768; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < 768; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }
  }

  return vector;
}

// Seed Knowledge Base Chunks
const SEED_DOCUMENTS: IngestedDocumentEntry[] = [
  {
    id: 'doc-seed-en-01',
    title: 'Australian Tertiary & RTO Admissions Framework',
    content: 'Undergraduate degrees and Certificate IV programs require standardized entry thresholds. Domestic applicants use the Australian Tertiary Admission Rank (ATAR) with Commonwealth Supported Places (CSP) funded under HECS-HELP. International candidates on Subclass 500 Student Visas require minimum English proficiency (IELTS 6.5 or TOEFL iBT 79) and CRICOS registered full-time enrollment.',
    language: 'en',
    category: 'Admissions & Compliance',
    source: 'ASQA & TEQSA Standards Framework 2026',
    keywords: ['ATAR', 'CSP', 'Visa 500', 'IELTS', 'CRICOS', 'Admissions'],
    tenantTag: 'super-rto',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    chunkCount: 2,
  },
  {
    id: 'doc-seed-ja-01',
    title: 'オーストラリア大学・RTO入学要件とビザ500ガイドライン',
    content: 'オーストラリアの大学学部および専門教育（RTO/TAFE）の入学には、高校の標準成績またはATAR（オーストラリア大学入学ランク）同等スコアが必要です。留学生（学生ビザ500）は、IELTS 6.5以上またはTOEFL iBT 79以上の英語能力証明と、CRICOS認可の全日制プログラムへの登録が義務付けられています。授業料は国内学生向けCSPと異なり、年間約34,000〜42,000豪ドルです。',
    language: 'ja',
    category: 'Admissions & Compliance',
    source: 'オーストラリア国際教育基準',
    keywords: ['ATAR', '学生ビザ500', 'IELTS', 'CRICOS', '入学条件', '学費'],
    tenantTag: 'super-rto',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    chunkCount: 2,
  },
  {
    id: 'doc-seed-zh-01',
    title: '澳大利亚高等教育与职业教育（RTO）入学标准',
    content: '澳大利亚学士学位课程通常为全日制3年学制。国际学生申请需持有学生签证（Subclass 500），雅思成绩通常要求达到总分6.5分（单项不低于6.0），或者托福iBT 79分。中国高考成绩通常可按70%-75%分数线换算申请。国际学生年均学费约为34,000至42,000澳元，需遵守全日制学习进度以维持签证合规。',
    language: 'zh',
    category: 'Admissions & Compliance',
    source: '中澳教育资格互认框架',
    keywords: ['高考', 'ATAR', '500学生签证', '雅思', '学费', 'CRICOS'],
    tenantTag: 'super-rto',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    chunkCount: 2,
  },
  {
    id: 'doc-seed-en-02',
    title: 'Standards for RTOs 2025 Assessment & Rubrics Standards',
    content: 'ASQA Standards for RTOs require all vocational competency assessments to be measured against explicit Performance Criteria using clear scoring rubrics. Formative assessments provide diagnostic coaching feedback, while Summative assessments verify ultimate competency (C / NYC). All trainers and assessors must hold Cert IV TAE40116/TAE40122 and maintain current industry currency.',
    language: 'en',
    category: 'Assessment & Curriculum',
    source: 'Australian Skills Quality Authority (ASQA)',
    keywords: ['ASQA', 'TAE40122', 'Rubrics', 'Formative', 'Summative', 'Competency'],
    tenantTag: 'super-rto',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    chunkCount: 2,
  },
];

function chunkDocument(doc: IngestedDocumentEntry): RagChunk[] {
  const parts = doc.content.split(/(?<=[.!?。！？])\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return [
      {
        id: `${doc.id}-chunk-1`,
        documentId: doc.id,
        title: doc.title,
        content: doc.content,
        language: doc.language,
        category: doc.category,
        keywords: doc.keywords,
        source: doc.source,
      },
    ];
  }

  // Create sliding chunks
  const chunks: RagChunk[] = [];
  const mid = Math.ceil(parts.length / 2);
  const part1 = parts.slice(0, mid).join(' ');
  const part2 = parts.slice(mid).join(' ');

  if (part1) {
    chunks.push({
      id: `${doc.id}-chunk-1`,
      documentId: doc.id,
      title: `${doc.title} (Part 1)`,
      content: part1,
      language: doc.language,
      category: doc.category,
      keywords: doc.keywords,
      source: doc.source,
    });
  }
  if (part2) {
    chunks.push({
      id: `${doc.id}-chunk-2`,
      documentId: doc.id,
      title: `${doc.title} (Part 2)`,
      content: part2,
      language: doc.language,
      category: doc.category,
      keywords: doc.keywords,
      source: doc.source,
    });
  }
  return chunks;
}

// Global In-Memory Store
let globalDocuments: IngestedDocumentEntry[] = [...SEED_DOCUMENTS];
let globalChunks: RagChunk[] = SEED_DOCUMENTS.flatMap(chunkDocument);

export async function getIngestedDocuments(): Promise<IngestedDocumentEntry[]> {
  if (isFirebaseConfigured) {
    try {
      const snap = await db.collection('rag_documents').orderBy('createdAt', 'desc').get();
      if (!snap.empty) {
        const firestoreDocs: IngestedDocumentEntry[] = [];
        snap.forEach((d) => {
          const data = d.data();
          firestoreDocs.push({
            id: d.id,
            title: data.title || '',
            content: data.content || '',
            language: data.language || 'en',
            category: data.category || 'General Academic Policy',
            source: data.source || 'Institutional Knowledge Base',
            keywords: data.keywords || [],
            tenantTag: data.tenantTag || 'super-rto',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
            chunkCount: data.chunkCount || 1,
          });
        });
        // Merge with SEED_DOCUMENTS if not already in collection
        for (const seed of SEED_DOCUMENTS) {
          if (!firestoreDocs.some((d) => d.id === seed.id)) {
            firestoreDocs.push(seed);
          }
        }
        globalDocuments = firestoreDocs;
        return firestoreDocs;
      }
    } catch (err) {
      console.warn('[vectorStore] Firestore read fallback to memory:', err);
    }
  }
  return [...globalDocuments];
}

export async function getVectorStoreStats(): Promise<VectorStoreStats> {
  const languages = Array.from(new Set(globalChunks.map((c) => c.language).filter(Boolean)));
  const categories = Array.from(new Set(globalChunks.map((c) => c.category).filter(Boolean)));

  return {
    totalChunks: globalChunks.length,
    distinctLanguages: languages,
    distinctCategories: categories,
    totalDocuments: globalDocuments.length,
    connectedToFirebase: isFirebaseConfigured,
    firestoreCollections: {
      documents: 'rag_documents',
      embeddings: 'knowledge_embeddings',
    },
  };
}

export async function addDocumentToStore(
  doc: IngestedDocumentEntry,
  customChunks?: RagChunk[]
): Promise<RagChunk[]> {
  const chunks = customChunks && customChunks.length > 0 ? customChunks : chunkDocument(doc);

  // Update in-memory state
  globalDocuments = globalDocuments.filter((d) => d.id !== doc.id);
  globalChunks = globalChunks.filter((c) => c.documentId !== doc.id);

  doc.chunkCount = chunks.length;
  globalDocuments.unshift(doc);
  globalChunks.unshift(...chunks);

  // Persist to Cloud Firestore if credentials configured
  if (isFirebaseConfigured) {
    try {
      // 1. Persist parent document into 'rag_documents'
      await db.collection('rag_documents').doc(doc.id).set({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        language: doc.language,
        category: doc.category,
        source: doc.source,
        keywords: doc.keywords || [],
        tenantTag: doc.tenantTag || 'super-rto',
        chunkCount: chunks.length,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // 2. Persist vector chunks into 'knowledge_embeddings'
      const batch = db.batch();
      for (const chunk of chunks) {
        const chunkRef = db.collection('knowledge_embeddings').doc(chunk.id);
        const vector = generate768Embedding(`${chunk.title} ${chunk.content}`);
        
        const chunkPayload: Record<string, any> = {
          id: chunk.id,
          documentId: doc.id,
          title: chunk.title,
          content: chunk.content,
          language: chunk.language,
          category: chunk.category,
          keywords: chunk.keywords || [],
          source: chunk.source || '',
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (typeof (FieldValue as any).vector === 'function') {
          try {
            chunkPayload.embedding = (FieldValue as any).vector(vector);
          } catch {
            chunkPayload.embedding = vector;
          }
        } else {
          chunkPayload.embedding = vector;
        }

        batch.set(chunkRef, chunkPayload, { merge: true });
      }
      await batch.commit();
    } catch (err) {
      console.warn('[vectorStore] Firestore persistence failed (fallback active):', err);
    }
  }

  return chunks;
}

export async function deleteDocumentFromStore(documentId: string): Promise<boolean> {
  globalDocuments = globalDocuments.filter((d) => d.id !== documentId);
  const chunksToDelete = globalChunks.filter((c) => c.documentId === documentId);
  globalChunks = globalChunks.filter((c) => c.documentId !== documentId);

  if (isFirebaseConfigured) {
    try {
      await db.collection('rag_documents').doc(documentId).delete();
      const batch = db.batch();
      for (const chunk of chunksToDelete) {
        batch.delete(db.collection('knowledge_embeddings').doc(chunk.id));
      }
      await batch.commit();
    } catch (err) {
      console.warn('[vectorStore] Firestore delete error:', err);
    }
  }

  return true;
}

export async function searchVectorChunks(
  query: string,
  options: {
    topK?: number;
    minScore?: number;
    categoryFilter?: string;
    targetLanguage?: string;
  } = {}
): Promise<RagChunk[]> {
  const { topK = 4, minScore = 0.15, categoryFilter, targetLanguage } = options;
  const terms = query
    .toLowerCase()
    .split(/[\s,.;:!?+*()、，。！？]+/)
    .filter((t) => t.length > 1);

  const scored: Array<{ chunk: RagChunk; score: number }> = [];

  for (const chunk of globalChunks) {
    if (categoryFilter && categoryFilter !== 'ALL' && chunk.category !== categoryFilter) {
      continue;
    }

    let score = 0;
    const chunkText = `${chunk.title} ${chunk.content} ${(chunk.keywords || []).join(' ')}`.toLowerCase();

    // Exact query bonus
    if (chunkText.includes(query.toLowerCase())) {
      score += 0.5;
    }

    // Keyword match
    for (const term of terms) {
      if (chunkText.includes(term)) {
        score += 0.2;
      }
    }

    // Language affinity match
    if (targetLanguage && chunk.language === targetLanguage) {
      score += 0.15;
    }

    if (score >= minScore) {
      scored.push({
        chunk: {
          ...chunk,
          score: Math.min(1.0, Number(score.toFixed(3))),
        },
        score,
      });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Return topK
  return scored.slice(0, topK).map((s) => s.chunk);
}

export async function resetVectorStore(): Promise<void> {
  globalDocuments = [...SEED_DOCUMENTS];
  globalChunks = SEED_DOCUMENTS.flatMap(chunkDocument);
}
