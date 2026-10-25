/**
 * Super-RTO Direct Google Drive Resumable Upload Service
 *
 * Streamlines 2-step direct-to-cloud resumable upload:
 * 1. POST /api/drive/start-upload: Verifies RBAC, prepares folder hierarchy (<email>/<YYYY-MM-DD>),
 *    and opens an authorized Google Drive resumable session URI.
 * 2. Client-side streaming: The browser streams file bytes directly to Google Drive via PUT,
 *    completely bypassing Vercel serverless payload limits (4.5 MB).
 */

import { getClientAuthToken } from '@/lib/firebase/client';

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB Strict Limit

interface FileTypeSpec {
  exts: string[];
  magic: (bytes: Uint8Array) => boolean;
}

const ascii = (bytes: Uint8Array, start: number, end: number): string =>
  String.fromCharCode(...Array.from(bytes.subarray(start, end)));

const FILE_TYPES: Record<string, FileTypeSpec> = {
  'image/jpeg': {
    exts: ['jpg', 'jpeg'],
    magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    exts: ['png'],
    magic: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((x, i) => b[i] === x),
  },
  'image/webp': {
    exts: ['webp'],
    magic: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP',
  },
  'application/pdf': {
    exts: ['pdf'],
    magic: (b) => ascii(b, 0, 5) === '%PDF-',
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    exts: ['docx'],
    magic: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  },
};

export const ACCEPTED_EXTENSIONS_STRING = Object.entries(FILE_TYPES)
  .flatMap(([type, { exts }]) => [type, ...exts.map((e) => `.${e}`)])
  .join(',');

export const extOf = (filename: string): string =>
  (filename.split('.').pop() || '').toLowerCase();

export function resolveMimeType(file: File): string {
  if (FILE_TYPES[file.type]?.exts.includes(extOf(file.name))) {
    return file.type;
  }
  const match = Object.keys(FILE_TYPES).find((type) =>
    FILE_TYPES[type].exts.includes(extOf(file.name))
  );
  return match || '';
}

export async function validateUploadFile(file: File): Promise<string> {
  const mimeType = resolveMimeType(file);
  if (!mimeType) {
    return 'Only JPG, PNG, WEBP, PDF, and DOCX files are allowed.';
  }
  if (!file.size || file.size <= 0) {
    return `File "${file.name}" is empty (0 bytes).`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File "${file.name}" exceeds the 100 MB limit (${formatBytes(file.size)}).`;
  }

  try {
    const headerBuffer = await file.slice(0, 16).arrayBuffer();
    const head = new Uint8Array(headerBuffer);
    if (!FILE_TYPES[mimeType].magic(head)) {
      return `File "${file.name}" does not match the valid signature for .${extOf(file.name).toUpperCase()}.`;
    }
  } catch (err: any) {
    return `Failed to inspect file signature: ${err.message}`;
  }

  return '';
}

export interface StartUploadResult {
  uploadUrl: string;
  folderPath: string;
  folderId: string;
  fileName: string;
}

export async function requestResumableUploadSession(
  email: string,
  file: File,
  mimeType: string
): Promise<StartUploadResult> {
  const token = await getClientAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/drive/start-upload', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      fileName: file.name,
      mimeType,
      size: file.size,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to initiate upload session (HTTP ${res.status}).`);
  }

  return data;
}

export function streamFileToGoogleDrive(
  uploadUrl: string,
  file: File,
  mimeType: string,
  onProgress?: (ratio: number) => void
): Promise<{
  id: string;
  name: string;
  mimeType: string;
  size: string;
  webViewLink?: string;
  createdTime?: string;
}> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress?.(e.loaded / e.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const parsed = JSON.parse(xhr.responseText);
          resolve(parsed);
        } catch {
          reject(new Error('Google Drive accepted the file but returned an unparseable response.'));
        }
      } else {
        reject(new Error(`Google Drive rejected the upload session (HTTP ${xhr.status}): ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred while uploading directly to Google Drive.'));
    };

    xhr.send(file);
  });
}

export interface DriveUploadedFile {
  status: 'uploaded';
  fileId: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink?: string;
  createdTime?: string;
  folderPath: string;
  folderId: string;
}

export async function uploadToGoogleDrive(
  email: string,
  file: File,
  onProgress?: (ratio: number) => void
): Promise<DriveUploadedFile> {
  const mimeType = resolveMimeType(file);
  if (!mimeType) {
    throw new Error('Unsupported file type.');
  }

  const session = await requestResumableUploadSession(email, file, mimeType);
  const driveResult = await streamFileToGoogleDrive(session.uploadUrl, file, mimeType, onProgress);

  return {
    status: 'uploaded',
    fileId: driveResult.id,
    name: driveResult.name,
    mimeType: driveResult.mimeType,
    size: Number(driveResult.size || file.size),
    webViewLink: driveResult.webViewLink,
    createdTime: driveResult.createdTime,
    folderPath: session.folderPath,
    folderId: session.folderId,
  };
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
