'use client';
import React, { useState, useEffect } from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';

const LimitedSpecialPowerOfAttorneyForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const [localFormData, setLocalFormData] = useState({
    // Principal Information
    principalName: '',
    principalSSN: '',
    
    // Attorney-in-Fact Information
    attorneyName: '',
    attorneyAddress: '',
    attorneyPhone: '',
    
    // Specific Powers (3 numbered items)
    power1: '',
    power2: '',
    power3: '',
    
    // Revocation Options
    revocationOption1: false,
    revocationOption1Initials: '',
    revocationOption2: false,
    revocationOption2Initials: '',
    revocationOption3: false,
    revocationOption3Initials: '',
    revocationDate: '',
    revocationMonth: '',
    revocationYear: '',
    
    // State Law
    governingState: '',
    
    // Execution Date
    executionDay: '',
    executionMonth: '',
    executionYear: '',
    
    // Principal Signature
    principalSignature: '',
    principalPrintedName: '',
    
    // Attorney-in-Fact Acceptance
    attorneyAcceptanceName: '',
    attorneySignature: '',
    attorneyPrintedName: '',
    
    // Witnesses
    witness1Signature: '',
    witness1PrintedName: '',
    witness1Address: '',
    witness1CityStateZip: '',
    witness2Signature: '',
    witness2PrintedName: '',
    witness2Address: '',
    witness2CityStateZip: '',
    
    // Notary (stored but not editable by user)
    notaryState: '',
    notaryCounty: '',
    notaryDay: '',
    notaryMonth: '',
    notaryYear: '',
    notaryPrincipalName: '',
    notarySignature: '',
    notaryCommissionExpires: '',
    
    ...formData
  });
  
  const [isValid, setIsValid] = useState(false);

  useEffect(() => { 
    onFormDataChange(localFormData); 
  }, [localFormData, onFormDataChange]);
  
  useEffect(() => {
    const requiredFields = [
      'principalName', 'principalSSN', 'attorneyName', 'attorneyAddress', 'attorneyPhone',
      'power1', 'governingState', 'executionDay', 'executionMonth', 'executionYear'
    ];
    
    let valid = requiredFields.every(field => localFormData[field]);
    
    // At least one revocation option must be selected
    const revocationSelected = localFormData.revocationOption1 || 
                              localFormData.revocationOption2 || 
                              localFormData.revocationOption3;
    
    if (!revocationSelected) valid = false;
    
    // If option 3 (specific date) is selected, date fields are required
    if (localFormData.revocationOption3) {
      if (!localFormData.revocationDate || !localFormData.revocationMonth || !localFormData.revocationYear) {
        valid = false;
      }
    }
    
    setIsValid(valid);
  }, [localFormData]);

  const handleFieldChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setLocalFormData(prev => ({ ...prev, [field]: value }));
  };

  const inlineInputStyle = {
    display: 'inline-block',
    width: 'auto',
    minWidth: '80px',
    padding: '4px 8px',
    margin: '0 4px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px'
  };
  
  const checkboxStyle = {
    marginRight: '8px',
    transform: 'scale(1.2)',
    marginTop: '10px'
  };
  
  const sectionStyle = {
    marginBottom: '30px',
    padding: '15px',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa'
  };
  
  const sectionTitleStyle = {
    fontWeight: 'bold',
    fontSize: '18px',
    marginBottom: '15px',
    color: '#2d3748',
    textAlign: 'center',
    textTransform: 'uppercase'
  };

  return (
    <FormWrapper title="Limited (Special) Power of Attorney" onProceed={() => isValid && onProceed()} isValid={isValid}>
      


      {/* Opening Section */}
      <div style={sectionStyle}>
        <div style={{ lineHeight: '1.8', marginBottom: '20px' }}>
          BE IT ACKNOWLEDGED that I,{' '}
          <input
            type="text"
            value={localFormData.principalName}
            onChange={handleFieldChange('principalName')}
            style={{ ...inlineInputStyle, width: '200px' }}
            placeholder="Principal's Full Name"
            required
          />, the "Principal", with the Social Security Number (SSN) of{' '}
          <input
            type="text"
            value={localFormData.principalSSN}
            onChange={handleFieldChange('principalSSN')}
            style={{ ...inlineInputStyle, width: '150px' }}
            placeholder="XXX-XX-XXXX"
            required
          />, do hereby grant a limited and specific power of attorney to{' '}
          <input
            type="text"
            value={localFormData.attorneyName}
            onChange={handleFieldChange('attorneyName')}
            style={{ ...inlineInputStyle, width: '200px' }}
            placeholder="Attorney-in-Fact Name"
            required
          />, my "Attorney-in-Fact", with the mailing address of{' '}
          <input
            type="text"
            value={localFormData.attorneyAddress}
            onChange={handleFieldChange('attorneyAddress')}
            style={{ ...inlineInputStyle, width: '300px' }}
            placeholder="Mailing Address"
            required
          />, and the phone number{' '}
          <input
            type="tel"
            value={localFormData.attorneyPhone}
            onChange={handleFieldChange('attorneyPhone')}
            style={{ ...inlineInputStyle, width: '150px' }}
            placeholder="Phone Number"
            required
          />.
        </div>
      </div>

      {/* Powers Section */}
      <div style={sectionStyle}>
        <div style={{ lineHeight: '1.6', marginBottom: '20px',  }} className='font-italic'>
          <strong>Said Attorney-in-Fact shall have full power and authority to undertake and perform only the following acts on my behalf:</strong>
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <strong>I.</strong>{' '}
            <input
              type="text"
              value={localFormData.power1}
              onChange={handleFieldChange('power1')}
              style={{ ...inlineInputStyle, width: '500px' }}
              placeholder="Describe the first specific power or authority"
              required
            />
          </div>
          
          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <strong>II.</strong>{' '}
            <input
              type="text"
              value={localFormData.power2}
              onChange={handleFieldChange('power2')}
              style={{ ...inlineInputStyle, width: '500px' }}
              placeholder="Describe the second specific power or authority (optional)"
            />
          </div>
          
          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <strong>III.</strong>{' '}
            <input
              type="text"
              value={localFormData.power3}
              onChange={handleFieldChange('power3')}
              style={{ ...inlineInputStyle, width: '500px' }}
              placeholder="Describe the third specific power or authority (optional)"
            />
          </div>
        </div>
        
        <div style={{ lineHeight: '1.6', marginTop: '20px' }}>
          The authority herein shall include such incidental acts as are reasonably required to carry out and perform the specific authorities granted herein. My Attorney-in-Fact agrees to accept this appointment subject to its terms and agrees to act and perform in said fiduciary capacity consistent with my best interest, as my Attorney-in-Fact in its discretion deems advisable. This power of attorney is effective upon execution.
        </div>
      </div>

      {/* Revocation Section */}
      <div style={sectionStyle}>
        <div style={{ lineHeight: '1.6', marginBottom: '20px' }}>
          <strong>This power of attorney may be revoked by any of the following:</strong>
        </div>
        <div style={{ marginBottom: '15px', fontStyle: 'italic' }}>
          Initial and Check the Box if Applicable:
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="text"
                value={localFormData.revocationOption1Initials}
                onChange={handleFieldChange('revocationOption1Initials')}
                style={{ width: '40px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                placeholder="__"
                maxLength="3"
              />
              <input
                type="checkbox"
                checked={localFormData.revocationOption1}
                onChange={handleFieldChange('revocationOption1')}
                style={checkboxStyle}
              />
              <div>
                <strong>- When the above stated one (1) time power or responsibility has been completed.</strong>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="text"
                value={localFormData.revocationOption2Initials}
                onChange={handleFieldChange('revocationOption2Initials')}
                style={{ width: '40px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                placeholder="__"
                maxLength="3"
              />
              <input
                type="checkbox"
                checked={localFormData.revocationOption2}
                onChange={handleFieldChange('revocationOption2')}
                style={checkboxStyle}
              />
              <div>
                <strong>- By the Principal at any time by authorizing a Revocation.</strong>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="text"
                value={localFormData.revocationOption3Initials}
                onChange={handleFieldChange('revocationOption3Initials')}
                style={{ width: '40px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                placeholder="__"
                maxLength="3"
              />
              <input
                type="checkbox"
                checked={localFormData.revocationOption3}
                onChange={handleFieldChange('revocationOption3')}
                style={checkboxStyle}
              />
              <div>
                <strong>- On the{' '}
                  <input
                    type="number"
                    value={localFormData.revocationDate}
                    onChange={handleFieldChange('revocationDate')}
                    style={{ ...inlineInputStyle, width: '50px' }}
                    min="1"
                    max="31"
                    placeholder="Day"
                  /> day of{' '}
                  <input
                    type="text"
                    value={localFormData.revocationMonth}
                    onChange={handleFieldChange('revocationMonth')}
                    style={{ ...inlineInputStyle, width: '120px' }}
                    placeholder="Month"
                  />, 20
                  <input
                    type="number"
                    value={localFormData.revocationYear}
                    onChange={handleFieldChange('revocationYear')}
                    style={{ ...inlineInputStyle, width: '60px' }}
                    min="20"
                    max="99"
                    placeholder="YY"
                  />.
                </strong>
              </div>
            </label>
          </div>
        </div>
        
        <div style={{ lineHeight: '1.6', marginTop: '20px' }}>
          This power of attorney form shall automatically be revoked upon my death or incapacitation, provided any person relying on this power of attorney shall have full rights to accept and reply upon the authority of my Attorney-in-Fact until in receipt of actual notice of revocation.
        </div>
      </div>

      {/* Execution Section */}
      <div style={sectionStyle}>
      <div style={{ lineHeight: '1.8' }}>
          <strong>State Law.</strong> This Power of Attorney is governed by the laws of the State of{' '}
          <input
            type="text"
            value={localFormData.governingState}
            onChange={handleFieldChange('governingState')}
            style={{ ...inlineInputStyle, width: '150px' }}
            placeholder="State Name"
            required
          />.
        </div>
        <div style={{ lineHeight: '1.8', marginBottom: '40px' }}>
          Signed this{' '}
          <input
            type="number"
            value={localFormData.executionDay}
            onChange={handleFieldChange('executionDay')}
            style={{ ...inlineInputStyle, width: '50px' }}
            min="1"
            max="31"
            placeholder="Day"
            required
          /> day of{' '}
          <input
            type="text"
            value={localFormData.executionMonth}
            onChange={handleFieldChange('executionMonth')}
            style={{ ...inlineInputStyle, width: '120px' }}
            placeholder="Month"
            required
          />, 20
          <input
            type="number"
            value={localFormData.executionYear}
            onChange={handleFieldChange('executionYear')}
            style={{ ...inlineInputStyle, width: '60px' }}
            min="20"
            max="99"
            placeholder="YY"
            required
          />.
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', textAlign: 'center' }}>
          <div>
            <input
              type="text"
              value={localFormData.principalSignature}
              onChange={handleFieldChange('principalSignature')}
              placeholder="Principal's Signature"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '2px solid #2d3748',
                backgroundColor: 'transparent',
                fontSize: '16px',
                textAlign: 'center',
                marginBottom: '10px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666' }}>Signature</div>
          </div>
          
          <div>
            <input
              type="text"
              value={localFormData.principalPrintedName}
              onChange={handleFieldChange('principalPrintedName')}
              placeholder="Principal's Printed Name"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '2px solid #2d3748',
                backgroundColor: 'transparent',
                fontSize: '16px',
                textAlign: 'center',
                marginBottom: '10px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666' }}>Printed Name</div>
          </div>
        </div>
      </div>

      {/* Attorney-in-Fact Acceptance Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>ACCEPTANCE OF APPOINTMENT</div>
        <div style={{ lineHeight: '1.8', marginBottom: '30px' }}>
          I,{' '}
          <input
            type="text"
            value={localFormData.attorneyAcceptanceName}
            onChange={handleFieldChange('attorneyAcceptanceName')}
            style={{ ...inlineInputStyle, width: '200px' }}
            placeholder="Attorney-in-Fact Name"
          />, the attorney-in-fact named above, hereby accept appointment as attorney-in-fact in accordance with the foregoing instrument.
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <input
            type="text"
            value={localFormData.attorneySignature}
            onChange={handleFieldChange('attorneySignature')}
            placeholder="Attorney-in-Fact's Signature"
            style={{
              width: '300px',
              padding: '12px',
              border: 'none',
              borderBottom: '2px solid #2d3748',
              backgroundColor: 'transparent',
              fontSize: '16px',
              textAlign: 'center',
              marginBottom: '20px'
            }}
          />
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Attorney-in-Fact's Signature
          </div>
          
          <input
            type="text"
            value={localFormData.attorneyPrintedName}
            onChange={handleFieldChange('attorneyPrintedName')}
            placeholder="Attorney-in-Fact's Printed Name"
            style={{
              width: '300px',
              padding: '12px',
              border: 'none',
              borderBottom: '2px solid #2d3748',
              backgroundColor: 'transparent',
              fontSize: '16px',
              textAlign: 'center'
            }}
          />
          <div style={{ fontSize: '14px', color: '#666' }}>
            Attorney-in-Fact's Printed Name
          </div>
        </div>
      </div>

      {/* Witnesses Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>WITNESSES</div>
        <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          We, the witnesses, each do hereby declare in the presence of the principal that the principal signed and executed this instrument as his Power of Attorney in the presence of each of us, that he signed it willingly, that each of us hereby signs this Power of Attorney as witness at the request of the principal and in his presence, and that, to the best of our knowledge, the principal is eighteen years of age or over, of sound mind, and under no constraint or undue influence.
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
          <div>
            <input
              type="text"
              value={localFormData.witness1Signature}
              onChange={handleFieldChange('witness1Signature')}
              placeholder="First Witness Signature"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '1px solid #666',
                marginBottom: '10px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Witness Signature</div>
            
            <input
              type="text"
              value={localFormData.witness1PrintedName}
              onChange={handleFieldChange('witness1PrintedName')}
              placeholder="First Witness Printed Name"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '1px solid #666',
                marginBottom: '10px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Witness Print Name</div>
          </div>
          
          <div>
            <input
              type="text"
              value={localFormData.witness1Address}
              onChange={handleFieldChange('witness1Address')}
              placeholder="First Witness Address"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '1px solid #666',
                marginBottom: '10px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Address</div>
            
            <input
              type="text"
              value={localFormData.witness1CityStateZip}
              onChange={handleFieldChange('witness1CityStateZip')}
              placeholder="City, State & Zip Code"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '1px solid #666',
                marginBottom: '10px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>City, State & Zip Code</div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
          <div>
            <input
              type="text"
              value={localFormData.witness2Signature}
              onChange={handleFieldChange('witness2Signature')}
              placeholder="Second Witness Signature"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '1px solid #666',
                marginBottom: '10px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Witness Signature</div>
            
            <input
              type="text"
              value={localFormData.witness2PrintedName}
              onChange={handleFieldChange('witness2PrintedName')}
              placeholder="Second Witness Printed Name"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '1px solid #666',
                marginBottom: '10px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Witness Print Name</div>
          </div>
          
          <div>
            <input
              type="text"
              value={localFormData.witness2Address}
              onChange={handleFieldChange('witness2Address')}
              placeholder="Second Witness Address"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '1px solid #666',
                marginBottom: '10px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Address</div>
            
            <input
              type="text"
              value={localFormData.witness2CityStateZip}
              onChange={handleFieldChange('witness2CityStateZip')}
              placeholder="City, State & Zip Code"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '1px solid #666',
                marginBottom: '10px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>City, State & Zip Code</div>
          </div>
        </div>
      </div>

      {/* Notary Acknowledgment Section */}
      <div style={{ ...sectionStyle, backgroundColor: '#f0f0f0', border: '1px solid #ddd' }}>
        <div style={sectionTitleStyle}>ACKNOWLEDGMENT OF NOTARY PUBLIC</div>
        <div style={{ marginBottom: '15px', fontStyle: 'italic', color: '#666', textAlign: 'center' }}>
          This section will be completed by the notary during the video call.
        </div>
        
        <div style={{ lineHeight: '1.8', marginBottom: '20px', color: '#888' }}>
          STATE OF{' '}
          <span style={{ ...inlineInputStyle, width: '120px', backgroundColor: '#f9f9f9', color: '#aaa', border: '1px solid #ddd', display: 'inline-block', textAlign: 'center' }}>
            [State]
          </span>
          
          <span style={{ ...inlineInputStyle, width: '120px', backgroundColor: '#f9f9f9', color: '#aaa', border: '1px solid #ddd', display: 'inline-block', textAlign: 'center' }}>
            [County]
          </span> County.
        </div>
        
        <div style={{ lineHeight: '1.8', marginBottom: '30px', color: '#888' }}>
          On this{' '}
          <span style={{ ...inlineInputStyle, width: '50px', backgroundColor: '#f9f9f9', color: '#aaa', border: '1px solid #ddd', display: 'inline-block', textAlign: 'center' }}>
            [Day]
          </span> day of{' '}
          <span style={{ ...inlineInputStyle, width: '120px', backgroundColor: '#f9f9f9', color: '#aaa', border: '1px solid #ddd', display: 'inline-block', textAlign: 'center' }}>
            [Month]
          </span>, 20
          <span style={{ ...inlineInputStyle, width: '60px', backgroundColor: '#f9f9f9', color: '#aaa', border: '1px solid #ddd', display: 'inline-block', textAlign: 'center' }}>
            [YY]
          </span>, before me appeared{' '}
          <span style={{ ...inlineInputStyle, width: '180px', backgroundColor: '#f9f9f9', color: '#aaa', border: '1px solid #ddd', display: 'inline-block', textAlign: 'center' }}>
            [Principal's Name]
          </span>, as Principal of this Power of Attorney who proved to me through government issued photo identification to be the above-named person, in my presence executed foregoing instrument and acknowledged that he executed the same as his free act and deed.
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div
            style={{
              width: '250px',
              padding: '8px',
              border: 'none',
              borderBottom: '1px solid #ddd',
              marginBottom: '10px',
              backgroundColor: '#f9f9f9',
              color: '#aaa',
              textAlign: 'center',
              margin: '0 auto'
            }}
          >
            [Notary Public Signature]
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Notary Public</div>
          
          <div style={{ color: '#888' }}>
            My commission expires:{' '}
            <span style={{ ...inlineInputStyle, width: '150px', backgroundColor: '#f9f9f9', color: '#aaa', border: '1px solid #ddd', display: 'inline-block', textAlign: 'center' }}>
              [Date]
            </span>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
        fontSize: '12px',
        color: '#718096',
        fontStyle: 'italic'
      }}>
        This limited special power of attorney is legally binding when properly executed and notarized.
      </div>

    </FormWrapper>
  );
};

export default LimitedSpecialPowerOfAttorneyForm;
