"use client";

import React, { useState, useId } from 'react';
import { Upload, X, Check, AlertCircle, Download } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { validateFile, uploadFileWithProgress, downloadFile } from '@/lib/client-file-upload';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  onUploadComplete: (filePath: string) => void;
  onUploadError: (error: string) => void;
  accept?: string;
  maxSize?: number;
  subfolder?: string;
  className?: string;
  disabled?: boolean;
  existingFilePath?: string;
  onDownload?: (filePath: string) => void;
  onRemoveFile?: () => void;
}

export function FileUpload({
  onFileSelect,
  onUploadComplete,
  onUploadError,
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSize = 6 * 1024 * 1024, // 6MB
  subfolder = "",
  className = "",
  disabled = false,
  existingFilePath,
  onDownload,
  onRemoveFile
}: FileUploadProps) {
  const uniqueId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (!file) {
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      onUploadError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);

    // Auto-upload the file
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadFileWithProgress(
        file,
        subfolder,
        (progress) => setUploadProgress(progress)
      );

      if (result.success && result.filePath) {
        setUploadedFilePath(result.filePath);
        onUploadComplete(result.filePath);
      } else {
        setError(result.error || 'Upload failed');
        onUploadError(result.error || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadedFilePath(null);
    setError(null);
    setUploadProgress(0);
    onFileSelect(null);
    if (typeof onRemoveFile === 'function') onRemoveFile();
  };

  const handleDownload = async () => {
    if (existingFilePath && onDownload) {
      onDownload(existingFilePath);
    } else if (existingFilePath) {
      try {
        // Extract filename from path
        const filename = existingFilePath.split('/').pop() || 'download';
        console.log('Downloading file:', filename, 'from path:', existingFilePath);
        
        const blob = await downloadFile(filename);
        if (blob) {
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          console.error('Download failed: Could not get file blob');
        }
      } catch (error) {
        console.error('Download error:', error);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileName = (path: string): string => {
    return path.split('/').pop() || 'Unknown file';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {!selectedFile && !existingFilePath ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id={`file-upload-${uniqueId}`}
            disabled={disabled || isUploading}
          />
          <label
            htmlFor={`file-upload-${uniqueId}`}
            className={`cursor-pointer flex flex-col items-center space-y-2 ${
              disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>{' '}
              or drag and drop
            </div>
            <div className="text-xs text-gray-500">
              {accept.replace(/\./g, '').toUpperCase()} files up to {formatFileSize(maxSize)}
            </div>
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {uploadedFilePath || existingFilePath ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : isUploading ? (
                  <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile ? selectedFile.name : (existingFilePath ? getFileName(existingFilePath) : 'Unknown file')}
                </p>
                {selectedFile && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                )}
                {existingFilePath && !selectedFile && (
                  <p className="text-xs text-gray-500">
                    Existing file
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {existingFilePath && !selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-blue-600 hover:text-blue-700"
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={isUploading}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isUploading && (
            <div className="mt-3">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {(uploadedFilePath || existingFilePath) && (
            <div className="mt-2">
              <p className="text-xs text-green-600">
                ✓ {existingFilePath && !selectedFile ? 'File available' : 'Uploaded successfully'}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-2 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 