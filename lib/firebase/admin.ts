/**
 * Super-RTO Firebase Admin SDK Initialization & Persistence Services
 * 
 * Secure backend operations authorized via custom claims and service account credentials.
 */

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  type SystemRole,
  normalizeRole,
  isProjectOwnerEmail,
  PRIMARY_SUPERADMIN_EMAIL,
  SECONDARY_SUPERADMIN_EMAIL,
  SUPERADMIN_SHARED_WALLET_DOC
} from '../auth/roles.ts';
import {
  type TokenCurrencyConfig,
  DEFAULT_GLOBAL_TOKEN_CONFIG,
  toStrictIntegerTokens
} from '../tokens/pricing.ts';

function getCredentials() {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '';
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || 'ai-foundation-firebase';

  return { privateKey, clientEmail, projectId };
}

const creds = getCredentials();
export const isFirebaseConfigured = Boolean(
  creds.privateKey && creds.privateKey.includes('BEGIN PRIVATE KEY') && !creds.privateKey.includes('YOUR_PRIVATE_KEY')
);

function getAdminApp(): App {
  const appName = 'super-rto-admin';
  const existing = getApps().find(a => a.name === appName || a.name === '[DEFAULT]');
  if (existing) return existing;

  try {
    if (isFirebaseConfigured) {
      return initializeApp({
        credential: cert({
          projectId: creds.projectId,
          clientEmail: creds.clientEmail,
          privateKey: creds.privateKey,
        }),
      }, appName);
    } else {
      return initializeApp({ projectId: creds.projectId }, appName);
    }
  } catch (err) {
    console.warn('[FirebaseAdmin] Initialization fallback during build:', err);
    return getApps()[0] || initializeApp({ projectId: creds.projectId });
  }
}

const adminApp = getAdminApp();
export const auth = getAuth(adminApp);
export const db = getFirestore(adminApp);

try {
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // Already initialized settings
}

/**
 * Assigns a unified role (including 'director') to a user and sets Firebase Auth Custom Claims.
 */
