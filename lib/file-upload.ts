import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface FileUploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg', 
  'image/jpg',
  'application/pdf'
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.png', '.jpeg', '.jpg', '.pdf'];

// Maximum file size (6MB in bytes)
const MAX_FILE_SIZE = 6 * 1024 * 1024;

/**
 * Validates a file for upload
 */
export function validateFile(file: File): FileValidationResult {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  return { isValid: true };
}

/**
 * Generates a unique filename to prevent conflicts
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
}

/**
 * Uploads a file to the uploads directory
 */
export async function uploadFile(file: File, subfolder: string = ''): Promise<FileUploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', subfolder);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileName = generateUniqueFileName(file.name);
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return relative path for database storage
    const relativePath = `/uploads/${subfolder ? subfolder + '/' : ''}${fileName}`;

    return {
      success: true,
      filePath: relativePath,
      fileName: fileName
    };

  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: 'Failed to upload file. Please try again.'
    };
  }
}

/**
 * Uploads multiple files
 */
export async function uploadMultipleFiles(files: File[], subfolder: string = ''): Promise<FileUploadResult[]> {
  const uploadPromises = files.map(file => uploadFile(file, subfolder));
  return Promise.all(uploadPromises);
}

/**
 * Validates and uploads a file with progress callback
 */
export async function uploadFileWithProgress(
  file: File, 
  subfolder: string = '',
  onProgress?: (progress: number) => void
): Promise<FileUploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Simulate progress (in real implementation, you might use FormData with XMLHttpRequest)
    if (onProgress) {
      onProgress(10);
      await new Promise(resolve => setTimeout(resolve, 100));
      onProgress(50);
      await new Promise(resolve => setTimeout(resolve, 100));
      onProgress(90);
    }

    // Upload file
    const result = await uploadFile(file, subfolder);
    
    if (onProgress) {
      onProgress(100);
    }

    return result;

  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: 'Failed to upload file. Please try again.'
    };
  }
} 