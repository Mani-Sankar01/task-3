"use client";

import { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadFile, validateFile, downloadFile } from '@/lib/client-file-upload';

export default function TestUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileStates, setFileStates] = useState<{[key: string]: any}>({});

  const handleFileSelect = (file: File | null, fieldName: string) => {
    console.log('File selected for', fieldName, ':', file);
    setFileStates(prev => ({
      ...prev,
      [fieldName]: { file, uploaded: false }
    }));
  };

  const handleUploadComplete = (filePath: string, fieldName: string) => {
    console.log('File uploaded for', fieldName, ':', filePath);
    setUploadedFiles(prev => [...prev, `${fieldName}: ${filePath}`]);
    setFileStates(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], uploaded: true, filePath }
    }));
  };

  const handleUploadError = (error: string, fieldName: string) => {
    console.error('Upload error for', fieldName, ':', error);
    setErrors(prev => [...prev, `${fieldName}: ${error}`]);
  };

  const handleDownload = async (filePath: string) => {
    try {
      // Extract filename from path
      const filename = filePath.split('/').pop() || 'document';
      console.log('Downloading file:', filename, 'from path:', filePath);
      
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
  };

  const testDirectUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Testing direct upload for:', file.name);
    
    // Test validation
    const validation = validateFile(file);
    console.log('Validation result:', validation);

    if (validation.isValid) {
      // Test upload
      const result = await uploadFile(file, 'test');
      console.log('Upload result:', result);
      
      if (result.success) {
        setUploadedFiles(prev => [...prev, `Direct: ${result.filePath}`]);
      } else {
        setErrors(prev => [...prev, `Direct: ${result.error}`]);
      }
    } else {
      setErrors(prev => [...prev, `Direct: ${validation.error}`]);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">File Upload Test Page</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Test Multiple FileUpload Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Sale Deed</h3>
              <FileUpload
                onFileSelect={(file) => handleFileSelect(file, 'saleDeed')}
                onUploadComplete={(filePath) => handleUploadComplete(filePath, 'saleDeed')}
                onUploadError={(error) => handleUploadError(error, 'saleDeed')}
                subfolder="test"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Rental Deed</h3>
              <FileUpload
                onFileSelect={(file) => handleFileSelect(file, 'rentalDeed')}
                onUploadComplete={(filePath) => handleUploadComplete(filePath, 'rentalDeed')}
                onUploadError={(error) => handleUploadError(error, 'rentalDeed')}
                subfolder="test"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Partnership Deed</h3>
              <FileUpload
                onFileSelect={(file) => handleFileSelect(file, 'partnershipDeed')}
                onUploadComplete={(filePath) => handleUploadComplete(filePath, 'partnershipDeed')}
                onUploadError={(error) => handleUploadError(error, 'partnershipDeed')}
                subfolder="test"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Additional Document</h3>
              <FileUpload
                onFileSelect={(file) => handleFileSelect(file, 'additionalDoc')}
                onUploadComplete={(filePath) => handleUploadComplete(filePath, 'additionalDoc')}
                onUploadError={(error) => handleUploadError(error, 'additionalDoc')}
                subfolder="test"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Test Direct Upload</h2>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={testDirectUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">File States</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(fileStates, null, 2)}
            </pre>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
          {uploadedFiles.length > 0 ? (
            <ul className="space-y-2">
              {uploadedFiles.map((filePath, index) => (
                <li key={index} className="text-green-600">
                  ✓ {filePath}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No files uploaded yet</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Errors</h2>
          {errors.length > 0 ? (
            <ul className="space-y-2">
              {errors.map((error, index) => (
                <li key={index} className="text-red-600">
                  ✗ {error}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No errors</p>
          )}
        </div>
      </div>
    </div>
  );
} 