import { FileText, Upload, X } from 'lucide-react';
import React, { useState } from 'react';

const MediaUpload = ({
  type = 'image',
  onFileUpload,
  onRemove,
  fileUrl,
  accept = 'image/*',
  maxSizeMB = 5,
  className = ''
}) => {
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    validateAndUpload(file);
  };

  const validateAndUpload = (file) => {
    if (!file) return;

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB`);
      return;
    }

    // Check file type
    if (!file.type.match(accept.replace('*', '.*'))) {
      setError(`Invalid file type. Please upload a ${type} file.`);
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (e) => onFileUpload(e.target.result);
    reader.readAsDataURL(file);
  };

  if (fileUrl) {
    return (
      <div className={`relative ${className}`}>
        {type === 'image' && (
          <img src={fileUrl} alt="Uploaded media" className="w-full h-auto rounded-lg" />
        )}
        {type === 'video' && (
          <video src={fileUrl} controls className="w-full rounded-lg" />
        )}
        {type === 'document' && (
          <div className="border border-gray-200 rounded-lg p-4 flex items-center">
            <FileText className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="font-medium">Document</p>
              <p className="text-sm text-gray-500">Click to view</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          aria-label="Remove media"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
        } ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="media-upload"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <label
        htmlFor="media-upload"
        className="cursor-pointer flex flex-col items-center"
      >
        <Upload className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600">
          Drag and drop your {type} here, or <span className="text-blue-600">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {type === 'image' ? 'JPG, PNG up to 5MB' :
            type === 'video' ? 'MP4 up to 16MB' :
              'PDF, DOC, DOCX up to 100MB'}
        </p>
      </label>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default MediaUpload;
