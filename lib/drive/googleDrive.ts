import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export const DEFAULT_ROOT_FOLDER_ID = '0AB6rUwSYF0xlUk9PVA';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

function getGoogleCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
      return { client_email: parsed.client_email, private_key: parsed.private_key };
    } catch (e) {
      console.warn('[googleDrive] Failed to parse GOOGLE_SERVICE_ACCOUNT JSON:', e);
    }
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const resolvedPath = path.isAbsolute(credPath) ? credPath : path.join(process.cwd(), credPath);
    if (fs.existsSync(resolvedPath)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        return { client_email: fileContent.client_email, private_key: fileContent.private_key };
      } catch (e) {
        console.warn('[googleDrive] Failed to read credentials file at', resolvedPath, e);
      }
    }
  }

  return {
    client_email: process.env.GOOGLE_CLIENT_EMAIL || '',
    private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };
}

let authClient: InstanceType<typeof google.auth.GoogleAuth> | null = null;
let driveClient: ReturnType<typeof google.drive> | null = null;

export function getGoogleDriveAuth() {
  if (!authClient) {
    const creds = getGoogleCredentials();
    authClient = new google.auth.GoogleAuth({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
  }
  return authClient;
}

export function getGoogleDrive() {
  if (!driveClient) {
    driveClient = google.drive({ version: 'v3', auth: getGoogleDriveAuth() });
  }
  return driveClient;
}

export interface ResumableUploadParams {
  name: string;
  parentId: string;
  mimeType: string;
  size: number;
  origin?: string | null;
  fields?: string;
}

/**
 * Initiates a Google Drive resumable upload session.
 * Allows the browser to stream the file directly to Google Drive servers,
 * avoiding Vercel serverless request body limitations (4.5 MB).
 */
export async function startResumableUpload({
  name,
  parentId,
  mimeType,
  size,
  origin,
  fields = 'id,name,mimeType,size,webViewLink,createdTime',
}: ResumableUploadParams): Promise<string> {
  const client = await getGoogleDriveAuth().getClient();
  const res = await client.request<{ [key: string]: any }>({
    url: 'https://www.googleapis.com/upload/drive/v3/files',
    method: 'POST',
    params: {
      uploadType: 'resumable',
      supportsAllDrives: true,
      fields,
    },
    headers: {
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(size),
      ...(origin ? { Origin: origin } : {}),
    },
    data: {
      name,
      parents: [parentId],
    },
  });

  const location = (res.headers as any)?.get?.('location') || (res.headers as any)?.location;
  if (!location) {
    throw new Error('Google Drive API did not return an upload session location URI.');
  }
  return location;
}

/**
 * Ensures a directory named `name` exists directly under `parentId`.
 * Works across both Shared Drives and My Drive folders.
 */
export async function ensureFolder(parentId: string, name: string): Promise<string> {
  const drive = getGoogleDrive();
  const escaped = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  const listRes = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escaped}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 1,
    corpora: 'allDrives',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (listRes.data.files && listRes.data.files.length > 0 && listRes.data.files[0].id) {
    return listRes.data.files[0].id;
  }

  const createRes = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  if (!createRes.data.id) {
    throw new Error(`Failed to create directory '${name}' under parent '${parentId}'.`);
  }

  return createRes.data.id;
}

/**
 * Validates connection and capabilities for a given Google Drive folder.
 */
export async function verifyFolderAccess(folderId: string = DEFAULT_ROOT_FOLDER_ID) {
  const drive = getGoogleDrive();
  const res = await drive.files.get({
    fileId: folderId,
    supportsAllDrives: true,
    fields: 'id, name, mimeType, capabilities, driveId',
  });
  return res.data;
}

export interface UploadBufferParams {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  email: string;
  rootFolderId?: string;
}

export interface UploadBufferResult {
  fileId: string;
  name: string;
  mimeType: string;
  folderPath: string;
  folderId: string;
  webViewLink?: string;
  webContentLink?: string;
}

/**
 * Directly uploads an in-memory Buffer to Google Drive under the hierarchy:
 * ROOT_FOLDER_ID / <email> / <YYYY-MM-DD> / <fileName>
 */
export async function uploadBufferToGoogleDrive({
  buffer,
  fileName,
  mimeType,
  email,
  rootFolderId = process.env.ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || DEFAULT_ROOT_FOLDER_ID,
}: UploadBufferParams): Promise<UploadBufferResult> {
  const cleanEmail = (email || 'student@aifoundation.net.au').toLowerCase().trim();
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date());

  // 1. Ensure folder structure: rootId -> email -> date
  const emailFolderId = await ensureFolder(rootFolderId, cleanEmail);
  const dateFolderId = await ensureFolder(emailFolderId, date);

  // 2. Prepare readable stream from buffer
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  // 3. Upload to Google Drive
  const drive = getGoogleDrive();
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [dateFolderId],
    },
    media: {
      mimeType: mimeType || 'image/jpeg',
      body: stream,
    },
    fields: 'id, name, mimeType, webViewLink, webContentLink',
    supportsAllDrives: true,
  });

  if (!res.data.id) {
    throw new Error('Google Drive API created file but returned no file ID.');
  }

  return {
    fileId: res.data.id,
    name: res.data.name || fileName,
    mimeType: res.data.mimeType || mimeType,
    folderPath: `${cleanEmail}/${date}`,
    folderId: dateFolderId,
    webViewLink: res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`,
    webContentLink: res.data.webContentLink || undefined,
  };
}

