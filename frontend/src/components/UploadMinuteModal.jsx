import React, { useState } from 'react';
import axios from 'axios';
import './UploadMinuteModal.css';

const UploadMinuteModal = ({ isOpen, onClose, recordId, senaTitle, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

  if (!isOpen) return null;

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      setError('Please select a file');
      return false;
    }

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 20MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)`);
      return false;
    }

    // Check file type
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);
    const isValidMimeType = ALLOWED_TYPES.includes(selectedFile.type);

    if (!isValidExtension || !isValidMimeType) {
      setError('Invalid file type. Please upload a PDF or Word document (DOC, DOCX)');
      return false;
    }

    return true;
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    setSuccessMessage('');
    
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !recordId) {
      setError('Missing file or record ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Create SenaMinutes record with file upload
      const formData = new FormData();
      formData.append('minuteTitle', senaTitle);
      formData.append('minuteFile', file);

      const minuteResponse = await axios.post(
        'http://localhost:8000/api/sena/minutes/',
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!minuteResponse.data || !minuteResponse.data.minute_id) {
        throw new Error('Failed to create minute record');
      }

      const minuteId = minuteResponse.data.minute_id;

      // Step 2: Link minute to record
      const linkResponse = await axios.patch(
        `http://localhost:8000/api/sena/records/${recordId}/`,
        { minute: minuteId },
        { withCredentials: true }
      );

      if (linkResponse.status === 200) {
        setSuccessMessage('Minute uploaded successfully!');
        setFile(null);
        
        // Clear file input
        const fileInput = document.querySelector('.minute-file-input');
        if (fileInput) fileInput.value = '';

        // Call success callback and close after short delay
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1000);
      }
    } catch (err) {
      console.error('Error uploading minute:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        'Failed to upload minute. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('upload-modal-overlay')) {
      onClose();
    }
  };

  const handleCancel = () => {
    setFile(null);
    setError(null);
    setSuccessMessage('');
    const fileInput = document.querySelector('.minute-file-input');
    if (fileInput) fileInput.value = '';
    onClose();
  };

  return (
    <div className="upload-modal-overlay" onClick={handleOverlayClick}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h3>📤 Upload Meeting Minute</h3>
          <button
            className="upload-modal-close"
            onClick={handleCancel}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="upload-modal-body">
          {error && <div className="upload-error-message">{error}</div>}
          {successMessage && <div className="upload-success-message">{successMessage}</div>}

          <div className="upload-form-group">
            <label className="upload-label">Program Title</label>
            <div className="upload-minute-title-display">{senaTitle}</div>
            <p className="upload-subtitle">This will be used as the minute title</p>
          </div>

          <div className="upload-form-group">
            <label htmlFor="minute-file" className="upload-label">
              Select File
            </label>
            <div className="upload-file-input-wrapper">
              <input
                id="minute-file"
                type="file"
                className="minute-file-input"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={loading}
              />
              <label htmlFor="minute-file" className="upload-file-label">
                <span className="upload-file-icon">📎</span>
                <span className="upload-file-text">
                  {file ? file.name : 'Click to select file (PDF, DOC, DOCX)'}
                </span>
              </label>
            </div>
            <p className="upload-file-info">
              Maximum file size: 20MB • Supported: PDF, DOC, DOCX
            </p>
            {file && (
              <div className="upload-file-details">
                <span className="upload-file-size">
                  File size: {(file.size / (1024 * 1024)).toFixed(2)}MB
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="upload-modal-footer">
          <button
            className="upload-btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="upload-btn-primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? '⏳ Uploading...' : '✓ Upload Minute'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadMinuteModal;
