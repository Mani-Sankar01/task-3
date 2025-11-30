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
  // Get file extension
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.includes('.') 
    ? '.' + fileName.split('.').pop() 
    : '';

  // Check file type (MIME type) or file extension as fallback
  const isValidMimeType = file.type && ALLOWED_FILE_TYPES.includes(file.type);
  const isValidExtension = fileExtension && ALLOWED_EXTENSIONS.includes(fileExtension);
  
  // Accept file if either MIME type OR extension is valid (some browsers don't set MIME type correctly)
  if (!isValidMimeType && !isValidExtension) {
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
 * Uploads a file using the external Node.js file upload API
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

    // Get the API URL from environment variable or use production default
    const apiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL || 'https://documents.tsmwa.online';
    const apiToken = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_TOKEN || 'your-secret-api-token-2024';

    // Upload file to external API
    const response = await fetch(`${apiUrl}/upload`, {
      method: 'POST',
      headers: {
        'x-api-token': apiToken,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || errorData.message || 'Upload failed'
      };
    }

    const result = await response.json();
    
    // Return the file path from the external API response
    return {
      success: true,
      filePath: result.file?.filePath || result.filePath,
      fileName: result.file?.filename || result.fileName
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
 * Uploads a file with progress tracking using the external Node.js file upload API
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

    // Get the API URL from environment variable or use production default
    const apiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL || 'https://documents.tsmwa.online';
    const apiToken = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_TOKEN || 'your-secret-api-token-2024';

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
              filePath: result.file?.filePath || result.filePath,
              fileName: result.file?.filename || result.fileName
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
              error: errorData.error || errorData.message || 'Upload failed'
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

      xhr.open('POST', `${apiUrl}/upload`);
      xhr.setRequestHeader('x-api-token', apiToken);
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

/**
 * Downloads a file from the external API
 */
export async function downloadFile(filename: string): Promise<Blob | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL || 'https://documents.tsmwa.online';
    const apiToken = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_TOKEN || 'your-secret-api-token-2024';

    const response = await fetch(`${apiUrl}/download/${filename}`, {
      headers: {
        'x-api-token': apiToken,
      },
    });

    if (!response.ok) {
      console.error('Download failed:', response.statusText);
      return null;
    }

    return await response.blob();
  } catch (error) {
    console.error('Download error:', error);
    return null;
  }
}

/**
 * Deletes a file from the external API
 */
export async function deleteFile(filename: string): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL || 'https://documents.tsmwa.online';
    const apiToken = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_TOKEN || 'your-secret-api-token-2024';

    const response = await fetch(`${apiUrl}/delete/${filename}`, {
      method: 'DELETE',
      headers: {
        'x-api-token': apiToken,
      },
    });

    if (!response.ok) {
      console.error('Delete failed:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Lists all files from the external API
 */
export async function listFiles(): Promise<any[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL || 'https://documents.tsmwa.online';
    const apiToken = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_TOKEN || 'your-secret-api-token-2024';

    const response = await fetch(`${apiUrl}/files`, {
      headers: {
        'x-api-token': apiToken,
      },
    });

    if (!response.ok) {
      console.error('List files failed:', response.statusText);
      return [];
    }

    const result = await response.json();
    return result.files || [];
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
} 