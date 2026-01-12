'use client';
import React, { useState, useEffect } from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';

const PropertyManagementForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const [localFormData, setLocalFormData] = useState({
    // Section I - The Parties
    agreementDate: '',
    ownerName: '',
    ownerAddress: '',
    agentName: '',
    agentAddress: '',
    
    // Section II - Property Appointment
    property1Type: '',
    property1Address: '',
    property1Description: '',
    property2Type: '',
    property2Address: '',
    property2Description: '',
    property3Type: '',
    property3Address: '',
    property3Description: '',
    
    // Section III - Term
    termMonths: '',
    termStartDate: '',
    termEndDate: '',
    afterTermExpiration: '', // 'terminate' or 'continue'
    
    // Section IV - Right to Terminate
    rightToTerminate: '', // 'may' or 'may_not'
    terminationNoticeDays: '',
    
    // Section V - Right to Lease
    fixedTermArrangements: false,
    fixedTermMaxMonths: '',
    monthToMonthArrangements: false,
    vacationRentals: false,
    otherLeaseRights: false,
    otherLeaseRightsDescription: '',
    
    // Section VI - Rental Amount
    rentalAmountType: '', // 'market', 'minimum', 'other'
    minimumRentAmount: '',
    minimumRentPeriod: '', // 'month' or 'year'
    otherRentalAmount: '',
    
    // Section VII - Security Deposits
    securityDepositResponsibility: '', // 'agent' or 'owner'
    
    // Section VIII - Distribution to Owner
    distributionType: '', // 'timely', 'percentage', 'fixed_amount', 'quarterly', 'other'
    distributionPercentage: '',
    distributionFrequency: '', // 'week' or 'month'
    distributionFixedAmount: '',
    distributionFixedFrequency: '', // 'week' or 'month'
    distributionOther: '',
    
    // Section IX - Agent's Compensation
    managementFeeEnabled: false,
    managementFeeDescription: '',
    newLeaseEnabled: false,
    newLeaseDescription: '',
    renewalLeaseEnabled: false,
    renewalLeaseDescription: '',
    evictionEnabled: false,
    evictionDescription: '',
    preparingPropertyEnabled: false,
    preparingPropertyDescription: '',
    otherCompensationEnabled: false,
    otherCompensationDescription: '',
    
    // Section X - Sale of the Premises
    saleRights: '', // 'exclusive' or 'none'
    
    // Section XI - Key-safe / Lockbox
    keySafeAuthorization: '', // 'authorized' or 'not_authorized'
    
    // Section XII - Repairs; Maintenance
    repairApprovalAmount: '',
    
    // Sections XIII-XXIX are mostly informational/acknowledgment sections
    // Section XXX - Notices (Contact Information)
    ownerNoticeName: '',
    ownerNoticeAddress: '',
    ownerNoticePhone: '',
    ownerNoticeEmail: '',
    agentNoticeName: '',
    agentNoticeAddress: '',
    agentNoticePhone: '',
    agentNoticeEmail: '',
    
    // Section XXXIV - Additional Terms & Conditions
    additionalTerms: '',
    
    // Signature Section
    ownerSignature: '',
    ownerSignatureDate: '',
    ownerPrintName: '',
    agentSignature: '',
    agentSignatureDate: '',
    agentPrintName: '',
    
    ...formData
  });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => { onFormDataChange(localFormData); }, [localFormData, onFormDataChange]);
  
  useEffect(() => {
    const requiredFields = [
      'agreementDate', 'ownerName', 'ownerAddress', 'agentName', 'agentAddress',
      'property1Type', 'property1Address', 'termMonths', 'termStartDate', 'termEndDate',
      'afterTermExpiration', 'rightToTerminate', 'rentalAmountType'
    ];
    
    let valid = requiredFields.every(field => localFormData[field]);
    
    // Additional conditional validations
    if (localFormData.rightToTerminate === 'may' && !localFormData.terminationNoticeDays) valid = false;
    if (localFormData.fixedTermArrangements && !localFormData.fixedTermMaxMonths) valid = false;
    if (localFormData.otherLeaseRights && !localFormData.otherLeaseRightsDescription) valid = false;
    if (localFormData.rentalAmountType === 'minimum' && (!localFormData.minimumRentAmount || !localFormData.minimumRentPeriod)) valid = false;
    if (localFormData.rentalAmountType === 'other' && !localFormData.otherRentalAmount) valid = false;
    
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
    transform: 'scale(1.2)'
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

  return (
    <FormWrapper title="Property Management Agreement" onProceed={() => isValid && onProceed()} isValid={isValid}>
      
      {/* Section I - The Parties */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>I. THE PARTIES</div>
        <div style={{ lineHeight: '1.8', marginBottom: '20px' }}>
          This Property Management Agreement ("Agreement") made this{' '}
          <input
            type="date"
            value={localFormData.agreementDate}
            onChange={handleFieldChange('agreementDate')}
            style={{ ...inlineInputStyle, width: '150px' }}
            required
          />, by and between:
        </div>
        
        <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
          <strong>Owner:</strong>{' '}
          <input
            type="text"
            value={localFormData.ownerName}
            onChange={handleFieldChange('ownerName')}
            placeholder="Owner's Name"
            style={{ ...inlineInputStyle, width: '200px' }}
            required
          />, with a mailing address of{' '}
          <input
            type="text"
            value={localFormData.ownerAddress}
            onChange={handleFieldChange('ownerAddress')}
            placeholder="Owner's Address"
            style={{ ...inlineInputStyle, width: '300px' }}
            required
          /> ("Owner"), and
        </div>
        
        <div style={{ lineHeight: '1.8' }}>
          <strong>Property Manager:</strong>{' '}
          <input
            type="text"
            value={localFormData.agentName}
            onChange={handleFieldChange('agentName')}
            placeholder="Property Manager's Name"
            style={{ ...inlineInputStyle, width: '200px' }}
            required
          />, with a mailing address of{' '}
          <input
            type="text"
            value={localFormData.agentAddress}
            onChange={handleFieldChange('agentAddress')}
            placeholder="Property Manager's Address"
            style={{ ...inlineInputStyle, width: '300px' }}
            required
          /> ("Agent").
        </div>
      </div>
      
      {/* Section II - Appointment of Agent */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>II. APPOINTMENT OF AGENT</div>
        <div style={{ marginBottom: '20px' }}>
          The Owner hereby appoints the Agent the exclusive right to rent, lease, operate, and manage the following properties:
        </div>
        
        {/* Property 1 */}
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>1st Property</div>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ marginRight: '15px' }}>Type:</span>
            <label style={{ marginRight: '20px' }}>
              <input
                type="radio"
                name="property1Type"
                value="Commercial"
                checked={localFormData.property1Type === 'Commercial'}
                onChange={() => handleRadioChange('property1Type', 'Commercial')}
                style={checkboxStyle}
              />
              Commercial
            </label>
            <label>
              <input
                type="radio"
                name="property1Type"
                value="Residential"
                checked={localFormData.property1Type === 'Residential'}
                onChange={() => handleRadioChange('property1Type', 'Residential')}
                style={checkboxStyle}
              />
              Residential
            </label>
          </div>
          <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
            Property Address:{' '}
            <input
              type="text"
              value={localFormData.property1Address}
              onChange={handleFieldChange('property1Address')}
              placeholder="Property Address"
              style={{ ...inlineInputStyle, width: '300px' }}
              required
            />
          </div>
          <div style={{ lineHeight: '1.8' }}>
            Description:{' '}
            <input
              type="text"
              value={localFormData.property1Description}
              onChange={handleFieldChange('property1Description')}
              placeholder="Property Description"
              style={{ ...inlineInputStyle, width: '350px' }}
            />
          </div>
        </div>
        
        {/* Property 2 */}
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>2nd Property</div>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ marginRight: '15px' }}>Type:</span>
            <label style={{ marginRight: '20px' }}>
              <input
                type="radio"
                name="property2Type"
                value="Commercial"
                checked={localFormData.property2Type === 'Commercial'}
                onChange={() => handleRadioChange('property2Type', 'Commercial')}
                style={checkboxStyle}
              />
              Commercial
            </label>
            <label>
              <input
                type="radio"
                name="property2Type"
                value="Residential"
                checked={localFormData.property2Type === 'Residential'}
                onChange={() => handleRadioChange('property2Type', 'Residential')}
                style={checkboxStyle}
              />
              Residential
            </label>
          </div>
          <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
            Property Address:{' '}
            <input
              type="text"
              value={localFormData.property2Address}
              onChange={handleFieldChange('property2Address')}
              placeholder="Property Address (Optional)"
              style={{ ...inlineInputStyle, width: '300px' }}
            />
          </div>
          <div style={{ lineHeight: '1.8' }}>
            Description:{' '}
            <input
              type="text"
              value={localFormData.property2Description}
              onChange={handleFieldChange('property2Description')}
              placeholder="Property Description (Optional)"
              style={{ ...inlineInputStyle, width: '350px' }}
            />
          </div>
        </div>
        
        {/* Property 3 */}
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>3rd Property</div>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ marginRight: '15px' }}>Type:</span>
            <label style={{ marginRight: '20px' }}>
              <input
                type="radio"
                name="property3Type"
                value="Commercial"
                checked={localFormData.property3Type === 'Commercial'}
                onChange={() => handleRadioChange('property3Type', 'Commercial')}
                style={checkboxStyle}
              />
              Commercial
            </label>
            <label>
              <input
                type="radio"
                name="property3Type"
                value="Residential"
                checked={localFormData.property3Type === 'Residential'}
                onChange={() => handleRadioChange('property3Type', 'Residential')}
                style={checkboxStyle}
              />
              Residential
            </label>
          </div>
          <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
            Property Address:{' '}
            <input
              type="text"
              value={localFormData.property3Address}
              onChange={handleFieldChange('property3Address')}
              placeholder="Property Address (Optional)"
              style={{ ...inlineInputStyle, width: '300px' }}
            />
          </div>
          <div style={{ lineHeight: '1.8' }}>
            Description:{' '}
            <input
              type="text"
              value={localFormData.property3Description}
              onChange={handleFieldChange('property3Description')}
              placeholder="Property Description (Optional)"
              style={{ ...inlineInputStyle, width: '350px' }}
            />
          </div>
        </div>
      </div>
      
      {/* Section III - Term */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>III. TERM</div>
        <div style={{ lineHeight: '1.8', marginBottom: '20px' }}>
          This Agreement shall be for a term of{' '}
          <input
            type="number"
            value={localFormData.termMonths}
            onChange={handleFieldChange('termMonths')}
            placeholder="#"
            style={{ ...inlineInputStyle, width: '60px' }}
            min="1"
            required
          />{' '}months beginning{' '}
          <input
            type="date"
            value={localFormData.termStartDate}
            onChange={handleFieldChange('termStartDate')}
            style={{ ...inlineInputStyle, width: '150px' }}
            required
          />, and ending{' '}
          <input
            type="date"
            value={localFormData.termEndDate}
            onChange={handleFieldChange('termEndDate')}
            style={{ ...inlineInputStyle, width: '150px' }}
            required
          /> ("Term").
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          After the Term expires, this Agreement shall:
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="afterTermExpiration"
                value="terminate"
                checked={localFormData.afterTermExpiration === 'terminate'}
                onChange={() => handleRadioChange('afterTermExpiration', 'terminate')}
                style={checkboxStyle}
                required
              />
              Terminate.
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="afterTermExpiration"
                value="continue"
                checked={localFormData.afterTermExpiration === 'continue'}
                onChange={() => handleRadioChange('afterTermExpiration', 'continue')}
                style={checkboxStyle}
                required
              />
              Continue on a month-to-month basis with either Party having the option to terminate with thirty (30) days' notice.
            </label>
          </div>
        </div>
      </div>
      
      {/* Section IV - Right to Terminate */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>IV. RIGHT TO TERMINATE</div>
        <div style={{ marginBottom: '15px' }}>
          During the Term of this Agreement, either Party:
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="rightToTerminate"
                value="may"
                checked={localFormData.rightToTerminate === 'may'}
                onChange={() => handleRadioChange('rightToTerminate', 'may')}
                style={checkboxStyle}
                required
              />
              May terminate this Agreement by providing at least{' '}
              {localFormData.rightToTerminate === 'may' && (
                <input
                  type="number"
                  value={localFormData.terminationNoticeDays}
                  onChange={handleFieldChange('terminationNoticeDays')}
                  placeholder="#"
                  style={{ ...inlineInputStyle, width: '60px' }}
                  min="1"
                  required
                />
              )}
              {' '}days' notice.
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="rightToTerminate"
                value="may_not"
                checked={localFormData.rightToTerminate === 'may_not'}
                onChange={() => handleRadioChange('rightToTerminate', 'may_not')}
                style={checkboxStyle}
                required
              />
              May NOT terminate this Agreement and both Parties must satisfy the terms and conditions of this Agreement until the expiration of the Term.
            </label>
          </div>
        </div>
      </div>
      
      {/* Section V - Right to Lease */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>V. RIGHT TO LEASE</div>
        <div style={{ marginBottom: '15px' }}>
          The Owner hereby grants the Agent power to create rental agreements related to the Property: (check all that apply)
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
            <label>
              <input
                type="checkbox"
                checked={localFormData.fixedTermArrangements}
                onChange={handleFieldChange('fixedTermArrangements')}
                style={checkboxStyle}
              />
              For fixed-term arrangements not exceeding{' '}
              {localFormData.fixedTermArrangements && (
                <input
                  type="number"
                  value={localFormData.fixedTermMaxMonths}
                  onChange={handleFieldChange('fixedTermMaxMonths')}
                  placeholder="#"
                  style={{ ...inlineInputStyle, width: '60px' }}
                  min="1"
                  required
                />
              )}
              {' '}months.
            </label>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={localFormData.monthToMonthArrangements}
                onChange={handleFieldChange('monthToMonthArrangements')}
                style={checkboxStyle}
              />
              For month-to-month rental arrangements in accordance with Governing Law.
            </label>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={localFormData.vacationRentals}
                onChange={handleFieldChange('vacationRentals')}
                style={checkboxStyle}
              />
              For vacation rentals
            </label>
          </div>
          
          <div style={{ lineHeight: '1.8' }}>
            <label>
              <input
                type="checkbox"
                checked={localFormData.otherLeaseRights}
                onChange={handleFieldChange('otherLeaseRights')}
                style={checkboxStyle}
              />
              Other.{' '}
              {localFormData.otherLeaseRights && (
                <input
                  type="text"
                  value={localFormData.otherLeaseRightsDescription}
                  onChange={handleFieldChange('otherLeaseRightsDescription')}
                  placeholder="Describe other lease rights"
                  style={{ ...inlineInputStyle, width: '300px' }}
                  required
                />
              )}
            </label>
          </div>
        </div>
      </div>
      
      {/* Section VI - Rental Amount */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>VI. RENTAL AMOUNT</div>
        <div style={{ marginBottom: '15px' }}>
          The Owner hereby grants the Agent power to create rental agreements related to the Property for:
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="rentalAmountType"
                value="market"
                checked={localFormData.rentalAmountType === 'market'}
                onChange={() => handleRadioChange('rentalAmountType', 'market')}
                style={checkboxStyle}
                required
              />
              Market rent.
            </label>
          </div>
          
          <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="rentalAmountType"
                value="minimum"
                checked={localFormData.rentalAmountType === 'minimum'}
                onChange={() => handleRadioChange('rentalAmountType', 'minimum')}
                style={checkboxStyle}
                required
              />
              A rate no lower than ${' '}
              {localFormData.rentalAmountType === 'minimum' && (
                <>
                  <input
                    type="number"
                    value={localFormData.minimumRentAmount}
                    onChange={handleFieldChange('minimumRentAmount')}
                    placeholder="Amount"
                    style={{ ...inlineInputStyle, width: '100px' }}
                    min="0"
                    step="0.01"
                    required
                  />
                  {' '}per{' '}
                  <label style={{ marginLeft: '10px', marginRight: '15px' }}>
                    <input
                      type="radio"
                      name="minimumRentPeriod"
                      value="month"
                      checked={localFormData.minimumRentPeriod === 'month'}
                      onChange={() => handleRadioChange('minimumRentPeriod', 'month')}
                      style={{ marginRight: '5px' }}
                      required
                    />
                    month
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="minimumRentPeriod"
                      value="year"
                      checked={localFormData.minimumRentPeriod === 'year'}
                      onChange={() => handleRadioChange('minimumRentPeriod', 'year')}
                      style={{ marginRight: '5px' }}
                      required
                    />
                    year
                  </label>
                </>
              )}
            </label>
          </div>
          
          <div style={{ lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="rentalAmountType"
                value="other"
                checked={localFormData.rentalAmountType === 'other'}
                onChange={() => handleRadioChange('rentalAmountType', 'other')}
                style={checkboxStyle}
                required
              />
              Other.{' '}
              {localFormData.rentalAmountType === 'other' && (
                <input
                  type="text"
                  value={localFormData.otherRentalAmount}
                  onChange={handleFieldChange('otherRentalAmount')}
                  placeholder="Describe other rental arrangement"
                  style={{ ...inlineInputStyle, width: '300px' }}
                  required
                />
              )}
            </label>
          </div>
        </div>
      </div>
      
      {/* Section VII - Security Deposits */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>VII. SECURITY DEPOSITS</div>
        <div style={{ marginBottom: '15px' }}>
          The Owner hereby grants the Agent power to collect security deposits from the tenants on the Property. Returning said security deposit shall be the responsibility of the:
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="securityDepositResponsibility"
                value="agent"
                checked={localFormData.securityDepositResponsibility === 'agent'}
                onChange={() => handleRadioChange('securityDepositResponsibility', 'agent')}
                style={checkboxStyle}
              />
              Agent.
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="securityDepositResponsibility"
                value="owner"
                checked={localFormData.securityDepositResponsibility === 'owner'}
                onChange={() => handleRadioChange('securityDepositResponsibility', 'owner')}
                style={checkboxStyle}
              />
              Owner.
            </label>
          </div>
        </div>
      </div>
      
      {/* Section VIII - Distribution to Owner */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>VIII. DISTRIBUTION TO OWNER</div>
        <div style={{ marginBottom: '15px' }}>
          The Parties agree that the Agent shall make the following distributions to the Owner:
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="distributionType"
                value="timely"
                checked={localFormData.distributionType === 'timely'}
                onChange={() => handleRadioChange('distributionType', 'timely')}
                style={checkboxStyle}
              />
              With each payment made by a tenant of the Property on a timely basis.
            </label>
          </div>
          
          <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="distributionType"
                value="percentage"
                checked={localFormData.distributionType === 'percentage'}
                onChange={() => handleRadioChange('distributionType', 'percentage')}
                style={checkboxStyle}
              />
              {localFormData.distributionType === 'percentage' && (
                <input
                  type="number"
                  value={localFormData.distributionPercentage}
                  onChange={handleFieldChange('distributionPercentage')}
                  placeholder="%"
                  style={{ ...inlineInputStyle, width: '60px' }}
                  min="0"
                  max="100"
                  required
                />
              )}
              % of payments collected to be paid each{' '}
              {localFormData.distributionType === 'percentage' && (
                <>
                  <label style={{ marginLeft: '10px', marginRight: '15px' }}>
                    <input
                      type="radio"
                      name="distributionFrequency"
                      value="week"
                      checked={localFormData.distributionFrequency === 'week'}
                      onChange={() => handleRadioChange('distributionFrequency', 'week')}
                      style={{ marginRight: '5px' }}
                      required
                    />
                    week
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="distributionFrequency"
                      value="month"
                      checked={localFormData.distributionFrequency === 'month'}
                      onChange={() => handleRadioChange('distributionFrequency', 'month')}
                      style={{ marginRight: '5px' }}
                      required
                    />
                    month
                  </label>
                </>
              )}
              {' '}with the full balance owed five (5) days before the end of each taxable quarter.
            </label>
          </div>
          
          <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="distributionType"
                value="fixed_amount"
                checked={localFormData.distributionType === 'fixed_amount'}
                onChange={() => handleRadioChange('distributionType', 'fixed_amount')}
                style={checkboxStyle}
              />
              ${localFormData.distributionType === 'fixed_amount' && (
                <input
                  type="number"
                  value={localFormData.distributionFixedAmount}
                  onChange={handleFieldChange('distributionFixedAmount')}
                  placeholder="Amount"
                  style={{ ...inlineInputStyle, width: '100px' }}
                  min="0"
                  step="0.01"
                  required
                />
              )}
              {' '}to be paid each{' '}
              {localFormData.distributionType === 'fixed_amount' && (
                <>
                  <label style={{ marginLeft: '10px', marginRight: '15px' }}>
                    <input
                      type="radio"
                      name="distributionFixedFrequency"
                      value="week"
                      checked={localFormData.distributionFixedFrequency === 'week'}
                      onChange={() => handleRadioChange('distributionFixedFrequency', 'week')}
                      style={{ marginRight: '5px' }}
                      required
                    />
                    week
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="distributionFixedFrequency"
                      value="month"
                      checked={localFormData.distributionFixedFrequency === 'month'}
                      onChange={() => handleRadioChange('distributionFixedFrequency', 'month')}
                      style={{ marginRight: '5px' }}
                      required
                    />
                    month
                  </label>
                </>
              )}
              {' '}with the full balance owed five (5) days before the end of each taxable quarter.
            </label>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="distributionType"
                value="quarterly"
                checked={localFormData.distributionType === 'quarterly'}
                onChange={() => handleRadioChange('distributionType', 'quarterly')}
                style={checkboxStyle}
              />
              To be paid-in-full five (5) business days before the end of each taxable quarter.
            </label>
          </div>
          
          <div style={{ lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="distributionType"
                value="other"
                checked={localFormData.distributionType === 'other'}
                onChange={() => handleRadioChange('distributionType', 'other')}
                style={checkboxStyle}
              />
              Other.{' '}
              {localFormData.distributionType === 'other' && (
                <input
                  type="text"
                  value={localFormData.distributionOther}
                  onChange={handleFieldChange('distributionOther')}
                  placeholder="Describe other distribution arrangement"
                  style={{ ...inlineInputStyle, width: '300px' }}
                  required
                />
              )}
            </label>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          Any unpaid amount from the Agent to the Owner shall be held by the Agent and designated for other fees, expenses, distributions, or other items related to the Property. Any such remaining amounts shall be distributed to the Owner upon the termination of this Agreement.
        </div>
      </div>
      
      {/* Section IX - Agent's Compensation */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>IX. AGENT'S COMPENSATION</div>
        <div style={{ marginBottom: '15px' }}>
          The Owner agrees to pay the Agent the following fees indicated below for the services and provided: (check all that apply)
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px', lineHeight: '1.8' }}>
            <label>
              <input
                type="checkbox"
                checked={localFormData.managementFeeEnabled}
                onChange={handleFieldChange('managementFeeEnabled')}
                style={checkboxStyle}
              />
              Management Fee.{' '}
              {localFormData.managementFeeEnabled && (
                <input
                  type="text"
                  value={localFormData.managementFeeDescription}
                  onChange={handleFieldChange('managementFeeDescription')}
                  placeholder="Describe management fees"
                  style={{ ...inlineInputStyle, width: '300px' }}
                  required
                />
              )}
            </label>
          </div>
          
          <div style={{ marginBottom: '15px', lineHeight: '1.8' }}>
            <label>
              <input
                type="checkbox"
                checked={localFormData.newLeaseEnabled}
                onChange={handleFieldChange('newLeaseEnabled')}
                style={checkboxStyle}
              />
              New Lease.{' '}
              {localFormData.newLeaseEnabled && (
                <input
                  type="text"
                  value={localFormData.newLeaseDescription}
                  onChange={handleFieldChange('newLeaseDescription')}
                  placeholder="Describe new lease fees"
                  style={{ ...inlineInputStyle, width: '300px' }}
                  required
                />
              )}
            </label>
          </div>
          
          <div style={{ marginBottom: '15px', lineHeight: '1.8' }}>
            <label>
              <input
                type="checkbox"
                checked={localFormData.renewalLeaseEnabled}
                onChange={handleFieldChange('renewalLeaseEnabled')}
                style={checkboxStyle}
              />
              Renewal of Lease.{' '}
              {localFormData.renewalLeaseEnabled && (
                <input
                  type="text"
                  value={localFormData.renewalLeaseDescription}
                  onChange={handleFieldChange('renewalLeaseDescription')}
                  placeholder="Describe renewal fees"
                  style={{ ...inlineInputStyle, width: '300px' }}
                  required
                />
              )}
            </label>
          </div>
          
          <div style={{ marginBottom: '15px', lineHeight: '1.8' }}>
            <label>
              <input
                type="checkbox"
                checked={localFormData.evictionEnabled}
                onChange={handleFieldChange('evictionEnabled')}
                style={checkboxStyle}
              />
              Eviction.{' '}
              {localFormData.evictionEnabled && (
                <input
                  type="text"
                  value={localFormData.evictionDescription}
                  onChange={handleFieldChange('evictionDescription')}
                  placeholder="Describe eviction fees"
                  style={{ ...inlineInputStyle, width: '300px' }}
                  required
                />
              )}
            </label>
          </div>
          
          <div style={{ marginBottom: '15px', lineHeight: '1.8' }}>
            <label>
              <input
                type="checkbox"
                checked={localFormData.preparingPropertyEnabled}
                onChange={handleFieldChange('preparingPropertyEnabled')}
                style={checkboxStyle}
              />
              Preparing the Property for Leasing.{' '}
              {localFormData.preparingPropertyEnabled && (
                <input
                  type="text"
                  value={localFormData.preparingPropertyDescription}
                  onChange={handleFieldChange('preparingPropertyDescription')}
                  placeholder="Describe property preparation fees"
                  style={{ ...inlineInputStyle, width: '300px' }}
                  required
                />
              )}
            </label>
          </div>
          
          <div style={{ lineHeight: '1.8' }}>
            <label>
              <input
                type="checkbox"
                checked={localFormData.otherCompensationEnabled}
                onChange={handleFieldChange('otherCompensationEnabled')}
                style={checkboxStyle}
              />
              Other.{' '}
              {localFormData.otherCompensationEnabled && (
                <input
                  type="text"
                  value={localFormData.otherCompensationDescription}
                  onChange={handleFieldChange('otherCompensationDescription')}
                  placeholder="Describe other compensation"
                  style={{ ...inlineInputStyle, width: '300px' }}
                  required
                />
              )}
            </label>
          </div>
        </div>
      </div>
      
      {/* Section X - Sale of the Premises */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>X. SALE OF THE PREMISES</div>
        <div style={{ marginBottom: '15px' }}>
          In the event the Property is marketed to be sold by the Owner during the Term of this Agreement, the Agent:
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="saleRights"
                value="exclusive"
                checked={localFormData.saleRights === 'exclusive'}
                onChange={() => handleRadioChange('saleRights', 'exclusive')}
                style={checkboxStyle}
              />
              Shall have exclusive rights of representation under terms agreed upon in a separate listing agreement.
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="saleRights"
                value="none"
                checked={localFormData.saleRights === 'none'}
                onChange={() => handleRadioChange('saleRights', 'none')}
                style={checkboxStyle}
              />
              Shall NOT have any rights to sell the Property under any circumstance, terms, or conditions.
            </label>
          </div>
        </div>
      </div>
      
      {/* Section XI - Key-safe / Lockbox */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XI. KEY-SAFE / LOCKBOX</div>
        <div style={{ marginBottom: '15px' }}>The Owner:</div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="keySafeAuthorization"
                value="authorized"
                checked={localFormData.keySafeAuthorization === 'authorized'}
                onChange={() => handleRadioChange('keySafeAuthorization', 'authorized')}
                style={checkboxStyle}
              />
              Authorizes the use of a key-safe / lockbox to allow entry into the Property.
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="keySafeAuthorization"
                value="not_authorized"
                checked={localFormData.keySafeAuthorization === 'not_authorized'}
                onChange={() => handleRadioChange('keySafeAuthorization', 'not_authorized')}
                style={checkboxStyle}
              />
              Does NOT authorize the use of a key-safe / lockbox to allow entry into the Property.
            </label>
          </div>
        </div>
      </div>
      
      {/* Section XII - Repairs; Maintenance */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XII. REPAIRS; MAINTENANCE</div>
        <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
          The Owner hereby gives power to the Agent to supervise repairs, improvements, alterations, and decorations to the Property as well as purchase and pay bills for services and supplies. The Agent shall obtain prior approval of the Owner for all expenditures over ${' '}
          <input
            type="number"
            value={localFormData.repairApprovalAmount}
            onChange={handleFieldChange('repairApprovalAmount')}
            placeholder="Amount"
            style={{ ...inlineInputStyle, width: '100px' }}
            min="0"
            step="0.01"
          />
          {' '}for any single item.
        </div>
        
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          Prior approval for lesser amounts shall not be required for monthly or recurring operating charges or if emergency expenditures over the maximum are, in the Agent's opinion, needed to protect the Property from damage, prevent injury to persons, avoid suspension of necessary services, avoid penalties or fines, or suspension of services to tenants required by a lease or rental agreement or by law, including, but not limited to, maintaining the Property in a condition fit for human habitation as required by applicable law.
        </div>
      </div>
      
      {/* Section XIII - Lead-Based Paint */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XIII. LEAD-BASED PAINT</div>
        <div style={{ lineHeight: '1.6' }}>
          The Owner shall be responsible for providing information about the Property in regard to lead-based paint. It is understood that in accordance with 42 U.S. Code § 4852d that all occupants of residential property must be made aware of the existence of lead-based paint in residential dwellings built prior to January 1, 1978.
        </div>
      </div>
      
      {/* Section XIV - Financial Statements to Owner */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XIV. FINANCIAL STATEMENTS TO OWNER</div>
        <div style={{ lineHeight: '1.6' }}>
          The Agent shall render statements of receipts, expenses, and other charges for the Property as requested by the Owner with no more than one (1) statement per month.
        </div>
      </div>
      
      {/* Section XV - Other Compensation */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XV. OTHER COMPENSATION</div>
        <div style={{ lineHeight: '1.6' }}>
          Unless otherwise stated, this Agreement does not include the Agent's service of preparing the Property for sale or refinance, modernization, fire or major damage restoration, rehabilitation, financial accounting or legal advice, representation before public agencies, advising on proposed new construction, debt collection, counseling, attending any Association or Condominium meetings, and any other obligation not listed as a Service. If the Owner requests the Agent to perform services not included in this Agreement, a fee shall be agreed upon before such services are performed.
        </div>
      </div>
      
      {/* Section XVI - Equal Housing Opportunity */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XVI. EQUAL HOUSING OPPORTUNITY</div>
        <div style={{ lineHeight: '1.6' }}>
          The Property is offered in compliance with Federal, State, and local anti-discrimination laws.
        </div>
      </div>
      
      {/* Section XVII - Responsibilities of the Owner */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XVII. RESPONSIBILITIES OF THE OWNER</div>
        <div style={{ marginBottom: '15px' }}>The Owner agrees to:</div>
        
        <div style={{ paddingLeft: '20px' }}>
          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <strong>a.)</strong> Provide all documentation, records, and disclosures as required by law or required by the Agent to manage and operate the Property, and immediately notify the Agent if the Owner becomes aware of any change in such documentation, records or disclosures, or any matter affecting the habitability of the Property;
          </div>
          
          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <strong>b.)</strong> Indemnify, defend, and hold harmless the Agent, and all persons in the Agent's firm, regardless of responsibility, from all costs, expenses suits, liabilities, damages, attorneys fees, and claims of every type, including, but not limited to, those arising out of injury or death of any person, or damage to any real or personal property of any person, including the Owner, for:
            <div style={{ paddingLeft: '20px', marginTop: '10px' }}>
              <div style={{ marginBottom: '5px' }}><strong>1.</strong> Any repairs performed by the Owner or by others hired directly by the Owner; or</div>
              <div style={{ marginBottom: '10px' }}><strong>2.</strong> Those relating to the management, leasing, rental, security deposit, or operation of the Property by the Agent, or any person in the Agent's company, or the performance or exercise of any of the duties, powers, or authorities granted to the Agent.</div>
              <div style={{ fontSize: '14px', fontStyle: 'italic' }}>This sub-section, and all rights to the Agent's indemnification, shall be considered void if the Agent exemplifies any willful acts of gross negligence;</div>
            </div>
          </div>
          
          <div style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            <strong>c.)</strong> Maintain the Property in a condition fit for human habitation as required by applicable State and local laws;
          </div>
          
          <div style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            <strong>d.)</strong> Pay all interest on Tenants' security deposits if required by applicable laws;
          </div>
          
          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <strong>e.)</strong> Carry and pay for:
            <div style={{ paddingLeft: '20px', marginTop: '5px' }}>
              <div style={{ marginBottom: '5px' }}><strong>i.</strong> Public and premises liability insurance in an amount of no less than one-million dollars ($1,000,000.00); and</div>
              <div style={{ marginBottom: '5px' }}><strong>ii.</strong> Property damage and worker's compensation insurance adequate to protect the interests of the Owner and the Agent. The Agent shall be, and the Owner authorizes Agent to be, named as an additional insured party on the Owner's policies; and</div>
            </div>
          </div>
          
          <div style={{ lineHeight: '1.6' }}>
            <strong>f.)</strong> Pay any late charges, penalties and/or interest imposed by lenders or other parties for failure to make payment only if the failure is due to insufficient funds in the Agent's trust account available for such payment. In addition, the Owner agrees to replace any funds required if there are insufficient funds in the Agent's trust account to cover such responsibilities of the Owner.
          </div>
        </div>
      </div>
      
      {/* Section XVIII - Representations of the Owner */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XVIII. REPRESENTATIONS OF THE OWNER</div>
        <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          The Owner represents, unless otherwise specified in writing, to be unaware of the following:
        </div>
        
        <div style={{ paddingLeft: '20px' }}>
          <div style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            <strong>a.)</strong> Any recorded Notice of Default affecting the Property;
          </div>
          <div style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            <strong>b.)</strong> Any delinquent amounts due under any loan secured by the Owner or other obligations affecting the Property;
          </div>
          <div style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            <strong>c.)</strong> Any bankruptcy, insolvency, or similar proceeding affecting the Property;
          </div>
          <div style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            <strong>d.)</strong> Any litigation, arbitration, administrative action, government investigation, or other pending or threatened action that does or may affect the Property or Owner's ability to lease the Property or transfer possession of ownership; and
          </div>
          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <strong>e.)</strong> Any current, pending, or proposed special assessments affecting the Property.
          </div>
        </div>
        
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          The Owner shall promptly notify the Agent in writing if the Owner becomes aware of any of the aforementioned items in this Section during the Term of this Agreement.
        </div>
      </div>
      
      {/* Section XIX - Tax Withholding */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XIX. TAX WITHHOLDING</div>
        <div style={{ lineHeight: '1.6' }}>
          The Owner shall be responsible for all tax withholding and payments of revenues and incomes to local, State, and Federal authorities.
        </div>
      </div>
      
      {/* Section XX - Accordance with Federal and State Law */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XX. ACCORDANCE WITH FEDERAL AND STATE LAW</div>
        <div style={{ lineHeight: '1.6' }}>
          All services provided by the Agent shall comply with federal, State, or local law requiring the delivery of agreements, reports, notices, and/or the posting of signage or notices.
        </div>
      </div>
      
      {/* Section XXI - Evictions */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXI. EVICTIONS</div>
        <div style={{ lineHeight: '1.6' }}>
          The Owner hereby gives power to the Agent to sign and serve notices on the Owner's behalf and prosecute actions to evict tenants; recover possession of the Property; recover rents and other sums due; and, when expedient, settle, compromise and release claims, actions, and suits and/or reinstate tenancies.
        </div>
      </div>
      
      {/* Section XXII - Lease Alterations */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXII. LEASE ALTERATIONS</div>
        <div style={{ lineHeight: '1.6' }}>
          The Owner hereby gives power to the Agent to initiate, sign, renew, modify, or cancel rental agreements and leases for the Property, or any part thereof and collect and give receipts for rents, other fees, charges, and security deposits.
        </div>
      </div>
      
      {/* Section XXIII - Due Diligence */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXIII. DUE DILIGENCE</div>
        <div style={{ lineHeight: '1.6' }}>
          The Agent accepts the appointment of the Owner and agrees to use due diligence in the performance of this Agreement while furnishing their services to properly lease, maintain, and continue the operation and management of the Property.
        </div>
      </div>
      
      {/* Section XXIV - Trust Funds */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXIV. TRUST FUNDS</div>
        <div style={{ lineHeight: '1.6' }}>
          The Owner hereby gives power to the Agent to deposit all receipts collected for the Owner, less any sums properly deducted or disbursed, in a financial institution whose deposits are insured by an agency of the United States government. The funds shall be held in a trust account separate from the Agent's personal accounts. The Agent shall not be liable in the event of a bankruptcy or failure of a financial institution. All funds managed under this section must be done so in accordance with applicable law.
        </div>
      </div>
      
      {/* Section XXV - Advertising */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXV. ADVERTISING</div>
        <div style={{ lineHeight: '1.6' }}>
          The Owner grants the Agent the right to display "For Rent / Lease" and similar signage on the Property and advertise the availability of space through publications and online marketing methods.
        </div>
      </div>
      
      {/* Section XXVI - Hiring Contractors */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXVI. HIRING CONTRACTORS</div>
        <div style={{ lineHeight: '1.6' }}>
          The Owner hereby gives power to the Agent to contract, hire, supervise and/or discharge firms and persons, including utilities, required for the operation and maintenance of the Property. The Agent may perform any of the Agent's duties through attorneys, agents, employees, or independent contractors and, except for persons working in the Agent's firm, shall not be responsible for their acts, omissions, defaults, negligence and/or costs of same.
        </div>
      </div>
      
      {/* Section XXVII - Expense Payments */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXVII. EXPENSE PAYMENTS</div>
        <div style={{ lineHeight: '1.6' }}>
          The Owner hereby gives power to the Agent to pay expenses and costs for the Property from the Owner's funds held by the Agent, unless otherwise directed by the Owner. The expenses and costs may include, but are not limited to, property management compensation, fees and charges, expenses for goods and services, property taxes and other taxes, association or condominium dues, assessments, loan payments, and insurance premiums.
        </div>
      </div>
      
      {/* Section XXVIII - Tenant Fees */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXVIII. TENANT FEES</div>
        <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          Owner agrees that the Agent may receive and keep fees and charges from tenants for:
        </div>
        
        <div style={{ paddingLeft: '20px' }}>
          <div style={{ marginBottom: '8px', lineHeight: '1.6' }}>
            <strong>a.)</strong> Requesting an assignment of lease or sublease of the Property;
          </div>
          <div style={{ marginBottom: '8px', lineHeight: '1.6' }}>
            <strong>b.)</strong> Processing rental applications for credit and background checks;
          </div>
          <div style={{ marginBottom: '8px', lineHeight: '1.6' }}>
            <strong>c.)</strong> Returned (NSF) checks;
          </div>
          <div style={{ marginBottom: '8px', lineHeight: '1.6' }}>
            <strong>d.)</strong> Late payments; and
          </div>
          <div style={{ lineHeight: '1.6' }}>
            <strong>e.)</strong> Any other services that are not in conflict with this Agreement.
          </div>
        </div>
      </div>
      
      {/* Section XXIX - Agency Relationships */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXIX. AGENCY RELATIONSHIPS</div>
        <div style={{ lineHeight: '1.6' }}>
          If permitted by applicable law, the Owner hereby consents to the Agent acting as a dual agent for the Owner and any tenant(s) or buyer(s) resulting in a real estate transaction. The Owner understands that the Agent may have or obtain property management agreements on other properties and that potential tenants may consider, make offers on, or lease through the Agent property the same as or similar to the Property. The Owner consents to the Agent's representation of the other owners' properties before, during, and after the expiration of this Agreement.
        </div>
      </div>
      
      {/* Section XXX - Notices */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXX. NOTICES</div>
        <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          Any written notice to the Owner or the Agent required under this Agreement shall be served by sending such notice by Certified Mail with return receipt. Such notice shall be sent to the respective address in Section I of this Agreement unless written below:
        </div>
        
        <div style={{ display: 'flex', gap: '40px' }}>
          {/* Owner Notice Information */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>Owner:</div>
            <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
              Name:{' '}
              <input
                type="text"
                value={localFormData.ownerNoticeName}
                onChange={handleFieldChange('ownerNoticeName')}
                placeholder="Owner's Name"
                style={{ ...inlineInputStyle, width: '200px' }}
              />
            </div>
            <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
              Address:{' '}
              <input
                type="text"
                value={localFormData.ownerNoticeAddress}
                onChange={handleFieldChange('ownerNoticeAddress')}
                placeholder="Owner's Address"
                style={{ ...inlineInputStyle, width: '186px' }}
              />
            </div>
            <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
              Phone:{' '}
              <input
                type="tel"
                value={localFormData.ownerNoticePhone}
                onChange={handleFieldChange('ownerNoticePhone')}
                placeholder="Phone Number"
                style={{ ...inlineInputStyle, width: '198px' }}
              />
            </div>
            <div style={{ lineHeight: '1.8' }}>
              E-Mail:{' '}
              <input
                type="email"
                value={localFormData.ownerNoticeEmail}
                onChange={handleFieldChange('ownerNoticeEmail')}
                placeholder="Email Address"
                style={{ ...inlineInputStyle, width: '200px' }}
              />
            </div>
          </div>
          
          {/* Agent Notice Information */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>Agent:</div>
            <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
              Name:{' '}
              <input
                type="text"
                value={localFormData.agentNoticeName}
                onChange={handleFieldChange('agentNoticeName')}
                placeholder="Agent's Name"
                style={{ ...inlineInputStyle, width: '200px' }}
              />
            </div>
            <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
              Address:{' '}
              <input
                type="text"
                value={localFormData.agentNoticeAddress}
                onChange={handleFieldChange('agentNoticeAddress')}
                placeholder="Agent's Address"
                style={{ ...inlineInputStyle, width: '186px' }}
              />
            </div>
            <div style={{ marginBottom: '10px', lineHeight: '1.8' }}>
              Phone:{' '}
              <input
                type="tel"
                value={localFormData.agentNoticePhone}
                onChange={handleFieldChange('agentNoticePhone')}
                placeholder="Phone Number"
                style={{ ...inlineInputStyle, width: '198px' }}
              />
            </div>
            <div style={{ lineHeight: '1.8' }}>
              E-Mail:{' '}
              <input
                type="email"
                value={localFormData.agentNoticeEmail}
                onChange={handleFieldChange('agentNoticeEmail')}
                placeholder="Email Address"
                style={{ ...inlineInputStyle, width: '200px' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Section XXXI - Arbitration */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXXI. ARBITRATION</div>
        <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          All disputes arising under this agreement shall be governed by and interpreted in accordance with the Governing Law in Section XXXIII, without regard to principles of conflict of laws. The Parties to this agreement will submit all disputes arising under this agreement to arbitration before a single arbitrator of the American Arbitration Association ("AAA"). The arbitrator shall be selected by application of the rules of the AAA, or by mutual agreement of the Parties, except that such arbitrator shall be an attorney admitted to practice under the State of Governing Law. No Party to this agreement will challenge the jurisdiction or venue provisions as provided in this section. Nothing contained herein shall prevent the Party from obtaining an injunction.
        </div>
        
        <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          The following matters shall be excluded from arbitration hereunder:
        </div>
        
        <div style={{ paddingLeft: '20px', marginBottom: '15px' }}>
          <div style={{ marginBottom: '8px', lineHeight: '1.6' }}>
            <strong>a.)</strong> A judicial or non-judicial foreclosure or other action proceeding to enforce a deed of trust or mortgage;
          </div>
          <div style={{ marginBottom: '8px', lineHeight: '1.6' }}>
            <strong>b.)</strong> An unlawful detainer action;
          </div>
          <div style={{ marginBottom: '8px', lineHeight: '1.6' }}>
            <strong>c.)</strong> The filing or enforcement of a mechanic's lien; and
          </div>
          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <strong>d.)</strong> Any matter that is within the jurisdiction of a court of probate, small claims, and/or bankruptcy.
          </div>
        </div>
        
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          The filing of a court action to enable the recording of a notice of pending action for an order of attachment, receivership, injunction, or other provisional remedies shall not constitute a waiver of this Section.
        </div>
      </div>
      
      {/* Section XXXII - Attorney Fees */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXXII. ATTORNEY FEES</div>
        <div style={{ lineHeight: '1.6' }}>
          In any action, proceeding, or arbitration between the Owner and the Agent regarding the obligation to pay compensation under this Agreement, the prevailing Owner or Agent shall be entitled to reasonable attorneys' fees and costs from the non-prevailing Owner or Agent, except as provided in Section XXXI.
        </div>
      </div>
      
      {/* Section XXXIII - Governing Law */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXXIII. GOVERNING LAW</div>
        <div style={{ lineHeight: '1.6' }}>
          This Agreement shall be governed under the laws in the State where the Property is located ("Governing Law").
        </div>
      </div>
      
      {/* Section XXXIV - Additional Terms & Conditions */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXXIV. ADDITIONAL TERMS & CONDITIONS</div>
        <textarea
          value={localFormData.additionalTerms}
          onChange={handleFieldChange('additionalTerms')}
          placeholder="Enter any additional terms and conditions here..."
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px',
            lineHeight: '1.6',
            resize: 'vertical'
          }}
        />
      </div>
      
      {/* Section XXXV - Entire Agreement */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>XXXV. ENTIRE AGREEMENT</div>
        <div style={{ lineHeight: '1.6' }}>
          This Agreement contains all the terms agreed to by the Parties relating to its subject matter including any attachments or addendums. This Agreement replaces all previous discussions, understandings, and oral agreements. The Owner and Agent agree to the terms and conditions and shall be bound until the end of the Term.
        </div>
      </div>
      
      {/* Signature Section */}
      <div style={{ 
        ...sectionStyle, 
        backgroundColor: '#ffffff', 
        border: '2px solid #2d3748',
        marginTop: '40px'
      }}>
        <div style={{ 
          ...sectionTitleStyle, 
          textAlign: 'center', 
          fontSize: '18px', 
          marginBottom: '25px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          SIGNATURES
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          fontWeight: '500', 
          marginBottom: '40px', 
          fontSize: '14px',
          lineHeight: '1.6',
          fontStyle: 'italic',
          color: '#4a5568'
        }}>
          IN WITNESS WHEREOF, the Parties have indicated their acceptance of the terms of this Agreement by their signatures below on the dates indicated.
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '80px',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {/* Owner Signature */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '20px', 
              fontSize: '16px',
              color: '#2d3748'
            }}>
              OWNER
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <input
                type="text"
                value={localFormData.ownerSignature}
                onChange={handleFieldChange('ownerSignature')}
                placeholder="Sign your name here"
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '2px solid #2d3748',
                  backgroundColor: 'transparent',
                  fontSize: '18px',
                  textAlign: 'center',
                  outline: 'none',
                  marginBottom: '8px'
                }}
              />
              <div style={{ 
                fontSize: '12px', 
                color: '#666',
                marginTop: '5px',
                fontWeight: '500'
              }}>
                Owner's Signature
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px',
              alignItems: 'center'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: '500', minWidth: '50px' }}>Date:</span>
                <input
                  type="date"
                  value={localFormData.ownerSignatureDate}
                  onChange={handleFieldChange('ownerSignatureDate')}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '150px'
                  }}
                />
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: '500', minWidth: '50px' }}>Print:</span>
                <input
                  type="text"
                  value={localFormData.ownerPrintName}
                  onChange={handleFieldChange('ownerPrintName')}
                  placeholder="Print full name"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '180px'
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Agent Signature */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '20px', 
              fontSize: '16px',
              color: '#2d3748'
            }}>
              AGENT
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <input
                type="text"
                value={localFormData.agentSignature}
                onChange={handleFieldChange('agentSignature')}
                placeholder="Sign your name here"
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '2px solid #2d3748',
                  backgroundColor: 'transparent',
                  fontSize: '18px',
                  textAlign: 'center',
                  outline: 'none',
                  marginBottom: '8px'
                }}
              />
              <div style={{ 
                fontSize: '12px', 
                color: '#666',
                marginTop: '5px',
                fontWeight: '500'
              }}>
                Agent's Signature
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px',
              alignItems: 'center'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: '500', minWidth: '50px' }}>Date:</span>
                <input
                  type="date"
                  value={localFormData.agentSignatureDate}
                  onChange={handleFieldChange('agentSignatureDate')}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '150px'
                  }}
                />
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: '500', minWidth: '50px' }}>Print:</span>
                <input
                  type="text"
                  value={localFormData.agentPrintName}
                  onChange={handleFieldChange('agentPrintName')}
                  placeholder="Print full name"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '180px'
                  }}
                />
              </div>
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
          This agreement is legally binding when signed by both parties.
        </div>
      </div>
      
    </FormWrapper>
  );
};

export default PropertyManagementForm;
