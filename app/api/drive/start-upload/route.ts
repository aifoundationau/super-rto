import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureFolder, startResumableUpload } from '@/lib/drive/googleDrive';
import { getVerifiedCaller } from '@/lib/auth/serverAuth';
import { isFirebaseConfigured, recordActivity } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const TIMEZONE = 'Australia/Sydney';
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB strict limit

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

const GoogleDriveStartUploadRequestContract = z.object({
  email: z.string().email().max(255),
  fileName: z.string().min(1).max(200).regex(/^[\w\-. ]+\.(jpe?g|png|webp|pdf|docx)$/i, {
    message: 'Allowed file extensions: .jpg, .jpeg, .png, .webp, .pdf, .docx',
  }),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  size: z.number().int().min(1).max(MAX_BYTES, {
    message: 'File size must be between 1 byte and 100 MB.',
  }),
}).strict();

const PERMITTED_ROLES = [
  'superadmin',
  'director',
  'administration',
  'teacher',
  'admin',
  'trainer',
  'chancellor',
  'president',
  'ceo',
  'coo',
];

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate caller (defense-in-depth)
    const caller = await getVerifiedCaller(req);

    if (caller) {
      const role = (caller.role || '').toLowerCase();
      const isAllowed = caller.isSuperAdmin || PERMITTED_ROLES.includes(role);
      if (!isAllowed) {
        return NextResponse.json(
          {
            error: 'Forbidden: Only administrators, directors, or teachers can upload files to Google Drive.',
            code: 'FORBIDDEN',
            currentRole: caller.role,
          },
          { status: 403 }
        );
      }
    } else if (isFirebaseConfigured) {
      // In production or when Firebase Admin is live, unauthenticated uploads are prohibited
      return NextResponse.json(
        {
          error: 'Unauthorized: A verified session is required to initiate Google Drive uploads.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    } else {
      // Offline / Local Development Fallback
      console.warn('[drive/start-upload] Running with local development unauthenticated fallback.');
    }

    // 2. Validate Root Folder ID
    const rootId = process.env.ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootId) {
      console.error('[drive/start-upload] ROOT_FOLDER_ID is missing from environment variables.');
      return NextResponse.json(
        { error: 'Google Drive ROOT_FOLDER_ID is not configured on the server.' },
        { status: 500 }
      );
    }

    // 3. Parse & Validate Input against Data Contract
    const body = await req.json();
    const parseResult = GoogleDriveStartUploadRequestContract.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: parseResult.error.errors[0]?.message || 'Invalid upload parameters.',
          issues: parseResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, fileName, mimeType, size } = parseResult.data;

    // 4. Resolve / Create Folder Hierarchy: ROOT_FOLDER_ID / <email> / <YYYY-MM-DD>
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date()); // YYYY-MM-DD
    const emailFolderId = await ensureFolder(rootId, email.toLowerCase().trim());
    const dateFolderId = await ensureFolder(emailFolderId, date);

    // 5. Open Resumable Upload Session with Google Drive API
    const origin = req.headers.get('origin');
    const uploadUrl = await startResumableUpload({
      name: fileName,
      parentId: dateFolderId,
      mimeType,
      size,
      origin,
      fields: 'id,name,mimeType,size,webViewLink,createdTime',
    });

    if (!uploadUrl) {
      throw new Error('Google Drive API did not return an upload session location URI.');
    }

    // 6. Record Audit Activity
    await recordActivity({
      category: 'GDRIVE_UPLOAD',
      action: 'START_RESUMABLE_UPLOAD',
      userEmail: caller?.email || email,
      metadata: {
        targetEmail: email,
        fileName,
        mimeType,
        size,
        folderPath: `${email}/${date}`,
        folderId: dateFolderId,
      },
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      folderPath: `${email}/${date}`,
      folderId: dateFolderId,
      fileName,
      maxBytes: MAX_BYTES,
    });
  } catch (error: any) {
    console.error('[drive/start-upload] Error initiating upload session:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to start Google Drive upload session.',
      },
      { status: 500 }
    );
  }
}
