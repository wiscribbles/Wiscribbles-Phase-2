'use client';
import React from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';
import useDocumentForm from '@/hooks/useDocumentForm';
import DocumentFormStatus from '../shared/DocumentFormStatus';

const LastWillTestamentForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const initialFormData = {
    // Testator Information
    testatorName: '',
    testatorCity: '',
    testatorCounty: '',
    testatorState: '',
    
    // Personal Representative (Primary)
    personalRepName: '',
    personalRepAddress: '',
    personalRepCounty: '',
    personalRepState: '',
    personalRepGender: '', // he/she
    
    // Personal Representative (Alternate)
    altPersonalRepName: '',
    altPersonalRepAddress: '',
    altPersonalRepCounty: '',
    altPersonalRepState: '',
    
    // Beneficiaries (up to 3)
    beneficiary1Name: '',
    beneficiary1Address: '',
    beneficiary1Relation: '',
    beneficiary1SSN: '',
    beneficiary1Property: '',
    
    beneficiary2Name: '',
    beneficiary2Address: '',
    beneficiary2Relation: '',
    beneficiary2SSN: '',
    beneficiary2Property: '',
    
    beneficiary3Name: '',
    beneficiary3Address: '',
    beneficiary3Relation: '',
    beneficiary3SSN: '',
    beneficiary3Property: '',
    
    // Governing Law
    governingState: '',
    
    // Signature Section
    testatorSignatureDate: '',
    testatorSignatureDateDay: '',
    testatorSignatureMonth: '',
    testatorSignatureYear: '',
    testatorPrintedName: '',
    
    // Witnesses
    witness1Signature: '',
    witness1Address: '',
    witness2Signature: '',
    witness2Address: '',
    
    // Witness Date (for attestation)
    witnessDate: '',
    witnessDateDay: '',
    witnessMonth: '',
    witnessYear: '',
    witnessTestatorName: '',
    
    // Testamentary Affidavit
    affidavitState: '',
    affidavitCounty: '',
    affidavitTestatorName: '',
    affidavitWitness1Name: '',
    affidavitWitness2Name: '',
    
    // Notary Information (disabled)
    notaryDate: '',
    notaryDateDay: '',
    notaryMonth: '',
    notaryYear: '',
    notarySignature: '',
    notaryCommissionExpires: '',
    
    ...formData
  };

  const requiredFields = [
    'testatorName', 'testatorCity', 'testatorCounty', 'testatorState',
    'personalRepName', 'personalRepAddress', 'personalRepCounty', 'personalRepState', 'personalRepGender',
    'governingState', 'testatorSignatureDate', 'testatorPrintedName',
    'witness1Signature', 'witness1Address', 'witness2Signature', 'witness2Address'
  ];

  // Custom validation function
  const customValidation = (formData) => {
    const errors = {};
    
    // At least one beneficiary must be filled
    const hasBeneficiary = formData.beneficiary1Name && formData.beneficiary1Address && 
                          formData.beneficiary1Relation && formData.beneficiary1Property;
    
    if (!hasBeneficiary) {
      errors.beneficiaries = 'At least one beneficiary must be completely filled out';
    }
    
    return errors;
  };

  const {
    formData: localFormData,
    isLoading,
    saveStatus,
    isValid,
    handleFieldChange,
    handleRadioChange
  } = useDocumentForm({
    documentType: 'last-will',
    initialFormData,
    requiredFields,
    customValidation,
    onFormDataChange
  });

  if (isLoading) {
    return (
      <FormWrapper
        title="Last Will and Testament"
        subtitle="Loading your saved data..."
        onProceed={() => false}
        isValid={false}
      >
        <DocumentFormStatus 
          isLoading={isLoading}
          loadingMessage="Loading your Last Will and Testament data..."
        />
      </FormWrapper>
    );
  }

  return (
    <FormWrapper 
      title="Last Will and Testament" 
      subtitle="Create a comprehensive will to distribute your assets and appoint representatives"
      onProceed={() => isValid && onProceed()} 
      isValid={isValid}
    >
      <DocumentFormStatus saveStatus={saveStatus} />
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Last Will and Testament</h3>
        <h4>of</h4>
        <div style={{ borderBottom: '2px solid #000', display: 'inline-block', minWidth: '300px', padding: '1px' }}>
          <input
            type="text"
            value={localFormData.testatorName}
            onChange={handleFieldChange('testatorName')}
            placeholder="Enter your full legal name"
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              textAlign: 'center',
              width: '100%',
              backgroundColor: 'transparent'
            }}
            required
          />
        </div>
      </div>

      {/* Opening Declaration */}
      <div style={{ marginBottom: '30px', lineHeight: '1.6' }}>
        <p style={{ marginBottom: '15px' }}>
          I, 
          <input
            type="text"
            value={localFormData.testatorName}
            onChange={handleFieldChange('testatorName')}
            placeholder="Your full legal name"
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              margin: '0 8px',
              padding: '2px 4px',
              fontSize: '14px',
              minWidth: '200px'
            }}
            required
          />
          , resident in the City of 
          <input
            type="text"
            value={localFormData.testatorCity}
            onChange={handleFieldChange('testatorCity')}
            placeholder="City"
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              margin: '0 8px',
              padding: '2px 4px',
              fontSize: '14px',
              minWidth: '120px'
            }}
            required
          />
          , County of 
          <input
            type="text"
            value={localFormData.testatorCounty}
            onChange={handleFieldChange('testatorCounty')}
            placeholder="County"
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              margin: '0 8px',
              padding: '2px 4px',
              fontSize: '14px',
              minWidth: '120px'
            }}
            required
          />
          , State of 
          <input
            type="text"
            value={localFormData.testatorState}
            onChange={handleFieldChange('testatorState')}
            placeholder="State"
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              margin: '0 8px',
              padding: '2px 4px',
              fontSize: '14px',
              minWidth: '120px'
            }}
            required
          />
          , being of sound mind, not acting under duress or undue influence, and fully understanding the nature and extent of all my property and of this disposition thereof, do hereby make, publish, and declare this document to be my Last Will and Testament, and hereby revoke any and all other wills and codicils heretofore made by me.
        </p>
      </div>

      {/* Section I: EXPENSES & TAXES */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>I. EXPENSES & TAXES</h5>
        <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
          I direct that all my debts, and expenses of my last illness, funeral, and burial, be paid as soon after my death as may be reasonably convenient, and I hereby authorize my Personal Representative, hereinafter appointed, to settle and discharge, in his or her absolute discretion, any claims made against my estate.
        </p>
        <p style={{ lineHeight: '1.6' }}>
          I further direct that my Personal Representative shall pay out of my estate any and all estate and inheritance taxes payable by reason of my death in respect of all items included in the computation of such taxes, whether passing under this Will or otherwise. Said taxes shall be paid by my Personal Representative as if such taxes were my debts without recovery of any part of such tax payments from anyone who receives any item included in such computation.
        </p>
      </div>

      {/* Section II: PERSONAL REPRESENTATIVE */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>II. PERSONAL REPRESENTATIVE</h5>
        
        <div style={{ marginBottom: '20px' }}>
          <h6 style={{ fontWeight: '500', marginBottom: '10px' }}>Primary Personal Representative</h6>
          <div style={{ marginBottom: '15px' }}>
            <p style={{ marginBottom: '10px' }}>
              I nominate and appoint 
              <input
                type="text"
                value={localFormData.personalRepName}
                onChange={handleFieldChange('personalRepName')}
                placeholder="Full name of personal representative"
                style={{
                  border: 'none',
                  borderBottom: '1px solid #ccc',
                  margin: '0 8px',
                  padding: '2px 4px',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
                required
              />
              , of 
              <input
                type="text"
                value={localFormData.personalRepAddress}
                onChange={handleFieldChange('personalRepAddress')}
                placeholder="Complete address"
                style={{
                  border: 'none',
                  borderBottom: '1px solid #ccc',
                  margin: '0 8px',
                  padding: '2px 4px',
                  fontSize: '14px',
                  minWidth: '250px'
                }}
                required
              />
              , County of 
              <input
                type="text"
                value={localFormData.personalRepCounty}
                onChange={handleFieldChange('personalRepCounty')}
                placeholder="County"
                style={{
                  border: 'none',
                  borderBottom: '1px solid #ccc',
                  margin: '0 8px',
                  padding: '2px 4px',
                  fontSize: '14px',
                  minWidth: '120px'
                }}
                required
              />
              , State of 
              <input
                type="text"
                value={localFormData.personalRepState}
                onChange={handleFieldChange('personalRepState')}
                placeholder="State"
                style={{
                  border: 'none',
                  borderBottom: '1px solid #ccc',
                  margin: '0 8px',
                  padding: '2px 4px',
                  fontSize: '14px',
                  minWidth: '120px'
                }}
                required
              />
               as Personal Representative of my estate and I request that (
              <select
                value={localFormData.personalRepGender}
                onChange={handleFieldChange('personalRepGender')}
                style={{
                  border: 'none',
                  borderBottom: '1px solid #ccc',
                  margin: '0 4px',
                  padding: '2px',
                  fontSize: '14px'
                }}
                required
              >
                <option value="">Select</option>
                <option value="he">he</option>
                <option value="she">she</option>
              </select>
              ) be appointed temporary Personal Representative if (
              {localFormData.personalRepGender === 'he' ? 'he' : localFormData.personalRepGender === 'she' ? 'she' : 'he/she'}
              ) applies.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h6 style={{ fontWeight: '500', marginBottom: '10px' }}>Alternate Personal Representative</h6>
          <div style={{ marginBottom: '15px' }}>
            <p style={{ marginBottom: '10px' }}>
              If my Personal Representative fails or ceases to so serve, then I nominate 
              <input
                type="text"
                value={localFormData.altPersonalRepName}
                onChange={handleFieldChange('altPersonalRepName')}
                placeholder="Full name of alternate representative"
                style={{
                  border: 'none',
                  borderBottom: '1px solid #ccc',
                  margin: '0 8px',
                  padding: '2px 4px',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
              />
               of 
              <input
                type="text"
                value={localFormData.altPersonalRepAddress}
                onChange={handleFieldChange('altPersonalRepAddress')}
                placeholder="Complete address"
                style={{
                  border: 'none',
                  borderBottom: '1px solid #ccc',
                  margin: '0 8px',
                  padding: '2px 4px',
                  fontSize: '14px',
                  minWidth: '250px'
                }}
              />
              , County of 
              <input
                type="text"
                value={localFormData.altPersonalRepCounty}
                onChange={handleFieldChange('altPersonalRepCounty')}
                placeholder="County"
                style={{
                  border: 'none',
                  borderBottom: '1px solid #ccc',
                  margin: '0 8px',
                  padding: '2px 4px',
                  fontSize: '14px',
                  minWidth: '120px'
                }}
              />
              , State of 
              <input
                type="text"
                value={localFormData.altPersonalRepState}
                onChange={handleFieldChange('altPersonalRepState')}
                placeholder="State"
                style={{
                  border: 'none',
                  borderBottom: '1px solid #ccc',
                  margin: '0 8px',
                  padding: '2px 4px',
                  fontSize: '14px',
                  minWidth: '120px'
                }}
              />
               to serve.
            </p>
          </div>
        </div>
      </div>

      {/* Section III: DISPOSITION OF PROPERTY */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>III. DISPOSITION OF PROPERTY</h5>
        <p style={{ marginBottom: '20px' }}>I devise and bequeath my property, both real and personal and wherever situated, as follows:</p>
        
        {/* Beneficiary 1 */}
        <div style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <h6 style={{ fontWeight: '500', marginBottom: '15px' }}>1st Beneficiary</h6>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Full Name:</label>
            <input
              type="text"
              value={localFormData.beneficiary1Name}
              onChange={handleFieldChange('beneficiary1Name')}
              placeholder="Beneficiary's full legal name"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                width: '100%'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Current Address:</label>
            <input
              type="text"
              value={localFormData.beneficiary1Address}
              onChange={handleFieldChange('beneficiary1Address')}
              placeholder="Complete current address"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                width: '100%'
              }}
              required
            />
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Relationship:</label>
                <input
                  type="text"
                  value={localFormData.beneficiary1Relation}
                  onChange={handleFieldChange('beneficiary1Relation')}
                  placeholder="e.g., son, daughter, spouse, friend"
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '14px',
                    width: '100%'
                  }}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last 4 digits of SSN:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>xxx-xx-</span>
                  <input
                    type="text"
                    value={localFormData.beneficiary1SSN}
                    onChange={handleFieldChange('beneficiary1SSN')}
                    placeholder="1234"
                    maxLength="4"
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '14px',
                      width: '80px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Property/Assets to Receive:</label>
            <textarea
              value={localFormData.beneficiary1Property}
              onChange={handleFieldChange('beneficiary1Property')}
              placeholder="Describe the specific property, assets, or percentage of estate"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                width: '100%',
                minHeight: '60px',
                resize: 'vertical'
              }}
              required
            />
          </div>
        </div>

        {/* Beneficiary 2 */}
        <div style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <h6 style={{ fontWeight: '500', marginBottom: '15px' }}>2nd Beneficiary (Optional)</h6>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Full Name:</label>
            <input
              type="text"
              value={localFormData.beneficiary2Name}
              onChange={handleFieldChange('beneficiary2Name')}
              placeholder="Beneficiary's full legal name"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                width: '100%'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Current Address:</label>
            <input
              type="text"
              value={localFormData.beneficiary2Address}
              onChange={handleFieldChange('beneficiary2Address')}
              placeholder="Complete current address"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                width: '100%'
              }}
            />
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Relationship:</label>
                <input
                  type="text"
                  value={localFormData.beneficiary2Relation}
                  onChange={handleFieldChange('beneficiary2Relation')}
                  placeholder="e.g., son, daughter, spouse, friend"
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '14px',
                    width: '100%'
                  }}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last 4 digits of SSN:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>xxx-xx-</span>
                  <input
                    type="text"
                    value={localFormData.beneficiary2SSN}
                    onChange={handleFieldChange('beneficiary2SSN')}
                    placeholder="1234"
                    maxLength="4"
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '14px',
                      width: '80px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Property/Assets to Receive:</label>
            <textarea
              value={localFormData.beneficiary2Property}
              onChange={handleFieldChange('beneficiary2Property')}
              placeholder="Describe the specific property, assets, or percentage of estate"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                width: '100%',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Beneficiary 3 */}
        <div style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '15px', 
          marginBottom: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <h6 style={{ fontWeight: '500', marginBottom: '15px' }}>3rd Beneficiary (Optional)</h6>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Full Name:</label>
            <input
              type="text"
              value={localFormData.beneficiary3Name}
              onChange={handleFieldChange('beneficiary3Name')}
              placeholder="Beneficiary's full legal name"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                width: '100%'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Current Address:</label>
            <input
              type="text"
              value={localFormData.beneficiary3Address}
              onChange={handleFieldChange('beneficiary3Address')}
              placeholder="Complete current address"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                width: '100%'
              }}
            />
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Relationship:</label>
                <input
                  type="text"
                  value={localFormData.beneficiary3Relation}
                  onChange={handleFieldChange('beneficiary3Relation')}
                  placeholder="e.g., son, daughter, spouse, friend"
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '14px',
                    width: '100%'
                  }}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last 4 digits of SSN:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>xxx-xx-</span>
                  <input
                    type="text"
                    value={localFormData.beneficiary3SSN}
                    onChange={handleFieldChange('beneficiary3SSN')}
                    placeholder="1234"
                    maxLength="4"
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '14px',
                      width: '80px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Property/Assets to Receive:</label>
            <textarea
              value={localFormData.beneficiary3Property}
              onChange={handleFieldChange('beneficiary3Property')}
              placeholder="Describe the specific property, assets, or percentage of estate"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                width: '100%',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '15px',
          marginTop: '20px'
        }}>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
            <strong>Contingency Provisions:</strong> If any of my beneficiaries have pre-deceased me, then any property that they would have received if they had not pre-deceased me shall be distributed in equal shares to the remaining beneficiaries.
          </p>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', lineHeight: '1.4' }}>
            If any of my property cannot be readily sold and distributed, then it may be donated to any charitable organization or organizations of my Personal Representative's choice. If any property cannot be readily sold or donated, my Personal Representative may, without liability, dispose of such property as my Personal Representative may deem appropriate.
          </p>
        </div>
      </div>

      {/* Remaining Sections */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>IV. OMISSION</h5>
        <p style={{ lineHeight: '1.6' }}>
          Except to the extent that I have included them in this Will, I have intentionally, and not as a result of any mistake or inadvertence, omitted in this Will to provide for any family members and/or issue of mine, if any, however defined by law, presently living or hereafter born or adopted.
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>V. BOND</h5>
        <p style={{ lineHeight: '1.6' }}>
          No bond shall be required of any fiduciary serving hereunder, whether or not specifically named in this Will, or if a bond is required by law, then no surety will be required on such bond.
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>VI. DISCRETIONARY POWERS OF PERSONAL REPRESENTATIVE</h5>
        <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
          My Personal Representative, shall have and may exercise the following discretionary powers in addition to any common law or statutory powers without the necessity of court license or approval:
        </p>
        <div style={{ marginLeft: '20px', fontSize: '14px', lineHeight: '1.5' }}>
          <p><strong>A.</strong> To retain for whatever period my Personal Representative deems advisable any property, including property owned by me at my death, and to invest and reinvest in any property, both real and personal, regardless of whether any particular investment would be proper for a Personal Representative and regardless of the extent of diversification of the assets held hereunder.</p>
          <p><strong>B.</strong> To sell and to grant options to purchase all or any part of my estate, both real and personal, at any time, at public or private sale, for consideration, whether or not the highest possible consideration, and upon terms, including credit, as my Personal Representative deems advisable.</p>
          <p><strong>C.</strong> To lease any real estate for terms and conditions as my Personal Representative deems advisable, including the granting of options to renew, options to extend the term or terms, and options to purchase.</p>
          <p><strong>D.</strong> To pay, compromise, settle or otherwise adjust any claims, including taxes, asserted in favor of or against me, my estate or my Personal Representative.</p>
          <p><strong>E.</strong> To make any separation into shares in whole or in part in kind and at values determined by my Personal Representative, with or without regard to tax basis.</p>
          <p><strong>F.</strong> To make such elections under the tax laws as my Personal Representative shall deem appropriate.</p>
          <p><strong>G.</strong> To make any elections permitted under any pension, profit sharing, employee stock ownership or other benefit plan.</p>
          <p><strong>H.</strong> To employ others in connection with the administration of my estate, including legal counsel, investment advisors, brokers, accountants and agents.</p>
          <p><strong>I.</strong> To vote any shares of stock or other securities in person or by proxy; to assert or waive any stockholder's rights.</p>
          <p><strong>J.</strong> To borrow and to pledge or mortgage any property as collateral, and to make secured or unsecured loans.</p>
          <p><strong>K.</strong> My Personal Representative shall also in his or her absolute discretion determine the allocation of any GST exemption available to me at my death.</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>VII. CONTESTING BENEFICIARY</h5>
        <p style={{ lineHeight: '1.6' }}>
          If any beneficiary under this Will, or any trust herein mentioned, contests or attacks this Will or any of its provisions, any share or interest in my estate given to that contesting beneficiary under this Will is revoked and shall be disposed of in the same manner provided herein as if that contesting beneficiary had predeceased me.
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>VIII. GUARDIAN AD LITEM NOT REQUIRED</h5>
        <p style={{ lineHeight: '1.6' }}>
          I direct that the representation by a guardian ad litem of the interests of persons unborn, unascertained or legally incompetent to act in proceedings for the allowance of accounts hereunder be dispensed with to the extent permitted by law.
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>IX. GENDER</h5>
        <p style={{ lineHeight: '1.6' }}>
          Whenever the context permits, the term "Personal Representative" shall include "Executor" and "Administrator," the use of a particular gender shall include any other gender, and references to the singular or the plural shall be interchangeable. All references to the Internal Revenue Code shall mean the Internal Revenue Code of 1986 or any successor Code.
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>X. ASSIGNMENT</h5>
        <p style={{ lineHeight: '1.6' }}>
          The interest of any beneficiary in this Will, shall not be alienable, assignable, attachable, transferable nor paid by way of anticipation, nor in compliance with any order, assignment or covenant and shall not be applied to, or held liable for, any of their debts or obligations either in law or equity.
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>XI. GOVERNING LAW</h5>
        <p style={{ marginBottom: '10px' }}>
          This document shall be governed by the laws of the State of 
          <input
            type="text"
            value={localFormData.governingState}
            onChange={handleFieldChange('governingState')}
            placeholder="State name"
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              marginTop: ' 8px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '120px'
            }}
            required
          />
          
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '15px' }}>XII. BINDING ARRANGEMENT</h5>
        <p style={{ lineHeight: '1.6' }}>
          Any decision by my Personal Representative with respect to any discretionary power hereunder shall be final and binding on all persons interested. Unless due to my Executor's own willful default or gross negligence, no Executor shall be liable for said Executor's acts or omissions or those of any co Executor or prior Executor.
        </p>
      </div>

      {/* Testator Signature Section */}
      <div style={{ marginBottom: '30px'}}>
        <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
          I, the undersigned 
          <input
            type="text"
            value={localFormData.testatorPrintedName}
            onChange={handleFieldChange('testatorPrintedName')}
            placeholder="Your full legal name"
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              marginTop: ' 8px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '200px'
            }}
            required
          />
          , do hereby declare that I sign and execute this instrument as my last Will, that I sign it willingly in the presence of each of the undersigned witnesses, and that I execute it as my free and voluntary act for the purposes herein expressed, on this 
          <span style={{ whiteSpace: 'nowrap' }}>
            <input
              type="number"
              value={localFormData.testatorSignatureDateDay}
              onChange={handleFieldChange('testatorSignatureDateDay')}
              placeholder="day"
              min="1"
              max="31"
              style={{
                border: 'none',
                borderBottom: '1px solid #ccc',
                margin: '0 2px',
                padding: '2px 4px',
                fontSize: '14px',
                width: '45px'
              }}
            />
             day of 
            <input
              type="text"
              value={localFormData.testatorSignatureMonth}
              onChange={handleFieldChange('testatorSignatureMonth')}
              placeholder="month"
              style={{
                border: 'none',
                borderBottom: '1px solid #ccc',
                margin: '0 2px',
                padding: '2px 4px',
                fontSize: '14px',
                width: '70px'
              }}
            />
            , 20
            <input
              type="text"
              value={localFormData.testatorSignatureYear}
              onChange={handleFieldChange('testatorSignatureYear')}
              placeholder="YY"
              maxLength="2"
              style={{
                border: 'none',
                borderBottom: '1px solid #ccc',
                margin: '0 2px',
                padding: '2px 4px',
                fontSize: '14px',
                width: '30px'
              }}
            />
          </span>
          .
        </p>

        <div className="row" style={{ marginTop: '10px' }}>
          <div className="col-md-6">
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '40px', display: 'flex', alignItems: 'flex-end' }}>
              <input
                type="text"
                value={localFormData.testatorSignatureDate}
                onChange={handleFieldChange('testatorSignatureDate')}
                placeholder="Type your full legal name as signature"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  width: '100%',
                  backgroundColor: 'transparent',
                  paddingBottom: '5px'
                }}
                required
              />
            </div>
            <p style={{ fontSize: '12px', textAlign: 'center', margin: 0 }}>Testator Signature</p>
          </div>
          <div className="col-md-6">
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '40px', display: 'flex', alignItems: 'flex-end' }}>
              <input
                type="text"
                value={localFormData.testatorPrintedName}
                readOnly
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  width: '100%',
                  backgroundColor: 'transparent',
                  paddingBottom: '5px'
                }}
              />
            </div>
            <p style={{ fontSize: '12px', textAlign: 'center', margin: 0 }}>Testator (Printed Name)</p>
          </div>
        </div>
      </div>

      {/* Witnesses Section */}
      <div style={{ marginBottom: '30px' }}>
        <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
          The foregoing instrument, was on this 
          <span style={{ whiteSpace: 'nowrap' }}>
            <input
              type="number"
              value={localFormData.witnessDateDay}
              onChange={handleFieldChange('witnessDateDay')}
              placeholder="day"
              min="1"
              max="31"
              style={{
                border: 'none',
                borderBottom: '1px solid #ccc',
                margin: '0 2px',
                padding: '2px 4px',
                fontSize: '14px',
                width: '45px'
              }}
            />
             day of 
            <input
              type="text"
              value={localFormData.witnessMonth}
              onChange={handleFieldChange('witnessMonth')}
              placeholder="month"
              style={{
                border: 'none',
                borderBottom: '1px solid #ccc',
                margin: '0 2px',
                padding: '2px 4px',
                fontSize: '14px',
                width: '70px'
              }}
            />
            , 20
            <input
              type="text"
              value={localFormData.witnessYear}
              onChange={handleFieldChange('witnessYear')}
              placeholder="YY"
              maxLength="2"
              style={{
                border: 'none',
                borderBottom: '1px solid #ccc',
                margin: '0 2px',
                padding: '2px 4px',
                fontSize: '14px',
                width: '30px'
              }}
            />
          </span>
          , subscribed on each page and at the end thereof by 
          <input
            type="text"
            value={localFormData.witnessTestatorName}
            onChange={handleFieldChange('witnessTestatorName')}
            placeholder="Testator's name"
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              marginTop: '6 px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          />
          , the above-named Testator, and by (him/her) signed, sealed, published and declared to be (his/her) LAST WILL AND TESTAMENT, in the presence of us and each of us, who thereupon, at (his/her) request, in (his/her) presence, and in the presence of each other, have hereunto subscribed our names as attesting witnesses thereto.
        </p>

        <div className="row" style={{ marginTop: '10px' }}>
          <div className="col-md-6">
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '40px', display: 'flex', alignItems: 'flex-end' }}>
              <input
                type="text"
                value={localFormData.witness1Signature}
                onChange={handleFieldChange('witness1Signature')}
                placeholder="Witness 1 signature"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  width: '100%',
                  backgroundColor: 'transparent',
                  paddingBottom: '5px'
                }}
                required
              />
            </div>
            <p style={{ fontSize: '12px', textAlign: 'center', margin: 0 }}>Witness Signature</p>
          </div>
          <div className="col-md-6">
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '40px', display: 'flex', alignItems: 'flex-end' }}>
              <input
                type="text"
                value={localFormData.witness1Address}
                onChange={handleFieldChange('witness1Address')}
                placeholder="Witness 1 address"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  width: '100%',
                  backgroundColor: 'transparent',
                  paddingBottom: '5px'
                }}
                required
              />
            </div>
            <p style={{ fontSize: '12px', textAlign: 'center', margin: 0 }}>Address</p>
          </div>
        </div>

        <div className="row" style={{ marginTop: '30px' }}>
          <div className="col-md-6">
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '40px', display: 'flex', alignItems: 'flex-end' }}>
              <input
                type="text"
                value={localFormData.witness2Signature}
                onChange={handleFieldChange('witness2Signature')}
                placeholder="Witness 2 signature"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  width: '100%',
                  backgroundColor: 'transparent',
                  paddingBottom: '5px'
                }}
                required
              />
            </div>
            <p style={{ fontSize: '12px', textAlign: 'center', margin: 0 }}>Witness Signature</p>
          </div>
          <div className="col-md-6">
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '40px', display: 'flex', alignItems: 'flex-end' }}>
              <input
                type="text"
                value={localFormData.witness2Address}
                onChange={handleFieldChange('witness2Address')}
                placeholder="Witness 2 address"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  width: '100%',
                  backgroundColor: 'transparent',
                  paddingBottom: '5px'
                }}
                required
              />
            </div>
            <p style={{ fontSize: '12px', textAlign: 'center', margin: 0 }}>Address</p>
          </div>
        </div>
      </div>

      {/* Testamentary Affidavit - Disabled */}
      <div style={{
        backgroundColor: '#f5f5f5',
        border: '2px solid #ccc',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '30px',
        opacity: '0.7'
      }}>
        <h4 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>TESTAMENTARY AFFIDAVIT</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <span>STATE OF </span>
          <input
            type="text"
            value={localFormData.affidavitState}
            onChange={handleFieldChange('affidavitState')}
            placeholder="[STATE]"
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '120px',
              backgroundColor: '#f8f8f8',
              color: '#666'
            }}
            disabled
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <span>COUNTY OF </span>
          <input
            type="text"
            value={localFormData.affidavitCounty}
            onChange={handleFieldChange('affidavitCounty')}
            placeholder="[COUNTY]"
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '120px',
              backgroundColor: '#f8f8f8',
              color: '#666'
            }}
            disabled
          />
          <span>, SS.</span>
        </div>
        
        <p style={{ lineHeight: '1.6', marginBottom: '20px', fontSize: '14px' }}>
          Before me, the undersigned authority, on this day personally appeared 
          <input
            type="text"
            value={localFormData.affidavitTestatorName}
            onChange={handleFieldChange('affidavitTestatorName')}
            placeholder="[TESTATOR NAME]"
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              margin: '0 4px',
              padding: '2px 4px',
              fontSize: '14px',
              minWidth: '150px',
              backgroundColor: 'transparent',
              color: '#666'
            }}
            disabled
          />
          , testator, 
          <input
            type="text"
            value={localFormData.affidavitWitness1Name}
            onChange={handleFieldChange('affidavitWitness1Name')}
            placeholder="[WITNESS 1]"
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              margin: '0 4px',
              padding: '2px 4px',
              fontSize: '14px',
              minWidth: '120px',
              backgroundColor: 'transparent',
              color: '#666'
            }}
            disabled
          />
          , witness and 
          <input
            type="text"
            value={localFormData.affidavitWitness2Name}
            onChange={handleFieldChange('affidavitWitness2Name')}
            placeholder="[WITNESS 2]"
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              margin: '0 4px',
              padding: '2px 4px',
              fontSize: '14px',
              minWidth: '120px',
              backgroundColor: 'transparent',
              color: '#666'
            }}
            disabled
          />
          , witness, known to me to be the testator and the witnesses, respectively, whose names are signed to the attached or foregoing instrument, and, all of these persons being by me duly sworn, the testator declared to me and to the witnesses in my presence that the instrument is the testator's last will and that the testator has willingly signed or directed another to sign for him/her, and that the testator executed it as the testator's free and voluntary act for the purposes therein expressed; and each of the witnesses stated to me, in the presence of the testator, that they signed the will as witnesses and that to the best of their knowledge the testator was eighteen (18) years of age or over, of sound mind and under no constraint or undue influence.
        </p>

        <div className="row" style={{ marginBottom: '30px' }}>
          <div className="col-md-4">
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '30px' }}>
              <input
                type="text"
                placeholder="[TESTATOR SIGNATURE]"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  width: '250px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  marginLeft:'-5px'
                }}
                disabled
              />
            </div>
            <p style={{ fontSize: '12px', textAlign: 'center', margin: 0 }}>Testator Signature</p>
          </div>
          <div className="col-md-4">
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '30px' }}>
              <input
                type="text"
                placeholder="[WITNESS 1 SIGNATURE]"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  width: '250px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  marginLeft:'-10px'
                  
                }}
                disabled
              />
            </div>
            <p style={{ fontSize: '12px', textAlign: 'center', margin: 0 }}>Witness Signature</p>
          </div>
          <div className="col-md-4">
            <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '30px' }}>
              <input
                type="text"
                placeholder="[WITNESS 2 SIGNATURE]"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  width: '250px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  marginLeft:'-10px'
                
                }}
                disabled
              />
            </div>
            <p style={{ fontSize: '12px', textAlign: 'center', margin: 0 }}>Witness Signature</p>
          </div>
        </div>

        <p style={{ marginBottom: '20px', fontSize: '14px' }}>
          Subscribed and sworn to before me by the said testator and the said witnesses, this 
          <span style={{ whiteSpace: 'nowrap' }}>
            <input
              type="text"
              value={localFormData.notaryDateDay}
              onChange={handleFieldChange('notaryDateDay')}
              placeholder="[DAY]"
              style={{
                border: 'none',
                borderBottom: '1px solid #ccc',
                margin: '0 2px',
                padding: '2px 4px',
                fontSize: '14px',
                width: '35px',
                backgroundColor: 'transparent',
                color: '#666'
              }}
              disabled
            />
             day of 
            <input
              type="text"
              value={localFormData.notaryMonth}
              onChange={handleFieldChange('notaryMonth')}
              placeholder="[MONTH]"
              style={{
                border: 'none',
                borderBottom: '1px solid #ccc',
                margin: '0 2px',
                padding: '2px 4px',
                fontSize: '14px',
                width: '70px',
                backgroundColor: 'transparent',
                color: '#666'
              }}
              disabled
            />
            , 20
            <input
              type="text"
              value={localFormData.notaryYear}
              onChange={handleFieldChange('notaryYear')}
              placeholder="[YY]"
              maxLength="2"
              style={{
                border: 'none',
                borderBottom: '1px solid #ccc',
                margin: '0 2px',
                padding: '2px 4px',
                fontSize: '14px',
                width: '30px',
                backgroundColor: 'transparent',
                color: '#666'
              }}
              disabled
            />
          </span>
          .
        </p>

        <div style={{ marginTop: '30px' }}>
          <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '40px', maxWidth: '300px' }}>
            <input
              type="text"
              value={localFormData.notarySignature}
              onChange={handleFieldChange('notarySignature')}
              placeholder="[NOTARY SIGNATURE]"
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                width: '100%',
                backgroundColor: 'transparent',
                color: '#666'
              }}
              disabled
            />
          </div>
          <p style={{ fontSize: '14px', margin: 0 }}>Notary Public</p>
          <p style={{ fontSize: '14px', margin: 0, marginTop:'10px'}}>
            My Commission expires: 
            <input
              type="date"
              value={localFormData.notaryCommissionExpires}
              onChange={handleFieldChange('notaryCommissionExpires')}
              placeholder="[DATE]"
              style={{
                border: 'none',
                borderBottom: '1px solid #ccc',
                margin: '0 4px',
                padding: '2px 4px',
                fontSize: '14px',
                minWidth: '80px',
                backgroundColor: 'transparent',
                color: '#666'
              }}
              disabled
            />
          </p>
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
          This Last Will and Testament is a legally binding document that affects the distribution of your estate. 
          It is strongly recommended to consult with an attorney before finalizing this document. Ensure all information 
          is accurate and that the document is properly witnessed and notarized according to your state's laws.
        </p>
      </div>
    </FormWrapper>
  );
};

export default LastWillTestamentForm;
