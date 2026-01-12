'use client';

import React, { useState, useEffect } from 'react';
import { uploadToCloudinary } from '@/utils/formStorage';

const UploadDocumentForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  console.log('UploadDocumentForm - Component is rendering!');
  
  const [localFormData, setLocalFormData] = useState({
    documentFile: null,
    documentTitle: '',
    documentDescription: '',
    documentUrl: null,
    ...formData
  });
  const [isValid, setIsValid] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    onFormDataChange(localFormData);
  }, [localFormData, onFormDataChange]);

  useEffect(() => {
    // Validate form - only documentUrl and documentTitle are required
    const valid = localFormData.documentUrl && localFormData.documentTitle && localFormData.documentTitle.trim() !== '';
    setIsValid(valid);
  }, [localFormData]);

  const handleFieldChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setLocalFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file extension and MIME type (PDF only)
      const fileName = file.name.toLowerCase();
      const isValidExtension = fileName.endsWith('.pdf');
      const isValidMimeType = file.type === 'application/pdf';
      
      if (!isValidExtension || !isValidMimeType) {
        alert('Please upload a valid PDF file only. Other file types are not supported.');
        e.target.value = ''; // Clear the file input
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        e.target.value = ''; // Clear the file input
        return;
      }

      try {
        setIsUploading(true);
        setUploadedFile(file);
        
        // Upload to Cloudinary
        const documentUrl = await uploadToCloudinary(file, 'user-documents');
        
        setLocalFormData(prev => ({ 
          ...prev, 
          documentFile: file,
          documentUrl: documentUrl,
          // Auto-fill title if empty
          documentTitle: prev.documentTitle || file.name.replace('.pdf', '')
        }));
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload document. Please try again.');
        e.target.value = ''; // Clear the file input
        setUploadedFile(null);
        setLocalFormData(prev => ({ ...prev, documentFile: null, documentUrl: null }));
      } finally {
        setIsUploading(false);
      }
    } else {
      setUploadedFile(null);
      setLocalFormData(prev => ({ ...prev, documentFile: null, documentUrl: null }));
    }
  };

  // Clear uploaded file info on component mount (page refresh)
  useEffect(() => {
    setUploadedFile(null);
    setLocalFormData(prev => ({ ...prev, documentFile: null }));
  }, []);

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    color: '#333333'
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: '8px',
    display: 'block'
  };

  const sectionStyle = {
    marginBottom: '30px',
    padding: '20px',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa'
  };

  const sectionTitleStyle = {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '15px',
    color: '#2d3748'
  };

  const fileUploadStyle = {
    border: '2px dashed #E2E8F0',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#F7FAFC',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  const fileUploadHoverStyle = {
    ...fileUploadStyle,
    borderColor: '#274171',
    backgroundColor: '#EDF2F7'
  };

  return (
    <div className="upload-document-form">
      {/* Form Header - Matching other forms' style */}
      <div className="text-center mb-5">
        <h2 style={{ color: '#2D3748', fontSize: '24px', fontWeight: '600' }}>
          Upload Your Own Document
        </h2>
        <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>
          Upload and notarize your custom document
        </p>
      </div>

      {/* Document Upload Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>1. DOCUMENT UPLOAD</div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>
            Upload Document <span style={{ color: '#E53E3E' }}>*</span>
          </label>
          <div 
            style={uploadedFile ? fileUploadHoverStyle : fileUploadStyle}
            onClick={() => document.getElementById('document-file-input')?.click()}
            onMouseEnter={(e) => {
              if (!uploadedFile) {
                e.target.style.borderColor = '#274171';
                e.target.style.backgroundColor = '#EDF2F7';
              }
            }}
            onMouseLeave={(e) => {
              if (!uploadedFile) {
                e.target.style.borderColor = '#E2E8F0';
                e.target.style.backgroundColor = '#F7FAFC';
              }
            }}
          >
            <input
              id="document-file-input"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            
            {isUploading ? (
              <div>
                <div className="spinner-border text-primary" role="status" style={{ marginBottom: '15px' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#2D3748', marginBottom: '5px' }}>
                  Uploading document...
                </div>
                <div style={{ fontSize: '14px', color: '#718096' }}>
                  Please wait while your document is being uploaded
                </div>
              </div>
            ) : uploadedFile && localFormData.documentUrl ? (
              <div>
                <i className="fa fa-file-pdf" style={{ fontSize: '48px', color: '#274171', marginBottom: '15px' }}></i>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#2D3748', marginBottom: '5px' }}>
                  {uploadedFile.name} ✓
                </div>
                <div style={{ fontSize: '14px', color: '#718096' }}>
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Uploaded successfully • Click to change
                </div>
              </div>
            ) : (
              <div>
                <i className="fa fa-cloud-upload" style={{ fontSize: '48px', color: '#A0AEC0', marginBottom: '15px' }}></i>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#2D3748', marginBottom: '5px' }}>
                  Click to upload your document
                </div>
                <div style={{ fontSize: '14px', color: '#718096' }}>
                  PDF files only • Maximum size: 05 MB
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>
            Document Title <span style={{ color: '#E53E3E' }}>*</span>
          </label>
          <input
            type="text"
            value={localFormData.documentTitle}
            onChange={handleFieldChange('documentTitle')}
            placeholder="Enter a title for your document"
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Document Description</label>
          <textarea
            value={localFormData.documentDescription}
            onChange={handleFieldChange('documentDescription')}
            placeholder="Brief description of the document (optional)"
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            rows={3}
          />
        </div>
      </div>

      {/* Instructions Section */}
      <div style={{ 
        ...sectionStyle, 
        backgroundColor: '#EDF2F7',
        border: '1px solid #CBD5E0'
      }}>
        <div style={sectionTitleStyle}>📋 INSTRUCTIONS</div>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#4A5568', fontSize: '14px', lineHeight: '1.6' }}>
          <li>Upload your document in PDF format only</li>
          <li>Ensure the document is clear and legible</li>
          <li>Maximum file size is 5 MB</li>
          <li>Provide a descriptive title for easy identification</li>
          <li>Once uploaded, you'll proceed to the notarization process</li>
        </ul>
      </div>

      {/* Form Actions - Matching other forms' style */}
      <div className="form-actions" style={{
        borderTop: '1px solid #e9ecef',
        paddingTop: '20px',
        marginTop: '30px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          style={{
            backgroundColor: isValid ? "#274171" : "#9ca3af",
            color: 'white',
            padding: '12px 30px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isValid ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => isValid && onProceed()}
          disabled={!isValid}
        >
          Proceed to Personal Information
          <i className="fa fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default UploadDocumentForm;
