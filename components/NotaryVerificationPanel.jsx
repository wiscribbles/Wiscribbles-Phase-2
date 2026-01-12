'use client';

import React, { useState } from 'react';
import { Check, X, AlertCircle, FileText, User, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';

const NotaryVerificationPanel = ({ 
  clientData, 
  onVerificationComplete,
  isNotary = false,
  sessionData 
}) => {
  const [verificationSteps, setVerificationSteps] = useState({
    identityVerified: false,
    documentReviewed: false,
    signatureConfirmed: false,
    witnessPresent: false
  });
  
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showIDPreview, setShowIDPreview] = useState(false);

  const handleStepToggle = (step) => {
    if (!isNotary) {
      toast.error('Only notary can perform verification');
      return;
    }
    
    setVerificationSteps(prev => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  const allStepsCompleted = Object.values(verificationSteps).every(v => v);

  const handleCompleteVerification = () => {
    if (!allStepsCompleted) {
      toast.error('Please complete all verification steps');
      return;
    }
    
    const verificationData = {
      ...verificationSteps,
      notes: verificationNotes,
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'notary' // This should be the actual notary ID
    };
    
    onVerificationComplete(verificationData);
    toast.success('Verification completed successfully');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="mb-4">
        <h5 className="d-flex align-items-center mb-3">
          <AlertCircle size={20} className="me-2 text-primary" />
          Notary Verification Process
        </h5>
        <p className="text-muted small">
          {isNotary 
            ? 'Please verify the client\'s identity and document details'
            : 'The notary is verifying your identity and document'}
        </p>
      </div>

      {/* Client Information */}
      <div className="mb-4 p-3 bg-light rounded">
        <h6 className="mb-3">Client Information</h6>
        <div className="row g-2">
          <div className="col-12">
            <div className="d-flex align-items-center mb-2">
              <User size={16} className="me-2 text-muted" />
              <span className="small">
                <strong>Name:</strong> {clientData?.firstName} {clientData?.lastName}
              </span>
            </div>
          </div>
          <div className="col-12">
            <div className="d-flex align-items-center mb-2">
              <Calendar size={16} className="me-2 text-muted" />
              <span className="small">
                <strong>Date of Birth:</strong> {clientData?.dateOfBirth || 'Not provided'}
              </span>
            </div>
          </div>
          <div className="col-12">
            <div className="d-flex align-items-center mb-2">
              <CreditCard size={16} className="me-2 text-muted" />
              <span className="small">
                <strong>ID Type:</strong> {clientData?.identificationType || 'Not specified'}
              </span>
            </div>
          </div>
          <div className="col-12">
            <div className="d-flex align-items-center">
              <FileText size={16} className="me-2 text-muted" />
              <span className="small">
                <strong>ID Number:</strong> {clientData?.licenseIdNumber || 'Not provided'}
              </span>
            </div>
          </div>
        </div>
        
        {/* View ID Document Button */}
        {clientData?.identificationImageUrl && (
          <button
            className="btn btn-sm btn-outline-primary mt-3"
            onClick={() => setShowIDPreview(!showIDPreview)}
          >
            <i className="fa fa-eye me-2"></i>
            {showIDPreview ? 'Hide' : 'View'} ID Document
          </button>
        )}
      </div>

      {/* ID Document Preview */}
      {showIDPreview && clientData?.identificationImageUrl && (
        <div className="mb-4 p-3 border rounded">
          <h6 className="mb-2">ID Document</h6>
          <div className="text-center">
            <img 
              src={clientData.identificationImageUrl} 
              alt="Client ID" 
              className="img-fluid rounded"
              style={{ maxHeight: '300px' }}
            />
          </div>
        </div>
      )}

      {/* Verification Checklist */}
      <div className="mb-4">
        <h6 className="mb-3">Verification Checklist</h6>
        <div className="list-group">
          <button
            className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
              verificationSteps.identityVerified ? 'list-group-item-success' : ''
            }`}
            onClick={() => handleStepToggle('identityVerified')}
            disabled={!isNotary}
          >
            <span className="d-flex align-items-center">
              {verificationSteps.identityVerified ? (
                <Check size={18} className="me-2 text-success" />
              ) : (
                <X size={18} className="me-2 text-muted" />
              )}
              Identity Verified
            </span>
            <small className="text-muted">Match ID with person</small>
          </button>

          <button
            className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
              verificationSteps.documentReviewed ? 'list-group-item-success' : ''
            }`}
            onClick={() => handleStepToggle('documentReviewed')}
            disabled={!isNotary}
          >
            <span className="d-flex align-items-center">
              {verificationSteps.documentReviewed ? (
                <Check size={18} className="me-2 text-success" />
              ) : (
                <X size={18} className="me-2 text-muted" />
              )}
              Document Reviewed
            </span>
            <small className="text-muted">Content understood</small>
          </button>

          <button
            className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
              verificationSteps.signatureConfirmed ? 'list-group-item-success' : ''
            }`}
            onClick={() => handleStepToggle('signatureConfirmed')}
            disabled={!isNotary}
          >
            <span className="d-flex align-items-center">
              {verificationSteps.signatureConfirmed ? (
                <Check size={18} className="me-2 text-success" />
              ) : (
                <X size={18} className="me-2 text-muted" />
              )}
              Willingness Confirmed
            </span>
            <small className="text-muted">Client agrees to sign</small>
          </button>

          <button
            className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
              verificationSteps.witnessPresent ? 'list-group-item-success' : ''
            }`}
            onClick={() => handleStepToggle('witnessPresent')}
            disabled={!isNotary}
          >
            <span className="d-flex align-items-center">
              {verificationSteps.witnessPresent ? (
                <Check size={18} className="me-2 text-success" />
              ) : (
                <X size={18} className="me-2 text-muted" />
              )}
              No Duress/Coercion
            </span>
            <small className="text-muted">Free will confirmed</small>
          </button>
        </div>
      </div>

      {/* Verification Notes */}
      {isNotary && (
        <div className="mb-4">
          <label className="form-label small">Verification Notes (Optional)</label>
          <textarea
            className="form-control"
            rows="3"
            placeholder="Add any additional notes about the verification process..."
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
          />
        </div>
      )}

      {/* Status Summary */}
      <div className={`alert ${allStepsCompleted ? 'alert-success' : 'alert-warning'} mb-3`}>
        <div className="d-flex align-items-center">
          {allStepsCompleted ? (
            <>
              <Check size={20} className="me-2" />
              <span>All verification steps completed</span>
            </>
          ) : (
            <>
              <AlertCircle size={20} className="me-2" />
              <span>
                {isNotary 
                  ? `${Object.values(verificationSteps).filter(v => v).length} of 4 steps completed`
                  : 'Verification in progress...'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Complete Verification Button */}
      {isNotary && (
        <button
          className="btn btn-primary w-100"
          onClick={handleCompleteVerification}
          disabled={!allStepsCompleted}
        >
          <Check size={18} className="me-2" />
          Complete Verification
        </button>
      )}
    </div>
  );
};

export default NotaryVerificationPanel;
