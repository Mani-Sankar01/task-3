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
 * Validates a file for upload on the client side
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
 * Uploads a file using the API route
 */
export async function uploadFile(file: File, subfolder: string = ''): Promise<FileUploadResult> {
  try {
    // Validate file on client side first
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    if (subfolder) {
      formData.append('subfolder', subfolder);
    }

    // Upload file
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Upload failed'
      };
    }

    const result = await response.json();
    return {
      success: true,
      filePath: result.filePath,
      fileName: result.fileName
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
 * Uploads a file with progress tracking
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

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    if (subfolder) {
      formData.append('subfolder', subfolder);
    }

    // Upload with progress tracking using XMLHttpRequest
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              filePath: result.filePath,
              fileName: result.fileName
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Invalid response from server'
            });
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            resolve({
              success: false,
              error: errorData.error || 'Upload failed'
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Upload failed'
            });
          }
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload'
        });
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });

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
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 