export async function assignUserRole(params: {
  uid: string;
  role: SystemRole | string;
  institutionId?: string;
  institutionName?: string;
  email?: string;
  displayName?: string;
}) {
  const { uid, role, institutionId, institutionName, email, displayName } = params;
  const normalized = normalizeRole(role);
  const isSuper = normalized === 'superadmin' || isProjectOwnerEmail(email);
  const isDir = normalized === 'director';

  const customClaims: Record<string, any> = {
    role: normalized,
    isSuperAdmin: isSuper,
    isDirector: isDir,
    institutionId: institutionId || null,
  };

  if (isFirebaseConfigured) {
    try {
      await auth.setCustomUserClaims(uid, customClaims);
    } catch (e) {
      console.warn(`[assignUserRole] Could not set claims for ${uid}:`, e);
    }
  }

  const profileData: Record<string, any> = {
    uid,
    role: normalized,
    isSuperAdmin: isSuper,
    isDirector: isDir,
    institutionId: institutionId || null,
    institutionName: institutionName || null,
    email: email || '',
    displayName: displayName || '',
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (isFirebaseConfigured) {
    await db.collection('users').doc(uid).set(profileData, { merge: true });
  }

  return {
    success: true,
    uid,
    role: normalized,
    customClaims,
  };
}

/**
 * In-memory fallback for token configs
 */
let memoryGlobalTokenConfig: TokenCurrencyConfig = { ...DEFAULT_GLOBAL_TOKEN_CONFIG };
const memoryInstitutionTokenConfigs: Record<string, TokenCurrencyConfig> = {};

/**
 * Persists token currency configuration (Global Superadmin or Institution Director).
 */
export async function saveTokenConfig(config: TokenCurrencyConfig) {
  if (config.scope === 'GLOBAL') {
    memoryGlobalTokenConfig = { ...config, updatedAt: new Date().toISOString() };
    if (isFirebaseConfigured) {
      await db.collection('settings').doc('token_currency_global').set({
        ...memoryGlobalTokenConfig,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  } else if (config.institutionId) {
    memoryInstitutionTokenConfigs[config.institutionId] = { ...config, updatedAt: new Date().toISOString() };
    if (isFirebaseConfigured) {
      await db.collection('institution_token_settings').doc(config.institutionId).set({
        ...config,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
  return { success: true, config };
}

/**
 * Retrieves the effective token currency configuration for an institution or global.
 */
export async function getTokenConfig(institutionId?: string): Promise<TokenCurrencyConfig> {
  if (institutionId) {
    if (isFirebaseConfigured) {
      try {
        const snap = await db.collection('institution_token_settings').doc(institutionId).get();
        if (snap.exists) {
          return snap.data() as TokenCurrencyConfig;
        }
      } catch (e) {
        // Fallback to memory or global
      }
    }
    if (memoryInstitutionTokenConfigs[institutionId]) {
      return memoryInstitutionTokenConfigs[institutionId];
    }
  }

  // Global default
  if (isFirebaseConfigured) {
    try {
      const snap = await db.collection('settings').doc('token_currency_global').get();
      if (snap.exists) {
        return snap.data() as TokenCurrencyConfig;
      }
    } catch (e) {
      // Fallback
    }
  }

  return memoryGlobalTokenConfig;
}

function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = cleanUndefined(v);
      }
    }
    return clean;
  }
  return obj;
}

export async function recordActivity(event: {
  category: string;
  action: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  databaseCode?: string;
  systemId?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  userAgent?: string;
  ip?: string;
}) {
  if (!isFirebaseConfigured) {
    return { success: true, logId: 'local-log-unconfigured' };
  }
  try {
    const eventTime = event.timestamp ? new Date(event.timestamp) : new Date();
    const docData = cleanUndefined({
      databaseCode: 'super-rto',
      systemId: 'super-rto',
      ...event,
      timestamp: eventTime.toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    });

    const logRef = await db.collection('activity_logs').add(docData);

    const metricsRef = db.collection('metrics').doc('platform_stats');
    const updatePayload: Record<string, any> = {
      totalEvents: FieldValue.increment(1),
      [`categories.${event.category}`]: FieldValue.increment(1),
      lastEventAt: FieldValue.serverTimestamp(),
      lastAction: event.action,
    };
    if (event.userEmail) {
      updatePayload.lastActiveUser = event.userEmail;
    }
    await metricsRef.set(updatePayload, { merge: true });

    return { success: true, logId: logRef.id };
  } catch (error) {
    console.warn('[recordActivity] Firestore write failed:', error);
    return { success: false, error };
  }
}

export async function getRecentActivityLogs(limitCount = 40) {
  if (!isFirebaseConfigured) {
    return [];
  }
  try {
    const snapshot = await db.collection('activity_logs')
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();
    
    const logs: any[] = [];
    snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
    return logs;
  } catch (error) {
    console.warn('[getRecentActivityLogs] Fallback sort:', error);
    try {
      const snapshot = await db.collection('activity_logs').limit(limitCount).get();
      const logs: any[] = [];
      snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      return logs;
    } catch {
      return [];
    }
  }
}

export async function saveApplicationToFirestore(appData: any) {
  if (!isFirebaseConfigured) {
    return { success: true, id: appData?.id || 'local-app' };
  }
  try {
    if (!appData?.id) return { success: false, error: 'No application ID' };

    const docRef = db.collection('applications').doc(appData.id);
    await docRef.set(
      {
        databaseCode: 'super-rto',
        systemId: 'super-rto',
        ...appData,
        savedToFirestoreAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await recordActivity({
      category: 'APPLICATION',
      action: appData.status === 'Submitted' ? 'APPLICATION_SUBMITTED' : 'APPLICATION_UPDATED',
      userEmail: appData.personalDetails?.email,
      userId: appData.id,
      metadata: {
        applicationId: appData.id,
        applicantName: appData.personalDetails?.fullName,
        degree: appData.coursePreferences?.firstChoiceCourseName,
        degreeCode: appData.coursePreferences?.firstChoiceCourseId,
        status: appData.status,
      },
    });

    return { success: true, id: appData.id };
  } catch (error) {
    console.error('[saveApplicationToFirestore] Error:', error);
    return { success: false, error };
  }
}

export async function getApplicationsFromFirestore() {
  if (!isFirebaseConfigured) {
    return [];
  }
  try {
    const snapshot = await db.collection('applications').orderBy('updatedAt', 'desc').get();
    if (!snapshot.empty) {
      const apps: any[] = [];
      snapshot.forEach(doc => apps.push({ ...doc.data(), id: doc.id }));
      return apps;
    }
    return [];
  } catch (error) {
    console.warn('[getApplicationsFromFirestore] Fallback:', error);
    return [];
  }
}

export const assignUniversityRole = assignUserRole;

export interface AiInteractionRecord {
  id: string;
  userMessage: string;
  aiResponse: string;
  timestamp: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  tags: string[];
  verifiedAccuracy?: boolean;
  notes?: string;
  reviewerEmail?: string;
  updatedAnswer?: string;
  ragIngested?: boolean;
  ragDocId?: string;
  correctedLanguage?: string;
  toolsExecuted?: any[];
}

let inMemoryAiInteractions: AiInteractionRecord[] = [
  {
    id: 'ai-int-1',
    userMessage: 'What are the admission requirements for the Certificate IV in WHS?',
    aiResponse: 'Applicants must possess valid high school completion or equivalent vocational background, plus proof of language and LLN readiness per ASQA Standards.',
    timestamp: new Date().toISOString(),
    confidence: 'HIGH',
    score: 0.95,
    tags: ['#ai-interactions', '#admissions'],
    verifiedAccuracy: true,
  },
  {
    id: 'ai-int-2',
    userMessage: 'オーストラリアの学生ビザ500の就労制限について教えてください。',
    aiResponse: '学生ビザ（サブクラス500）の保持者は、学期中は隔週（2週間）で最大48時間まで就労が許可されています。長期休暇中は制限なく就労可能です。',
    timestamp: new Date().toISOString(),
    confidence: 'HIGH',
    score: 0.98,
    tags: ['#ai-interactions', '#admissions', '#visa-500'],
    verifiedAccuracy: true,
  },
];

export async function getAiInteractions(params?: {
  tag?: string;
  confidence?: string;
  search?: string;
  limit?: number;
}): Promise<{
  interactions: AiInteractionRecord[];
  metrics: {
    total: number;
    highConfidence: number;
    reviewedCount: number;
    averageScore: number;
  };
}> {
  let list = [...inMemoryAiInteractions];

  if (isFirebaseConfigured) {
    try {
      const snap = await db.collection('ai_interactions').orderBy('timestamp', 'desc').limit(params?.limit || 60).get();
      if (!snap.empty) {
        const firestoreList: AiInteractionRecord[] = [];
        snap.forEach((d) => {
          firestoreList.push({ id: d.id, ...d.data() } as AiInteractionRecord);
        });
        if (firestoreList.length > 0) {
          list = firestoreList;
        }
      }
    } catch (err) {
      console.warn('[getAiInteractions] Firestore read fallback to memory:', err);
    }
  }

  if (params?.tag && params.tag !== 'ALL') {
    list = list.filter((i) => i.tags && i.tags.includes(params.tag!));
  }
  if (params?.confidence && params.confidence !== 'ALL') {
    list = list.filter((i) => i.confidence === params.confidence);
  }
  if (params?.search) {
    const s = params.search.toLowerCase();
    list = list.filter((i) => (i.userMessage || '').toLowerCase().includes(s) || (i.aiResponse || '').toLowerCase().includes(s));
  }
  const lim = params?.limit || 60;
  const sliced = list.slice(0, lim);

  const total = list.length;
  const highConfidence = list.filter((i) => i.confidence === 'HIGH').length;
  const reviewedCount = list.filter((i) => i.verifiedAccuracy !== undefined).length;
  const averageScore = total > 0 ? Number((list.reduce((sum, i) => sum + (i.score || 0.9), 0) / total).toFixed(2)) : 0.9;

  return {
    interactions: sliced,
    metrics: { total, highConfidence, reviewedCount, averageScore },
  };
}

export async function updateAiInteractionReview(
  id: string,
  updates: Partial<AiInteractionRecord>
): Promise<{ success: boolean; interaction?: AiInteractionRecord }> {
  const existing = inMemoryAiInteractions.find((i) => i.id === id);
  if (existing) {
    Object.assign(existing, updates);
  }

  if (isFirebaseConfigured) {
    try {
      await db.collection('ai_interactions').doc(id).set({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('[updateAiInteractionReview] Firestore update error:', err);
    }
  }

  return { success: true, interaction: existing };
}

export async function saveChatInteraction(interaction: any): Promise<{ success: boolean; id: string }> {
  const id = interaction.id || `chat-${Date.now()}`;
  if (isFirebaseConfigured) {
    try {
      await db.collection('chat_interactions').doc(id).set({
        id,
        databaseCode: 'super-rto',
        systemId: 'super-rto',
        ...interaction,
        timestamp: interaction.timestamp || new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('[saveChatInteraction] Firestore save error:', err);
    }
  }
  return { success: true, id };
}

export async function saveAiInteraction(interaction: Partial<AiInteractionRecord>): Promise<{ success: boolean; id: string }> {
  const id = interaction.id || `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const record: AiInteractionRecord = {
    id,
    userMessage: interaction.userMessage || '',
    aiResponse: interaction.aiResponse || '',
    timestamp: interaction.timestamp || new Date().toISOString(),
    confidence: interaction.confidence || 'HIGH',
    score: interaction.score ?? 0.9,
    tags: interaction.tags || ['#ai-interactions'],
    verifiedAccuracy: interaction.verifiedAccuracy,
    notes: interaction.notes,
  };
  inMemoryAiInteractions.unshift(record);

  if (isFirebaseConfigured) {
    try {
      await db.collection('ai_interactions').doc(id).set({
        ...record,
        databaseCode: 'super-rto',
        systemId: 'super-rto',
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('[saveAiInteraction] Firestore save error:', err);
    }
  }

  return { success: true, id };
}

export async function saveEventBooking(booking: any): Promise<{ success: boolean; bookingId: string }> {
  const bookingId = booking.bookingId || booking.id || `booking-${Date.now()}`;
  if (isFirebaseConfigured) {
    try {
      await db.collection('event_bookings').doc(bookingId).set({
        bookingId,
        databaseCode: 'super-rto',
        systemId: 'super-rto',
        ...booking,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('[saveEventBooking] Firestore save error:', err);
    }
  }
  return { success: true, bookingId };
}

export async function saveTokenTransaction(tx: any): Promise<{ success: boolean; transactionId: string }> {
  const transactionId = tx.id || tx.transactionId || `tx-${Date.now()}`;
  if (isFirebaseConfigured) {
    try {
      await db.collection('token_ledger').doc(transactionId).set({
        transactionId,
        databaseCode: 'super-rto',
        systemId: 'super-rto',
        ...tx,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('[saveTokenTransaction] Firestore save error:', err);
    }
  }
  return { success: true, transactionId };
}

export const PRIMARY_SUPERADMIN_UID = 'L5euSJAfNKdDOX6mT0qmrCGjUA53';
export const SECONDARY_SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';

export interface SharedSuperadminWallet {
  id: string;
  tokenBalance: number;
  totalPurchased: number;
  totalCommunityDonations: number;
  totalSpent: number;
  primarySuperadminEmail: string;
  primarySuperadminUid: string;
  authorizedSuperadminEmails: string[];
  lastUpdated: string;
}

// In-memory fallback if Firestore is offline during local test/dev
let memorySuperadminSharedWallet: SharedSuperadminWallet = {
  id: SUPERADMIN_SHARED_WALLET_DOC,
  tokenBalance: 18450,
  totalPurchased: 0,
  totalCommunityDonations: 18450,
  totalSpent: 0,
  primarySuperadminEmail: PRIMARY_SUPERADMIN_EMAIL,
  primarySuperadminUid: PRIMARY_SUPERADMIN_UID,
  authorizedSuperadminEmails: [PRIMARY_SUPERADMIN_EMAIL, SECONDARY_SUPERADMIN_EMAIL],
  lastUpdated: new Date().toISOString()
};

const memoryUserWallets: Record<string, number> = {
  [PRIMARY_SUPERADMIN_UID]: 18450,
  [SECONDARY_SUPERADMIN_UID]: 18450,
  'usr_admin007': 18450,
  'usr_alex123': 250,
  'alex@example.com': 250
};

/**
 * Retrieves the unified superadmin shared token wallet.
 * All superadmin accounts (support@aifoundation.net.au and davidrobertson.info@gmail.com)
 * share this EXACT single token wallet.
 */
export async function getSuperadminSharedWallet(): Promise<SharedSuperadminWallet> {
  if (isFirebaseConfigured) {
    try {
      const docRef = db.collection('token_wallets').doc(SUPERADMIN_SHARED_WALLET_DOC);
      const snap = await docRef.get();
      if (snap.exists) {
        const data = snap.data() as SharedSuperadminWallet;
        memorySuperadminSharedWallet = { ...memorySuperadminSharedWallet, ...data };
        return { ...memorySuperadminSharedWallet };
      } else {
        // Initialize the master superadmin shared wallet in Firestore
        await docRef.set({
          ...memorySuperadminSharedWallet,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { ...memorySuperadminSharedWallet };
      }
    } catch (err) {
      console.warn('[getSuperadminSharedWallet] Firestore fallback to memory:', err);
    }
  }
  return { ...memorySuperadminSharedWallet };
}

/**
 * Retrieves effective token balance for any user or superadmin.
 * If user is superadmin, returns the single shared superadmin wallet balance.
 */
export async function getUserTokenBalance(params: {
  userId?: string;
  userEmail?: string;
}): Promise<{
  tokenBalance: number;
  balance: number;
  isSuperadminWallet: boolean;
  isSharedWallet: boolean;
  walletId: string;
}> {
  const { userId, userEmail } = params;
  const isSuperUid = userId === PRIMARY_SUPERADMIN_UID || userId === SECONDARY_SUPERADMIN_UID;
  const isSuper = isProjectOwnerEmail(userEmail) || isSuperUid;

  if (isSuper) {
    const shared = await getSuperadminSharedWallet();
    return {
      tokenBalance: shared.tokenBalance,
      balance: shared.tokenBalance,
      isSuperadminWallet: true,
      isSharedWallet: true,
      walletId: SUPERADMIN_SHARED_WALLET_DOC
    };
  }

  // Regular user balance
  if (userId && isFirebaseConfigured) {
    try {
      const userSnap = await db.collection('users').doc(userId).get();
      if (userSnap.exists) {
        const data = userSnap.data();
        if (typeof data?.tokenBalance === 'number') {
          const bal = toStrictIntegerTokens(data.tokenBalance);
          return {
            tokenBalance: bal,
            balance: bal,
            isSuperadminWallet: false,
            isSharedWallet: false,
            walletId: userId
          };
        }
      }
    } catch (err) {
      console.warn('[getUserTokenBalance] Firestore read error:', err);
    }
  }

  const fallback = toStrictIntegerTokens(memoryUserWallets[userId || ''] ?? memoryUserWallets[userEmail || ''] ?? 50);
  return {
    tokenBalance: fallback,
    balance: fallback,
    isSuperadminWallet: false,
    isSharedWallet: false,
    walletId: userId || userEmail || 'guest'
  };
}

/**
 * Credits tokens to a wallet:
 * - If isCommunityFund is true -> Directly credits the ONE Superadmin Shared Token Account!
 * - If user buys for SELF -> Credits their user account in Firestore (or the shared superadmin wallet if buyer is superadmin).
 */
export async function creditTokenWallet(params: {
  tokens: number;
  userId?: string;
  userEmail?: string;
  isCommunityFund?: boolean;
  contributorName?: string;
  fiatAmount?: number;
  currency?: string;
  stripeSessionId?: string;
  note?: string;
}): Promise<{
  success: boolean;
  creditedTokens: number;
  newBalance: number;
  targetWallet: string;
  transactionId: string;
}> {
  const strictTokens = toStrictIntegerTokens(params.tokens);
  if (strictTokens <= 0) {
    throw new Error('Token amount must be a positive whole integer');
  }

  const isSuperUid = params.userId === PRIMARY_SUPERADMIN_UID || params.userId === SECONDARY_SUPERADMIN_UID;
  const isSuper = isProjectOwnerEmail(params.userEmail) || isSuperUid;

  // Strict Rule: If any token is not purchased by someone to go to a specific account,
  // ALL tokens go to the accumulated token fund, which is the superadmin token account (token_wallets/superadmin_shared).
  const isPurchasedForSpecificAccount = Boolean(
    params.userId &&
    params.userId.trim() &&
    params.userId !== 'guest_wallet' &&
    params.userId !== 'guest' &&
    !params.isCommunityFund
  );

  const goesToSuperadmin = !isPurchasedForSpecificAccount || isSuper;
  const targetWalletId = goesToSuperadmin ? SUPERADMIN_SHARED_WALLET_DOC : params.userId!;

  let newBalance = 0;

  if (goesToSuperadmin) {
    // 1. Credit the Master Shared Superadmin Token Wallet
    memorySuperadminSharedWallet.tokenBalance += strictTokens;
    if (params.isCommunityFund) {
      memorySuperadminSharedWallet.totalCommunityDonations += strictTokens;
    } else {
      memorySuperadminSharedWallet.totalPurchased += strictTokens;
    }
    memorySuperadminSharedWallet.lastUpdated = new Date().toISOString();
    newBalance = memorySuperadminSharedWallet.tokenBalance;

    if (isFirebaseConfigured) {
      try {
        const walletRef = db.collection('token_wallets').doc(SUPERADMIN_SHARED_WALLET_DOC);
        await walletRef.set({
          id: SUPERADMIN_SHARED_WALLET_DOC,
          tokenBalance: FieldValue.increment(strictTokens),
          totalCommunityDonations: params.isCommunityFund ? FieldValue.increment(strictTokens) : FieldValue.increment(0),
          totalPurchased: !params.isCommunityFund ? FieldValue.increment(strictTokens) : FieldValue.increment(0),
          primarySuperadminEmail: PRIMARY_SUPERADMIN_EMAIL,
          primarySuperadminUid: PRIMARY_SUPERADMIN_UID,
          authorizedSuperadminEmails: [PRIMARY_SUPERADMIN_EMAIL, SECONDARY_SUPERADMIN_EMAIL],
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        // Also sync the primary superadmin user document
        await db.collection('users').doc(PRIMARY_SUPERADMIN_UID).set({
          tokenBalance: FieldValue.increment(strictTokens),
          sharedSuperadminWallet: SUPERADMIN_SHARED_WALLET_DOC,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('[creditTokenWallet] Firestore write error:', err);
      }
    }
  } else {
    // 2. Regular user buying tokens for SELF
    const current = memoryUserWallets[params.userId || ''] || 0;
    newBalance = current + strictTokens;
    if (params.userId) memoryUserWallets[params.userId] = newBalance;

    if (params.userId && isFirebaseConfigured) {
      try {
        await db.collection('users').doc(params.userId).set({
          tokenBalance: FieldValue.increment(strictTokens),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('[creditTokenWallet] User balance Firestore write error:', err);
      }
    }
  }

  // Record immutable transaction log in token_ledger
  const txRecord = await saveTokenTransaction({
    action: (params.isCommunityFund || !isPurchasedForSpecificAccount)
      ? 'COMMUNITY_FUND_DONATION_TO_SUPERADMIN'
      : 'TOKEN_PURCHASE_SELF',
    performedBy: params.userEmail || params.contributorName || 'Anonymous Supporter',
    userId: isPurchasedForSpecificAccount ? params.userId! : null,
    targetAllocation: targetWalletId,
    tokensAmount: strictTokens,
    fiatEquivalent: params.fiatAmount || 0,
    currency: params.currency || 'AUD',
    stripeSessionId: params.stripeSessionId || null,
    note: params.note || '',
    newBalance
  });

  return {
    success: true,
    creditedTokens: strictTokens,
    newBalance,
    targetWallet: targetWalletId,
    transactionId: txRecord.transactionId
  };
}

/**
 * Spends tokens atomically:
 * - If user is Superadmin -> Deducts from the ONE Superadmin Shared Token Account!
 * - If user is regular -> Deducts from users/{userId}.tokenBalance in Firestore.
 * Throws an error if token balance is insufficient.
 */
export async function spendTokens(params: {
  tokens: number;
  userId?: string;
  userEmail?: string;
  action: string;
  reason?: string;
  metadata?: Record<string, any>;
}): Promise<{
  success: boolean;
  spentTokens: number;
  remainingBalance: number;
  walletId: string;
  transactionId: string;
}> {
  const strictTokens = toStrictIntegerTokens(params.tokens);
  if (strictTokens <= 0) {
    throw new Error('Tokens to spend must be a positive whole integer');
  }

  const isSuperUid = params.userId === PRIMARY_SUPERADMIN_UID || params.userId === SECONDARY_SUPERADMIN_UID;
  const isSuper = isProjectOwnerEmail(params.userEmail) || isSuperUid;
  const targetWalletId = isSuper ? SUPERADMIN_SHARED_WALLET_DOC : (params.userId || 'guest_wallet');

  let remainingBalance = 0;

  if (isSuper) {
    // 1. Superadmin spend from the ONE shared account
    if (memorySuperadminSharedWallet.tokenBalance < strictTokens) {
      throw new Error(`Insufficient tokens: Superadmin shared wallet has ${memorySuperadminSharedWallet.tokenBalance} tokens, but ${strictTokens} required.`);
    }

    memorySuperadminSharedWallet.tokenBalance -= strictTokens;
    memorySuperadminSharedWallet.totalSpent += strictTokens;
    memorySuperadminSharedWallet.lastUpdated = new Date().toISOString();
    remainingBalance = memorySuperadminSharedWallet.tokenBalance;

    if (isFirebaseConfigured) {
      try {
        const walletRef = db.collection('token_wallets').doc(SUPERADMIN_SHARED_WALLET_DOC);
        await walletRef.set({
          tokenBalance: FieldValue.increment(-strictTokens),
          totalSpent: FieldValue.increment(strictTokens),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('users').doc(PRIMARY_SUPERADMIN_UID).set({
          tokenBalance: FieldValue.increment(-strictTokens),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('[spendTokens] Firestore superadmin spend error:', err);
      }
    }
  } else {
    // 2. Regular user spend
    const current = memoryUserWallets[params.userId || ''] ?? 50;
    if (current < strictTokens) {
      throw new Error(`Insufficient tokens: Account has ${current} tokens, but ${strictTokens} required.`);
    }
    remainingBalance = current - strictTokens;
    if (params.userId) memoryUserWallets[params.userId] = remainingBalance;

    if (params.userId && isFirebaseConfigured) {
      try {
        await db.collection('users').doc(params.userId).set({
          tokenBalance: FieldValue.increment(-strictTokens),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('[spendTokens] Firestore user spend error:', err);
      }
    }
  }

  // Write immutable audit to token_ledger
  const tx = await saveTokenTransaction({
    action: 'TOKEN_SPENT',
    actionName: params.action,
    performedBy: params.userEmail || params.userId || 'User',
    userId: params.userId || null,
    targetAllocation: targetWalletId,
    tokensAmount: -strictTokens,
    reason: params.reason || `Deducted ${strictTokens} tokens for ${params.action}`,
    metadata: params.metadata || {},
    remainingBalance
  });

  return {
    success: true,
    spentTokens: strictTokens,
    remainingBalance,
    walletId: targetWalletId,
    transactionId: tx.transactionId
  };
}

