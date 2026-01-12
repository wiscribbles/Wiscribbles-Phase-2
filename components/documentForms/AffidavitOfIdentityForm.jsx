'use client';
import React from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';
import useDocumentForm from '@/hooks/useDocumentForm';
import DocumentFormStatus from '../shared/DocumentFormStatus';

const AffidavitOfIdentityForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const initialFormData = {
    affiantName: '',
    dateOfBirth: '',
    currentAddress: '',
    phoneNumber: '',
    driversLicense: false,
    passport: false,
    identityCard: false,
    otherIdType: false,
    otherIdDescription: '',
    affirmDate: '',
    affiantSignature: '',
    signatureDate: '',
    
    // Notary fields (disabled for users)
    notaryState: '',
    notaryCounty: '',
    notaryDate: '',
    notaryName: '',
    affiantNameNotary: '',
    
    ...formData
  };
  
  const requiredFields = ['affiantName', 'dateOfBirth', 'currentAddress', 'phoneNumber', 'affirmDate', 'affiantSignature', 'signatureDate'];

  const customValidation = (data) => {
    const errors = {};
    const hasIdentificationType = data.driversLicense || data.passport || data.identityCard || data.otherIdType;
    const otherIdValid = !data.otherIdType || (data.otherIdType && data.otherIdDescription && data.otherIdDescription.trim() !== '');
    if (!hasIdentificationType) errors.identification = 'Select at least one form of identification';
    if (!otherIdValid) errors.otherIdDescription = 'Describe the "Other" ID type';
    return errors;
  };

  const {
    formData: localFormData,
    isLoading,
    saveStatus,
    isValid,
    handleFieldChange
  } = useDocumentForm({
    documentType: 'affidavit-of-identity',
    initialFormData,
    requiredFields,
    customValidation,
    onFormDataChange
  });

  if (isLoading) {
    return (
      <FormWrapper 
        title="Affidavit of Identity" 
        subtitle="Loading your saved data..."
        onProceed={() => false} 
        isValid={false}
      >
        <DocumentFormStatus 
          isLoading={isLoading}
          loadingMessage="Loading your Affidavit of Identity data..."
        />
      </FormWrapper>
    );
  }

  return (
    <FormWrapper 
      title="Affidavit of Identity" 
      subtitle="Complete this sworn statement to verify your identity"
      onProceed={() => isValid && onProceed()} 
      isValid={isValid}
    >
      <DocumentFormStatus saveStatus={saveStatus} />
      
      {/* Validation Status Helper */}
      {!isValid && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>⚠️ Please complete all required fields:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {!localFormData.affiantName?.trim() && <li>Legal name</li>}
            {!localFormData.dateOfBirth && <li>Date of birth</li>}
            {!localFormData.currentAddress?.trim() && <li>Current address</li>}
            {!localFormData.phoneNumber?.trim() && <li>Telephone number</li>}
            {!localFormData.affirmDate && <li>Affirmation date</li>}
            {!localFormData.affiantSignature?.trim() && <li>Signature</li>}
            {!localFormData.signatureDate && <li>Signature date</li>}
            {!(localFormData.driversLicense || localFormData.passport || localFormData.identityCard || localFormData.otherIdType) && <li>Select at least one form of identification</li>}
            {localFormData.otherIdType && !localFormData.otherIdDescription?.trim() && <li>Describe the "Other" ID type</li>}
          </ul>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#856404' }}>
            <strong>Selected IDs:</strong> 
            {[localFormData.driversLicense && "Driver's License", localFormData.passport && "Passport", localFormData.identityCard && "Identity Card", localFormData.otherIdType && `Other (${localFormData.otherIdDescription || 'pending description...'})`].filter(Boolean).join(', ') || 'None selected'}
          </div>
        </div>
      )}
      
      <div style={{ marginBottom: '30px' }}>
        <p style={{ marginBottom: '20px', fontStyle: 'italic', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          I, the Affiant, being duly sworn, hereby affirm on 
          <input
            type="date"
            value={localFormData.affirmDate}
            onChange={handleFieldChange('affirmDate')}
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              fontStyle: 'normal'
            }}
            required
          />
          that:
        </p>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>• My legal name is</span>
            <input
              type="text"
              value={localFormData.affiantName}
              onChange={handleFieldChange('affiantName')}
              placeholder="Enter your complete legal name"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                minWidth: '300px',
                flex: '1'
              }}
              required
            />
            <span>.</span>
          </div>
          
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>• My date of birth is</span>
            <input
              type="date"
              value={localFormData.dateOfBirth}
              onChange={handleFieldChange('dateOfBirth')}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                minWidth: '150px'
              }}
              required
            />
            
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <span>• I currently reside at the following address:</span>
            </div>
            <input
              value={localFormData.currentAddress}
              onChange={handleFieldChange('currentAddress')}
              placeholder="Enter your complete current address"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                width: '100%',
                minHeight: '30px',
                
                resize: 'vertical'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>• My telephone number is:</span>
            <input
              type="tel"
              value={localFormData.phoneNumber}
              onChange={handleFieldChange('phoneNumber')}
              placeholder="Enter your telephone number"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                minWidth: '200px'
              }}
              required
            />
            
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '12px' }}>• I have presented to the notary public:</p>
            <div style={{ marginLeft: '20px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.driversLicense || false}
                    onChange={handleFieldChange('driversLicense')}
                    style={{ marginRight: '8px' }}
                  />
                  <span>Driver's License</span>
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.passport || false}
                    onChange={handleFieldChange('passport')}
                    style={{ marginRight: '8px' }}
                  />
                  <span>Passport</span>
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.identityCard || false}
                    onChange={handleFieldChange('identityCard')}
                    style={{ marginRight: '8px' }}
                  />
                  <span>Identity Card</span>
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={localFormData.otherIdType || false}
                      onChange={handleFieldChange('otherIdType')}
                      style={{ marginRight: '8px' }}
                    />
                    <span>Other:</span>
                  </label>
                  {localFormData.otherIdType && (
                    <input
                      type="text"
                      value={localFormData.otherIdDescription}
                      onChange={handleFieldChange('otherIdDescription')}
                      placeholder="Describe other ID"
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '14px',
                        minWidth: '200px',
                        maxWidth: '300px'
                      }}
                      required
                    />
                  )}
                  {!localFormData.otherIdType && (
                    <span style={{ fontStyle: 'italic', color: '#666' }}>_________________</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <p style={{ marginBottom: '20px' }}>• I understand that false statements on this Affidavit may be punishable by the fullest extent of the law.</p>
          
          <p style={{ marginBottom: '20px' }}>Under penalty of perjury, I hereby declare and affirm that the Affidavit is signed by me and all its contents, to the best of my knowledge, are true and correct.</p>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <span>Affiant's Signature:</span>
              <input
                type="text"
                value={localFormData.affiantSignature}
                onChange={handleFieldChange('affiantSignature')}
                placeholder="Type your full legal name as signature"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  minWidth: '300px',
                  flex: '1'
                }}
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Date:</span>
              <input
                type="date"
                value={localFormData.signatureDate}
                onChange={handleFieldChange('signatureDate')}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  minWidth: '150px'
                }}
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* NOTARY ACKNOWLEDGEMENT Section (Disabled for Users) */}
      <div style={{
        backgroundColor: '#f5f5f5',
        border: '2px solid #ccc',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '30px',
        opacity: '0.7'
      }}>
        <h4 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>NOTARY ACKNOWLEDGEMENT</h4>
        
        <p style={{ fontStyle: 'italic', fontSize: '14px', marginBottom: '15px' }}>
          A notary public or other officer completing this certificate verifies only the identity of the individual who signed the document to which this certificate is attached, and not the truthfulness, accuracy, or validity of that document.
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
          <span>State of</span>
          <input
            type="text"
            value={localFormData.notaryState}
            onChange={handleFieldChange('notaryState')}
            placeholder="[STATE]"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '150px',
              backgroundColor: '#f8f8f8',
              color: '#666'
            }}
            disabled
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
          <span>County of</span>
          <input
            type="text"
            value={localFormData.notaryCounty}
            onChange={handleFieldChange('notaryCounty')}
            placeholder="[COUNTY]"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '150px',
              backgroundColor: '#f8f8f8',
              color: '#666'
            }}
            disabled
          />
        </div>
        
        <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          On <span style={{ fontWeight: 'bold' }}>[DATE]</span> before me, <span style={{ fontWeight: 'bold' }}>[NOTARY'S NAME]</span>, personally appeared <span style={{ fontWeight: 'bold' }}>[AFFIANT'S NAME]</span> who proved to me on the basis of satisfactory evidence to be the person whose name is subscribed to the within instrument and acknowledged to me that they executed the same in their authorized capacity, and that by their signature on the instrument the person(s), or the entity upon behalf of which the person(s) acted, executed the instrument.
        </p>
        
        <div className="row">
          <div className="col-md-6">
            <FormField
              label="Date of Notarization"
              type="date"
              value={localFormData.notaryDate}
              onChange={handleFieldChange('notaryDate')}
              placeholder="[DATE]"
              disabled
            />
          </div>
          <div className="col-md-6">
            <FormField
              label="Notary's Name"
              value={localFormData.notaryName}
              onChange={handleFieldChange('notaryName')}
              placeholder="[NOTARY'S NAME]"
              disabled
            />
          </div>
        </div>
        
        <FormField
          label="Affiant's Name (as it appears to notary)"
          value={localFormData.affiantNameNotary}
          onChange={handleFieldChange('affiantNameNotary')}
          placeholder="[AFFIANT'S NAME]"
          disabled
        />
        
        <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          I certify under PENALTY OF PERJURY under the laws of the State of <span style={{ fontWeight: 'bold' }}>[STATE]</span> that the foregoing paragraph is true and correct.
        </p>
        
        <p style={{ marginBottom: '20px' }}>WITNESS my hand and official seal.</p>
        
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '30px' }}>
          <span>Signature</span>
          <input
            type="text"
            placeholder="____________________________"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '300px',
              backgroundColor: '#f8f8f8',
              color: '#666'
            }}
            disabled
          />
          
        </div>
        
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '10px',
          marginTop: '15px',
          fontSize: '12px',
          fontStyle: 'italic'
        }}>
          Note: This section will be completed by the notary public. Do not fill in these fields.
        </div>
      </div>

      {/* Legal Notice */}
      <div style={{
        backgroundColor: '#ffebee',
        border: '1px solid #ffcdd2',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '20px'
      }}>
        <h6 style={{ color: '#c62828', marginBottom: '8px', fontWeight: '600' }}>⚠️ Legal Notice:</h6>
        <p style={{ color: '#d32f2f', margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
          I understand that false statements on this Affidavit may be punishable by the fullest extent of the law. 
          Under penalty of perjury, I hereby declare and affirm that this Affidavit will be signed by me and all 
          its contents, to the best of my knowledge, are true and correct.
        </p>
      </div>
    </FormWrapper>
  );
};

export default AffidavitOfIdentityForm;
