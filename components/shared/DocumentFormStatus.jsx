// Reusable component for document form save status and loading state
import React from 'react';

const DocumentFormStatus = ({ 
  isLoading, 
  saveStatus, 
  title = "Loading your saved data...",
  loadingMessage = "Loading your saved data...",
  className = ""
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className={`d-flex justify-content-center align-items-center ${className}`} style={{
        padding: '40px',
        fontSize: '16px',
        color: '#666'
      }}>
        <i className="fa fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        {loadingMessage}
      </div>
    );
  }

  // Save status indicator
  if (saveStatus) {
    return (
      <div style={{
        backgroundColor: saveStatus === 'saving' ? '#fff3cd' : saveStatus === 'saved' ? '#d4edda' : '#f8d7da',
        border: `1px solid ${saveStatus === 'saving' ? '#ffeaa7' : saveStatus === 'saved' ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px',
        padding: '8px 12px',
        marginBottom: '15px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        className: className
      }}>
        {saveStatus === 'saving' && <i className="fa fa-spinner fa-spin"></i>}
        {saveStatus === 'saved' && <i className="fa fa-check" style={{ color: '#155724' }}></i>}
        {saveStatus === 'error' && <i className="fa fa-exclamation-triangle" style={{ color: '#721c24' }}></i>}
        
        {saveStatus === 'saving' && 'Auto-saving your data...'}
        {saveStatus === 'saved' && 'Your data has been saved automatically'}
        {saveStatus === 'error' && 'Error saving data - your changes are saved locally'}
      </div>
    );
  }

  return null;
};

export default DocumentFormStatus;
