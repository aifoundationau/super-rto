import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Trash2,
  Mail,
  Loader2,
  FolderCheck,
  HardDrive
} from 'lucide-react';
import {
  ACCEPTED_EXTENSIONS_STRING,
  validateUploadFile,
  uploadToGoogleDrive,
  formatBytes,
  DriveUploadedFile,
} from '@/lib/drive/driveUploadService';

interface AdminDriveUploadPanelProps {
  currentUserEmail?: string;
  onToast?: (message: string) => void;
}

export const AdminDriveUploadPanel: React.FC<AdminDriveUploadPanelProps> = ({
  currentUserEmail = '',
  onToast,
}) => {
  const [email, setEmail] = useState<string>(currentUserEmail || 'student@aifoundation.net.au');
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedResults, setUploadedResults] = useState<DriveUploadedFile[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = async (selected: File | null) => {
    if (!selected) return;
    const validationError = await validateUploadFile(selected);
    setErrorMessage(validationError);
    setFile(validationError ? null : selected);
    if (validationError && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 1) {
      setErrorMessage('Please upload one file at a time.');
      return;
    }
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleSelectFile(droppedFile);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please choose or drop a file to upload.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid member/student email address.');
      return;
    }

    setErrorMessage('');
    setUploadProgress(0);
    setIsUploading(true);

    try {
      const result = await uploadToGoogleDrive(email, file, (ratio) => {
        setUploadProgress(Math.round(ratio * 100));
      });

      setUploadedResults((prev) => [result, ...prev]);
      handleClearFile();
      const successMsg = `Uploaded "${result.name}" to folder "${result.folderPath}".`;
      onToast?.(successMsg);
    } catch (err: any) {
      console.error('[AdminDriveUploadPanel] Upload failed:', err);
      setErrorMessage(err.message || 'Network error occurred while uploading to Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = (link?: string, id?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id || link);
    setTimeout(() => setCopiedId(null), 2500);
    onToast?.('Google Drive share link copied to clipboard.');
  };

  return (
    <div
      data-testid="admin-drive-upload-panel"
      data-agent-id="admin-drive-upload-panel"
      className="p-6 max-w-4xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl text-slate-100"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Google Drive Resumable Upload
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Direct-to-drive streaming: <span className="font-mono text-slate-300">ROOT_FOLDER_ID/&lt;email&gt;/&lt;YYYY-MM-DD&gt;/&lt;file&gt;</span>
              </p>
            </div>
          </div>
        </div>

        <a
          href="https://drive.google.com/drive/folders/0AB6rUwSYF0xlUk9PVA"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-view-shared-drive"
          data-agent-id="link-view-shared-drive"
          aria-label="Open GDrive Uploader Shared Drive in new tab"
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-orange-400 hover:text-orange-300 border border-slate-700/60 transition-colors w-fit"
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Open Shared Drive</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUploadSubmit} className="mt-6 space-y-5">
        {/* Email Field */}
        <div>
          <label
            htmlFor="upload-target-email"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
          >
            Target Member / Student Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="upload-target-email"
              data-testid="input-upload-target-email"
              data-agent-id="input-upload-target-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. learner@example.com"
              aria-label="Target student or member email address"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Google Drive automatically creates a folder matching this email under the root Shared Drive.
          </span>
        </div>

        {/* Dropzone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Document or Image File
          </label>
          <div
            role="button"
            tabIndex={0}
            data-testid="dropzone-drive-upload"
            data-agent-id="dropzone-drive-upload"
            aria-label="Upload dropzone, click or drag and drop to select file"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
                : file
                ? 'border-emerald-500/60 bg-emerald-950/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              data-testid="file-input-drive"
              data-agent-id="file-input-drive"
              type="file"
              accept={ACCEPTED_EXTENSIONS_STRING}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleSelectFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="font-semibold text-slate-100 text-sm max-w-md truncate">
                  {file.name}
                </div>
                <div className="text-xs text-slate-400">
                  {formatBytes(file.size)} &bull; {file.type || 'Document'}
                </div>
                <button
                  type="button"
                  data-testid="button-remove-selected-file"
                  data-agent-id="button-remove-selected-file"
                  aria-label="Remove selected file"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove file</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-1">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-slate-300">
                  <span className="text-orange-400 font-semibold hover:underline">Click to browse</span> or drag & drop file here
                </div>
                <div className="text-xs text-slate-500">
                  Supported formats: JPG, PNG, WEBP, PDF, DOCX (Up to 100 MB)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar (during upload) */}
        {isUploading && (
          <div
            data-testid="progress-container-upload"
            data-agent-id="progress-container-upload"
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                Streaming to Google Drive...
              </span>
              <span className="font-mono font-bold text-orange-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            data-testid="alert-upload-error"
            data-agent-id="alert-upload-error"
            role="alert"
            className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!file || isUploading}
            data-testid="button-submit-drive-upload"
            data-agent-id="button-submit-drive-upload"
            aria-label="Upload file to Google Drive"
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${
              !file || isUploading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20 active:scale-95'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload to Google Drive</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Uploaded History / Results */}
      {uploadedResults.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Uploaded Files in this Session ({uploadedResults.length})</span>
          </h3>

          <div className="space-y-2.5">
            {uploadedResults.map((item) => (
              <div
                key={item.fileId}
                data-testid={`uploaded-item-${item.fileId}`}
                data-agent-id={`uploaded-item-${item.fileId}`}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <FolderCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span>Folder: </span>
                      <code className="text-emerald-400/90 font-mono">{item.folderPath}</code>
                      <span className="mx-1.5">&bull;</span>
                      <span>{formatBytes(item.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.webViewLink && (
                    <a
                      href={item.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-view-drive-file-${item.fileId}`}
                      data-agent-id={`link-view-drive-file-${item.fileId}`}
                      aria-label={`Open ${item.name} in Google Drive`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      <span>View in Drive</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  )}

                  {item.webViewLink && (
                    <button
                      type="button"
                      data-testid={`button-copy-drive-link-${item.fileId}`}
                      data-agent-id={`button-copy-drive-link-${item.fileId}`}
                      aria-label="Copy Google Drive share link"
                      onClick={() => handleCopyLink(item.webViewLink, item.fileId)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Copy Drive link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {copiedId === item.fileId && (
                    <span className="text-[11px] text-emerald-400 font-medium animate-pulse">
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
