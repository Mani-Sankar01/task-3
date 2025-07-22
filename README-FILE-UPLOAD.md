# File Upload Functionality

This project includes a comprehensive file upload system for member forms with validation, progress tracking, and proper file storage.

## Features

- **File Validation**: Only allows PNG, JPEG, JPG, and PDF files
- **Size Limit**: Maximum file size of 6MB
- **Progress Tracking**: Real-time upload progress with visual feedback
- **Error Handling**: Comprehensive error messages and validation
- **File Storage**: Files are stored in the `/uploads` folder with organized subfolders
- **Unique Naming**: Prevents filename conflicts with timestamp-based naming

## File Structure

```
uploads/
├── documents/     # For member documents (sale deeds, rental deeds, etc.)
├── photos/        # For member photos
└── signatures/    # For signatures and declarations
```

## API Endpoints

### POST `/api/upload`

Uploads a file to the server.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: The file to upload
  - `subfolder`: (optional) Subfolder within uploads directory

**Response:**
```json
{
  "success": true,
  "filePath": "/uploads/documents/1234567890_abc123.pdf",
  "fileName": "1234567890_abc123.pdf"
}
```

**Error Response:**
```json
{
  "error": "File type not allowed. Allowed types: .png, .jpeg, .jpg, .pdf"
}
```

## Client-Side Usage

### Using the FileUpload Component

```tsx
import { FileUpload } from '@/components/ui/file-upload';

function MyForm() {
  const handleFileSelect = (file: File | null) => {
    console.log('File selected:', file);
  };

  const handleUploadComplete = (filePath: string) => {
    console.log('File uploaded:', filePath);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <FileUpload
      onFileSelect={handleFileSelect}
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      subfolder="documents"
      accept=".pdf,.jpg,.jpeg,.png"
    />
  );
}
```

### Using the Upload Utility Directly

```tsx
import { uploadFile, validateFile } from '@/lib/client-file-upload';

async function handleFileUpload(file: File) {
  // Validate file first
  const validation = validateFile(file);
  if (!validation.isValid) {
    alert(validation.error);
    return;
  }

  // Upload file
  const result = await uploadFile(file, 'documents');
  if (result.success) {
    console.log('File uploaded:', result.filePath);
  } else {
    console.error('Upload failed:', result.error);
  }
}
```

## File Validation Rules

### Allowed File Types
- PNG (image/png)
- JPEG (image/jpeg)
- JPG (image/jpg)
- PDF (application/pdf)

### File Size Limit
- Maximum: 6MB (6,291,456 bytes)

### File Naming
- Files are automatically renamed to prevent conflicts
- Format: `{timestamp}_{randomString}.{extension}`
- Example: `1703123456789_abc123def456.pdf`

## Integration with Member Forms

### Add Member Form
The add member form automatically uploads files when the form is submitted:
- Document files (sale deeds, rental deeds, partnership deeds)
- Photo uploads
- Signature uploads

### Edit Member Form
The edit member form uploads only new or changed files:
- Compares with original data to avoid unnecessary uploads
- Preserves existing file paths for unchanged files
- Uploads new files and updates the database with new paths

## Error Handling

The system provides comprehensive error handling:

1. **Client-side validation**: Files are validated before upload
2. **Server-side validation**: Additional validation on the server
3. **Upload errors**: Network and server errors are caught and displayed
4. **User feedback**: Clear error messages and success indicators

## Security Considerations

- File type validation prevents malicious file uploads
- File size limits prevent server overload
- Unique file naming prevents path traversal attacks
- Files are stored outside the web root for security

## Troubleshooting

### Common Issues

1. **File type not allowed**: Ensure the file is PNG, JPEG, JPG, or PDF
2. **File too large**: Compress the file or use a smaller file (max 6MB)
3. **Upload fails**: Check network connection and server status
4. **File not found**: Ensure the uploads directory exists and has proper permissions

### Debugging

- Check browser console for client-side errors
- Check server logs for server-side errors
- Verify file permissions on the uploads directory
- Ensure the API route is accessible

## Future Enhancements

- Drag and drop file upload
- Multiple file upload support
- Image compression for photos
- File preview functionality
- Cloud storage integration (AWS S3, Google Cloud Storage) 