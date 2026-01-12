'use client';
import React, { useState, useEffect } from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';

const RealEstatePowerOfAttorneyForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const [localFormData, setLocalFormData] = useState({
    // Principal Information
    principalName: '',
    principalStreetAddress: '',
    principalCity: '',
    principalState: '',
    
    // Agent Information
    agentName: '',
    agentStreetAddress: '',
    agentCity: '',
    agentState: '',
    
    // Section 1: Powers (with initials)
    powerManagementInitials: '',
    powerManagement: false,
    managementPropertyAddress: '',
    managementLegalDescription: '',
    
    powerSaleInitials: '',
    powerSale: false,
    salePropertyAddress: '',
    saleLegalDescription: '',
    
    powerPurchaseInitials: '',
    powerPurchase: false,
    purchasePropertyAddress: '',
    purchaseLegalDescription: '',
    
    powerRefinancingInitials: '',
    powerRefinancing: false,
    refinancingPropertyAddress: '',
    refinancingLegalDescription: '',
    
    // Section 3: Term Options
    termOption: '', // 'A', 'B', or 'C'
    termOptionAInitials: '',
    termOptionBInitials: '',
    termOptionCInitials: '',
    terminationDay: '',
    terminationMonth: '',
    terminationYear: '',
    
    // Section 5: Governing Law
    governingState: '',
    
    // Execution
    executionDay: '',
    executionMonth: '',
    executionYear: '',
    
    // Principal Signature
    principalSignature: '',
    principalPrintName: '',
    
    // Agent Signature
    agentSignature: '',
    agentPrintName: '',
    
    // Witnesses
    witness1Name: '',
    witness1Signature: '',
    witness1PrintName: '',
    witness2Name: '',
    witness2Signature: '',
    witness2PrintName: '',
    
    // Notary (stored but not editable by user)
    notaryState: '',
    notaryCounty: '',
    notaryDay: '',
    notaryMonth: '',
    notaryYear: '',
    notaryPrincipalName: '',
    notarySignature: '',
    notaryPrintName: '',
    notaryCommissionExpires: '',
    
    // Agent Acceptance
    agentAcceptanceSignature: '',
    agentAcceptancePrintName: '',
    
    ...formData
  });
  
  const [isValid, setIsValid] = useState(false);

  useEffect(() => { 
    onFormDataChange(localFormData); 
  }, [localFormData, onFormDataChange]);
  
  useEffect(() => {
    const requiredFields = [
      'principalName', 'principalStreetAddress', 'principalCity', 'principalState',
      'agentName', 'agentStreetAddress', 'agentCity', 'agentState',
      'governingState', 'executionDay', 'executionMonth', 'executionYear'
    ];
    
    let valid = requiredFields.every(field => localFormData[field]);
    
    // At least one power must be selected
    const powersSelected = localFormData.powerManagement || 
                          localFormData.powerSale || 
                          localFormData.powerPurchase || 
                          localFormData.powerRefinancing;
    
    if (!powersSelected) valid = false;
    
    // A term option must be selected
    if (!localFormData.termOption) valid = false;
    
    // If term option A is selected, termination date is required
    if (localFormData.termOption === 'A') {
      if (!localFormData.terminationDay || !localFormData.terminationMonth || !localFormData.terminationYear) {
        valid = false;
      }
    }
    
    setIsValid(valid);
  }, [localFormData]);

  const handleFieldChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setLocalFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRadioChange = (field, value) => {
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
    marginTop: '6px'
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
    <FormWrapper title="Real Estate Power of Attorney" onProceed={() => isValid && onProceed()} isValid={isValid}>
      

      {/* Opening Section */}
      <div style={sectionStyle}>
        <div style={{ lineHeight: '1.8', marginBottom: '20px' }}>
          I,{' '}
          <input
            type="text"
            value={localFormData.principalName}
            onChange={handleFieldChange('principalName')}
            style={{ ...inlineInputStyle, width: '200px' }}
            placeholder="Principal's Full Name"
            required
          /> (Hereinafter referred to as the "Principal"), with the street address of{' '}
          <input
            type="text"
            value={localFormData.principalStreetAddress}
            onChange={handleFieldChange('principalStreetAddress')}
            style={{ ...inlineInputStyle, width: '300px' }}
            placeholder="Street Address"
            required
          /> in the City of{' '}
          <input
            type="text"
            value={localFormData.principalCity}
            onChange={handleFieldChange('principalCity')}
            style={{ ...inlineInputStyle, width: '120px' }}
            placeholder="City"
            required
          />, State of{' '}
          <input
            type="text"
            value={localFormData.principalState}
            onChange={handleFieldChange('principalState')}
            style={{ ...inlineInputStyle, width: '120px' }}
            placeholder="State"
            required
          />, hereby appoint{' '}
          <input
            type="text"
            value={localFormData.agentName}
            onChange={handleFieldChange('agentName')}
            style={{ ...inlineInputStyle, width: '200px' }}
            placeholder="Agent's Full Name"
            required
          /> (Hereinafter referred to as the "Agent") with the street address of{' '}
          <input
            type="text"
            value={localFormData.agentStreetAddress}
            onChange={handleFieldChange('agentStreetAddress')}
            style={{ ...inlineInputStyle, width: '300px' }}
            placeholder="Agent's Street Address"
            required
          /> in the City of{' '}
          <input
            type="text"
            value={localFormData.agentCity}
            onChange={handleFieldChange('agentCity')}
            style={{ ...inlineInputStyle, width: '120px' }}
            placeholder="City"
            required
          />, State of{' '}
          <input
            type="text"
            value={localFormData.agentState}
            onChange={handleFieldChange('agentState')}
            style={{ ...inlineInputStyle, width: '120px' }}
            placeholder="State"
            required
          />, to act on my behalf for the purpose set forth in Section 1 below.
        </div>
      </div>

      {/* Section 1: Powers */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>SECTION 1. APPOINTMENT OF POWERS</div>
        
        <div style={{ marginLeft: '10px' }}>
          {/* Power A: Management */}
          <div style={{ marginBottom: '25px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* <input
                type="text"
                value={localFormData.powerManagementInitials}
                onChange={handleFieldChange('powerManagementInitials')}
                style={{ width: '40px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                placeholder="__"
                maxLength="3"
              /> */}
              <input
                type="checkbox"
                checked={localFormData.powerManagement}
                onChange={handleFieldChange('powerManagement')}
                style={checkboxStyle}
              />
              <div>
                <strong>A. Management of Real Estate:</strong> My agent is authorized to act on my behalf for the purpose of managing the premises located at{' '}
                <input
                  type="text"
                  value={localFormData.managementPropertyAddress}
                  onChange={handleFieldChange('managementPropertyAddress')}
                  style={{ ...inlineInputStyle, width: '300px' }}
                  placeholder="Property Address"
                /> and with a legal description of{' '}
                <input
                  type="text"
                  value={localFormData.managementLegalDescription}
                  onChange={handleFieldChange('managementLegalDescription')}
                  style={{ ...inlineInputStyle, width: '300px' }}
                  placeholder="Legal Description"
                />. My agent is authorized to perform all acts related to maintaining the property such as but not limited to; making repairs (with reimbursement), approving sub-contractors for work, negotiating rents, signing lease/sublease agreements, evicting tenants and any other representation as needed for day-to-day management.
              </div>
            </label>
          </div>

          {/* Power B: Sale */}
          <div style={{ marginBottom: '25px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* <input
                type="text"
                value={localFormData.powerSaleInitials}
                onChange={handleFieldChange('powerSaleInitials')}
                style={{ width: '40px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                placeholder="__"
                maxLength="3"
              /> */}
              <input
                type="checkbox"
                checked={localFormData.powerSale}
                onChange={handleFieldChange('powerSale')}
                style={checkboxStyle}
              />
              <div>
                <strong>B. Sale of Real Estate:</strong> My agent is authorized to act in my behalf for the purpose of selling the lands and premises located at{' '}
                <input
                  type="text"
                  value={localFormData.salePropertyAddress}
                  onChange={handleFieldChange('salePropertyAddress')}
                  style={{ ...inlineInputStyle, width: '300px' }}
                  placeholder="Property Address"
                /> and with a legal description of{' '}
                <input
                  type="text"
                  value={localFormData.saleLegalDescription}
                  onChange={handleFieldChange('saleLegalDescription')}
                  style={{ ...inlineInputStyle, width: '300px' }}
                  placeholder="Legal Description"
                />. My agent is authorized to perform any and all acts related to such sale, including, but not limited to, executing, modifying and delivering any and all documents necessary to complete the transaction as well as accepting the closing proceeds for deposit into my account which has been previously disclosed to my agent.
              </div>
            </label>
          </div>

          {/* Power C: Purchase */}
          <div style={{ marginBottom: '25px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* <input
                type="text"
                value={localFormData.powerPurchaseInitials}
                onChange={handleFieldChange('powerPurchaseInitials')}
                style={{ width: '40px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                placeholder="__"
                maxLength="3"
              /> */}
              <input
                type="checkbox"
                checked={localFormData.powerPurchase}
                onChange={handleFieldChange('powerPurchase')}
                style={checkboxStyle}
              />
              <div>
                <strong>C. Purchase of Real Estate:</strong> My agent is authorized to act in my behalf for the purpose of purchasing the lands and premises located at{' '}
                <input
                  type="text"
                  value={localFormData.purchasePropertyAddress}
                  onChange={handleFieldChange('purchasePropertyAddress')}
                  style={{ ...inlineInputStyle, width: '300px' }}
                  placeholder="Property Address"
                /> and with a legal description of{' '}
                <input
                  type="text"
                  value={localFormData.purchaseLegalDescription}
                  onChange={handleFieldChange('purchaseLegalDescription')}
                  style={{ ...inlineInputStyle, width: '300px' }}
                  placeholder="Legal Description"
                />. My agent is authorized to perform any and all acts related to such purchase, including, but not limited to the financing and mortgaging of the property. My agent is authorized to execute, modify and deliver any documents necessary to complete the financing and purchase of the property as well as to withdraw and disburse funds necessary for the closing from my account which I have previously disclosed to my agent.
              </div>
            </label>
          </div>

          {/* Power D: Refinancing */}
          <div style={{ marginBottom: '25px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* <input
                type="text"
                value={localFormData.powerRefinancingInitials}
                onChange={handleFieldChange('powerRefinancingInitials')}
                style={{ width: '40px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                placeholder="__"
                maxLength="3"
              /> */}
              <input
                type="checkbox"
                checked={localFormData.powerRefinancing}
                onChange={handleFieldChange('powerRefinancing')}
                style={checkboxStyle}
              />
              <div>
                <strong>D. Refinancing:</strong> My agent is authorized to act in my behalf for the purpose of refinancing my debts, including, but not limited to any debts secured by a mortgage on the lands and premises located at{' '}
                <input
                  type="text"
                  value={localFormData.refinancingPropertyAddress}
                  onChange={handleFieldChange('refinancingPropertyAddress')}
                  style={{ ...inlineInputStyle, width: '300px' }}
                  placeholder="Property Address"
                /> and with a legal description of{' '}
                <input
                  type="text"
                  value={localFormData.refinancingLegalDescription}
                  onChange={handleFieldChange('refinancingLegalDescription')}
                  style={{ ...inlineInputStyle, width: '300px' }}
                  placeholder="Legal Description"
                />. My agent is authorized to perform any and all acts related to such refinancing, including but not limited to, modifying, executing and delivering any and all documents necessary to complete the refinancing as well as to withdraw and disburse funds necessary to complete the refinancing from my account which I have previously disclosed to my agent.
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Section 2: Durable Power */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>SECTION 2. DURABLE POWER OF ATTORNEY</div>
        <div style={{ lineHeight: '1.6' }}>
          This power of attorney shall not be affected by the Principal's subsequent disability or incapacity unless otherwise stated in Section 3(b).
        </div>
      </div>

      {/* Section 3: Term */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>SECTION 3. TERM</div>
        <div style={{ marginBottom: '20px', fontStyle: 'italic' }}>
          (Initial and Check the Applicable Term):
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          {/* Option A */}
          <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* <input
                type="text"
                value={localFormData.termOptionAInitials}
                onChange={handleFieldChange('termOptionAInitials')}
                style={{ width: '40px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                placeholder="__"
                maxLength="3"
              /> */}
              <input
                type="radio"
                name="termOption"
                value="A"
                checked={localFormData.termOption === 'A'}
                onChange={() => handleRadioChange('termOption', 'A')}
                style={checkboxStyle}
                required
              />
              <div>
                <strong>A.</strong> This power of attorney is effective as of the date hereof and shall terminate upon revocation or automatically on the{' '}
                <input
                  type="number"
                  value={localFormData.terminationDay}
                  onChange={handleFieldChange('terminationDay')}
                  style={{ ...inlineInputStyle, width: '50px' }}
                  min="1"
                  max="31"
                  placeholder="Day"
                /> day of{' '}
                <input
                  type="text"
                  value={localFormData.terminationMonth}
                  onChange={handleFieldChange('terminationMonth')}
                  style={{ ...inlineInputStyle, width: '120px' }}
                  placeholder="Month"
                />, 20
                <input
                  type="number"
                  value={localFormData.terminationYear}
                  onChange={handleFieldChange('terminationYear')}
                  style={{ ...inlineInputStyle, width: '60px' }}
                  min="20"
                  max="99"
                  placeholder="YY"
                />.
              </div>
            </label>
          </div>

          {/* Option B */}
          <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* <input
                type="text"
                value={localFormData.termOptionBInitials}
                onChange={handleFieldChange('termOptionBInitials')}
                style={{ width: '40px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                placeholder="__"
                maxLength="3"
              /> */}
              <input
                type="radio"
                name="termOption"
                value="B"
                checked={localFormData.termOption === 'B'}
                onChange={() => handleRadioChange('termOption', 'B')}
                style={checkboxStyle}
                required
              />
              <div>
                <strong>B.</strong> (Non-Durable Option) This power of attorney is effective as of the date hereof and shall terminate upon my incapacity, or death, or revocation.
              </div>
            </label>
          </div>

          {/* Option C */}
          <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {/* <input
                type="text"
                value={localFormData.termOptionCInitials}
                onChange={handleFieldChange('termOptionCInitials')}
                style={{ width: '40px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                placeholder="__"
                maxLength="3"
              /> */}
              <input
                type="radio"
                name="termOption"
                value="C"
                checked={localFormData.termOption === 'C'}
                onChange={() => handleRadioChange('termOption', 'C')}
                style={checkboxStyle}
                required
              />
              <div>
                <strong>C.</strong> This power of attorney is effective as of the date hereof and shall terminate upon my death or revocation.
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Section 4: Ratification */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>SECTION 4. RATIFICATION</div>
        <div style={{ lineHeight: '1.6' }}>
          I, the Principal, grant to my Agent full power and authority to perform all acts on my behalf as I could do if personally present, hereby ratifying and confirming all that my Agent may do pursuant to this power.
        </div>
      </div>

      {/* Section 5: Governing Law */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>SECTION 5. GOVERNING LAW</div>
        <div style={{ lineHeight: '1.8' }}>
          This Note shall be governed by, and construed in accordance with, the laws of the State of{' '}
          <input
            type="text"
            value={localFormData.governingState}
            onChange={handleFieldChange('governingState')}
            style={{ ...inlineInputStyle, width: '150px' }}
            placeholder="State Name"
            required
          />.
        </div>
      </div>

      {/* Section 6: Revocation */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>SECTION 6. REVOCATION</div>
        <div style={{ lineHeight: '1.6' }}>
          I, the Principal, hereby revoke any existing powers of attorney that may have previously been granted by me relative to the above described property.
        </div>
      </div>

      {/* Execution Section */}
      <div style={sectionStyle}>
        <div style={{ lineHeight: '1.8', marginBottom: '40px' }}>
          In witness whereof, I have executed this instrument this{' '}
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div style={{ textAlign: 'center' }}>
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
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Principal's Signature</div>
            
            <input
              type="text"
              value={localFormData.principalPrintName}
              onChange={handleFieldChange('principalPrintName')}
              placeholder="Print Name"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '2px solid #2d3748',
                backgroundColor: 'transparent',
                fontSize: '16px',
                textAlign: 'center'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666' }}>Print Name</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <input
              type="text"
              value={localFormData.agentSignature}
              onChange={handleFieldChange('agentSignature')}
              placeholder="Agent's Signature"
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
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Agent's Signature</div>
            
            <input
              type="text"
              value={localFormData.agentPrintName}
              onChange={handleFieldChange('agentPrintName')}
              placeholder="Print Name"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '2px solid #2d3748',
                backgroundColor: 'transparent',
                fontSize: '16px',
                textAlign: 'center'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666' }}>Print Name</div>
          </div>
        </div>
      </div>

      {/* Witnesses Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>WITNESSES</div>
        
        {/* Witness 1 */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>Affirmation by Witness #1</div>
          <div style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            I,{' '}
            <input
              type="text"
              value={localFormData.witness1Name}
              onChange={handleFieldChange('witness1Name')}
              style={{ ...inlineInputStyle, width: '200px' }}
              placeholder="Witness Name"
            />, witnessed the execution of this Power of Attorney by the Principal, and I affirm that the Principal appeared to me to be of sound mind, was not under duress, and the Principal affirmed to me that he/she was aware of the nature of this Power of Attorney and signed it freely and voluntarily.
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <input
                type="text"
                value={localFormData.witness1Signature}
                onChange={handleFieldChange('witness1Signature')}
                placeholder="Witness #1 Signature"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: 'none',
                  borderBottom: '1px solid #666',
                  marginBottom: '10px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666' }}>Witness #1's Signature</div>
            </div>
            
            <div>
              <input
                type="text"
                value={localFormData.witness1PrintName}
                onChange={handleFieldChange('witness1PrintName')}
                placeholder="Print Name"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: 'none',
                  borderBottom: '1px solid #666',
                  marginBottom: '10px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666' }}>Print Name</div>
            </div>
          </div>
        </div>

        {/* Witness 2 */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>Affirmation by Witness #2</div>
          <div style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            I,{' '}
            <input
              type="text"
              value={localFormData.witness2Name}
              onChange={handleFieldChange('witness2Name')}
              style={{ ...inlineInputStyle, width: '200px' }}
              placeholder="Witness Name"
            />, witnessed the execution of this Power of Attorney by the Principal, and I affirm that the Principal appeared to me to be of sound mind, was not under duress, and the Principal affirmed to me that he/she was aware of the nature of this Power of Attorney and signed it freely and voluntarily.
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <input
                type="text"
                value={localFormData.witness2Signature}
                onChange={handleFieldChange('witness2Signature')}
                placeholder="Witness #2 Signature"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: 'none',
                  borderBottom: '1px solid #666',
                  marginBottom: '10px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666' }}>Witness #2's Signature</div>
            </div>
            
            <div>
              <input
                type="text"
                value={localFormData.witness2PrintName}
                onChange={handleFieldChange('witness2PrintName')}
                placeholder="Print Name"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: 'none',
                  borderBottom: '1px solid #666',
                  marginBottom: '10px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666' }}>Print Name</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notary Acknowledgment Section */}
      <div style={{ ...sectionStyle, backgroundColor: '#f0f0f0', border: '1px solid #ddd' }}>
        <div style={sectionTitleStyle}>NOTARY ACKNOWLEDGMENT</div>
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
          </span>, as the Principal who proved to me through government issued photo identification to be the above-named person, in my presence executed foregoing instrument and acknowledged that (s)he executed the same as his/her free act and deed.
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
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', color: '#888' }}>
            <div>
              Print Name:{' '}
              <span style={{ ...inlineInputStyle, width: '150px', backgroundColor: '#f9f9f9', color: '#aaa', border: '1px solid #ddd', display: 'inline-block', textAlign: 'center' }}>
                [Name]
              </span>
            </div>
            <div>
              My commission expires:{' '}
              <span style={{ ...inlineInputStyle, width: '150px', backgroundColor: '#f9f9f9', color: '#aaa', border: '1px solid #ddd', display: 'inline-block', textAlign: 'center' }}>
                [Date]
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Acceptance Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>ACCEPTANCE BY AGENT</div>
        <div style={{ lineHeight: '1.6', marginBottom: '30px' }}>
          The undersigned Agent acknowledges and executes this Power of Attorney, and by such execution does hereby affirm that I: (A) accept the appointment as agent; (B) understand the duties under the Power of Attorney and under the law.
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', textAlign: 'center' }}>
          <div>
            <input
              type="text"
              value={localFormData.agentAcceptanceSignature}
              onChange={handleFieldChange('agentAcceptanceSignature')}
              placeholder="Agent's Signature"
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
            <div style={{ fontSize: '12px', color: '#666' }}>Agent's Signature</div>
          </div>
          
          <div>
            <input
              type="text"
              value={localFormData.agentAcceptancePrintName}
              onChange={handleFieldChange('agentAcceptancePrintName')}
              placeholder="Print Name"
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
            <div style={{ fontSize: '12px', color: '#666' }}>Print Name</div>
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
        This real estate power of attorney is legally binding when properly executed and notarized.
      </div>

    </FormWrapper>
  );
};

export default RealEstatePowerOfAttorneyForm;
