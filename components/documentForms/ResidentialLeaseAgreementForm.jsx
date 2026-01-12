'use client';
import React, { useState, useEffect } from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';

const ResidentialLeaseAgreementForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const [localFormData, setLocalFormData] = useState({
    // Agreement Date
    agreementDay: '',
    agreementMonth: '',
    agreementYear: '',
    
    // Landlord Information
    landlordName: '',
    landlordMailingAddress: '',
    landlordCity: '',
    landlordState: '',
    
    // Tenant Information
    tenantNames: '',
    
    // Property Information
    propertyMailingAddress: '',
    residenceType: '',
    residenceTypeOther: '',
    bedrooms: '',
    bathrooms: '',
    
    // Term Information
    leaseType: 'fixed', // 'fixed' or 'month-to-month'
    fixedLeaseStartDate: '',
    fixedLeaseEndDate: '',
    monthToMonthStartDate: '',
    monthToMonthNoticeDays: '',
    leaseEndOption: 'continue', // 'continue' or 'vacate'
    
    // Rent Information
    monthlyRent: '',
    rentDueDay: '',
    rentPaymentInstructions: '',
    
    // Security Deposit
    securityDepositRequired: 'yes', // 'yes' or 'no'
    securityDepositAmount: '',
    securityDepositReturnDays: '',
    
    // Utilities
    utilitiesProvided: '',
    
    // Occupants
    hasOccupants: 'no', // 'yes' or 'no'
    occupantNames: '',
    
    // Purpose
    purposeType: 'residential', // 'residential' or 'mixed'
    purposeAdditional: '',
    
    // Furnishings
    isFurnished: 'no', // 'yes' or 'no'
    furnishingsList: '',
    
    // Appliances
    appliancesProvided: 'no', // 'yes' or 'no'
    appliancesList: '',
    
    // NSF Checks
    nsfFeeCharged: 'yes', // 'yes' or 'no'
    nsfFeeAmount: '',
    
    // Late Fee
    lateFeeCharged: 'yes', // 'yes' or 'no'
    lateFeeAmount: '',
    lateFeeType: 'one-time', // 'one-time' or 'daily'
    lateFeeGraceDays: '',
    
    // First Month's Rent
    firstMonthRentDue: 'execution', // 'execution' or 'first-day'
    
    // Pre-Payment
    prePaymentRequired: 'no', // 'yes' or 'no'
    prePaymentAmount: '',
    prePaymentStartDate: '',
    prePaymentEndDate: '',
    
    // Proration
    prorationRequired: 'no', // 'yes' or 'no'
    prorationDate: '',
    prorationAmount: '',
    
    // Move-In Inspection
    moveInInspection: 'yes', // 'yes' or 'no'
    
    // Additional sections for complete lease agreement
    // Section 16: Parking
    parkingProvided: 'no', // 'yes' or 'no'
    parkingSpaces: '',
    parkingFee: '',
    parkingFeePayment: 'execution', // 'execution' or 'monthly'
    parkingDescription: '',
    
    // Section 17: Sale of Property
    newOwnerCanTerminate: 'yes', // 'yes' or 'no'
    saleTerminationDays: '',
    
    // Section 18: Early Termination
    earlyTerminationAllowed: 'no', // 'yes' or 'no'
    earlyTerminationDays: '',
    earlyTerminationFee: '',
    
    // Section 19: Smoking Policy
    smokingPolicy: 'prohibited', // 'permitted' or 'prohibited'
    smokingAreas: '',
    
    // Section 20: Pets
    petsAllowed: 'no', // 'yes' or 'no'
    maxPets: '',
    petTypes: '',
    maxPetWeight: '',
    petFee: '',
    petFeeType: 'non-refundable', // 'non-refundable' or 'refundable'
    
    // Section 21: Waterbeds
    waterbedsAllowed: 'no', // 'yes' or 'no'
    
    // Section 22: Notices
    landlordAgentAddress: '',
    tenantMailingAddress: 'premises', // 'premises' or 'other'
    tenantOtherAddress: '',
    
    // Section 23: Agent/Manager
    hasManager: 'no', // 'yes' or 'no'
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    landlordPhone: '',
    landlordEmail: '',
    
    // Section 46: Lead Paint
    leadPaintDisclosure: 'not-built-1978', // 'built-before-1978' or 'not-built-1978'
    
    // Section 48: Additional Terms & Conditions
    additionalTerms: '',
    
    // Amount Due at Signing Summary
    amountDueSecurityDeposit: '',
    amountDueFirstMonthRent: '',
    amountDueParkingFee: '',
    amountDuePetFees: '',
    amountDuePrePayment: '',
    amountDueProration: '',
    amountDueTotal: '',
    
    // Lead Paint Disclosure - Comprehensive
    leadPaintKnownPresent: 'no', // 'yes' or 'no'
    leadPaintKnownExplanation: '',
    leadPaintNoKnowledge: 'yes', // 'yes' or 'no'
    leadPaintRecordsAvailable: 'no', // 'yes' or 'no'
    leadPaintRecordsList: '',
    leadPaintNoRecords: 'yes', // 'yes' or 'no'
    leadPaintTenantReceivedInfo: false,
    leadPaintTenantReceivedPamphlet: false,
    leadPaintBrokerInformed: false,
    
    ...formData
  });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    onFormDataChange(localFormData);
  }, [localFormData, onFormDataChange]);

  useEffect(() => {
    const requiredFields = [
      'landlordName', 'tenantNames', 'propertyMailingAddress', 'monthlyRent', 
      'rentDueDay'
    ];
    const valid = requiredFields.every(field => localFormData[field]);
    setIsValid(valid);
  }, [localFormData]);

  const handleFieldChange = (field) => (e) => {
    setLocalFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCheckboxChange = (field) => (e) => {
    setLocalFormData(prev => ({ ...prev, [field]: e.target.checked }));
  };

  const handleRadioChange = (field, value) => {
    setLocalFormData(prev => {
      const updates = { [field]: value };
      
      // Handle mutually exclusive pairs for Lead Paint Disclosure
      if (field === 'leadPaintKnownPresent' && value === 'yes') {
        updates.leadPaintNoKnowledge = 'no';
      } else if (field === 'leadPaintNoKnowledge' && value === 'yes') {
        updates.leadPaintKnownPresent = 'no';
      } else if (field === 'leadPaintRecordsAvailable' && value === 'yes') {
        updates.leadPaintNoRecords = 'no';
      } else if (field === 'leadPaintNoRecords' && value === 'yes') {
        updates.leadPaintRecordsAvailable = 'no';
      }
      
      return { ...prev, ...updates };
    });
  };

  const inputStyle = {
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '14px',
    fontFamily: 'inherit'
  };

  return (
    <FormWrapper 
      title="Residential Lease Agreement" 
      subtitle="Complete this residential lease agreement"
      onProceed={() => isValid && onProceed()} 
      isValid={isValid}
    >
      <div style={{ marginBottom: '30px' }}>
        
        
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>This Residential Lease Agreement ("Agreement") made this</span>
          <input
            type="number"
            value={localFormData.agreementDay}
            onChange={handleFieldChange('agreementDay')}
            placeholder="Day"
            min="1"
            max="31"
            style={{ ...inputStyle, width: '60px' }}
            required
          />
          <span>day of</span>
          <input
            type="text"
            value={localFormData.agreementMonth}
            onChange={handleFieldChange('agreementMonth')}
            placeholder="Month"
            style={{ ...inputStyle, minWidth: '120px' }}
            required
          />
          <span>, 20</span>
          <input
            type="number"
            value={localFormData.agreementYear}
            onChange={handleFieldChange('agreementYear')}
            placeholder="YY"
            min="24"
            max="50"
            style={{ ...inputStyle, width: '60px' }}
            required
          />
          <span>is between</span>
          <input
            type="text"
            value={localFormData.landlordName}
            onChange={handleFieldChange('landlordName')}
            placeholder="Landlord's name"
            style={{ ...inputStyle, minWidth: '250px', flex: '1' }}
            required
          />
          <span>("Landlord")</span>
        </div>
        
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>with a mailing address of</span>
          <input
            type="text"
            value={localFormData.landlordMailingAddress}
            onChange={handleFieldChange('landlordMailingAddress')}
            placeholder="Landlord's complete mailing address"
            style={{ ...inputStyle, minWidth: '300px', flex: '1' }}
          />
          <span>, City of</span>
          <input
            type="text"
            value={localFormData.landlordCity}
            onChange={handleFieldChange('landlordCity')}
            placeholder="City"
            style={{ ...inputStyle, minWidth: '120px' }}
          />
          <span>, State of</span>
          <input
            type="text"
            value={localFormData.landlordState}
            onChange={handleFieldChange('landlordState')}
            placeholder="State"
            style={{ ...inputStyle, minWidth: '100px' }}
          />
        </div>
        
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>AND</span>
          <input
            type="text"
            value={localFormData.tenantNames}
            onChange={handleFieldChange('tenantNames')}
            placeholder="Tenant(s) names"
            style={{ ...inputStyle, minWidth: '300px', flex: '1' }}
            required
          />
          <span>("Tenant(s)").</span>
        </div>
        
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          Landlord and Tenant are each referred to herein as a "Party" and, collectively, as the "Parties."
        </p>
        
        <p style={{ marginBottom: '30px', lineHeight: '1.6', fontWeight: '600' }}>
          NOW, THEREFORE, FOR AND IN CONSIDERATION of the mutual promises and agreements contained herein, the Tenant agrees to lease the Premises from the Landlord under the following terms and conditions:
        </p>
      </div>

      {/* Section 1: Property */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '10px' }}>1. Property: The Landlord agrees to lease the described property below to the Tenant:</h5>
        
        
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span><strong>a) Mailing Address:</strong></span>
          <input
            type="text"
            value={localFormData.propertyMailingAddress}
            onChange={handleFieldChange('propertyMailingAddress')}
            placeholder="Property mailing address"
            style={{ ...inputStyle, minWidth: '400px', flex: '1' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span><strong>b) Residence Type:</strong></span>
          <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
            <input
              type="checkbox"
              checked={localFormData.residenceType === 'apartment'}
              onChange={() => handleRadioChange('residenceType', 'apartment')}
              style={{ marginRight: '4px' }}
            />
            <span>Apartment</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
            <input
              type="checkbox"
              checked={localFormData.residenceType === 'house'}
              onChange={() => handleRadioChange('residenceType', 'house')}
              style={{ marginRight: '4px' }}
            />
            <span>House</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
            <input
              type="checkbox"
              checked={localFormData.residenceType === 'condo'}
              onChange={() => handleRadioChange('residenceType', 'condo')}
              style={{ marginRight: '4px' }}
            />
            <span>Condo</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
            <input
              type="checkbox"
              checked={localFormData.residenceType === 'other'}
              onChange={() => handleRadioChange('residenceType', 'other')}
              style={{ marginRight: '4px' }}
            />
            <span>Other:</span>
          </label>
          {localFormData.residenceType === 'other' && (
            <input
              type="text"
              value={localFormData.residenceTypeOther}
              onChange={handleFieldChange('residenceTypeOther')}
              placeholder="Specify"
              style={{ ...inputStyle, width: '120px', marginLeft: '8px' }}
            />
          )}
        </div>
        
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span><strong>c) Bedroom(s):</strong></span>
          <input
            type="number"
            value={localFormData.bedrooms}
            onChange={handleFieldChange('bedrooms')}
            placeholder="#"
            style={{ ...inputStyle, width: '60px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span><strong>d) Bathroom(s):</strong></span>
          <input
            type="number"
            value={localFormData.bathrooms}
            onChange={handleFieldChange('bathrooms')}
            placeholder="#"
            style={{ ...inputStyle, width: '60px' }}
          />
        </div>
        
        <p style={{ marginTop: '15px', lineHeight: '1.6' }}>
          The aforementioned property shall be leased wholly by the Tenant ("Premises").
        </p>
      </div>

      {/* Section 2: Term */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>2. Term: This Agreement shall be considered (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.leaseType === 'fixed'}
                onChange={() => handleRadioChange('leaseType', 'fixed')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <span>Fixed Lease. The Tenant shall be allowed to occupy the Premises starting on</span>
                  <input
                    type="date"
                    value={localFormData.fixedLeaseStartDate}
                    onChange={handleFieldChange('fixedLeaseStartDate')}
                    style={{ ...inputStyle, minWidth: '150px' }}
                    disabled={localFormData.leaseType !== 'fixed'}
                  />
                  <span>and end on</span>
                  <input
                    type="date"
                    value={localFormData.fixedLeaseEndDate}
                    onChange={handleFieldChange('fixedLeaseEndDate')}
                    style={{ ...inputStyle, minWidth: '150px' }}
                    disabled={localFormData.leaseType !== 'fixed'}
                  />
                  <span>("Lease Term").</span>
                </div>
                <div style={{ marginLeft: '20px' }}>
                  <p style={{ marginBottom: '10px' }}>At the end of the Lease Term and no renewal is made, the Tenant: (check one)</p>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={localFormData.leaseEndOption === 'continue'}
                      onChange={() => handleRadioChange('leaseEndOption', 'continue')}
                      style={{ marginRight: '4px', marginBottom:'22px' }}
                      disabled={localFormData.leaseType !== 'fixed'}
                    />
                    <span>May continue to lease the Premises under the same terms of this Agreement under a month-to-month arrangement.</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={localFormData.leaseEndOption === 'vacate'}
                      onChange={() => handleRadioChange('leaseEndOption', 'vacate')}
                      style={{ marginRight: '4px' }}
                      disabled={localFormData.leaseType !== 'fixed'}
                    />
                    <span>Must vacate the Premises.</span>
                  </label>
                </div>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.leaseType === 'month-to-month'}
                onChange={() => handleRadioChange('leaseType', 'month-to-month')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>Month-to-Month Lease. The Tenant shall be allowed to occupy the Premises on a month-to-month arrangement starting on</span>
                <input
                  type="date"
                  value={localFormData.monthToMonthStartDate}
                  onChange={handleFieldChange('monthToMonthStartDate')}
                  style={{ ...inputStyle, minWidth: '150px' }}
                  disabled={localFormData.leaseType !== 'month-to-month'}
                />
                <span>and ending upon notice of</span>
                <input
                  type="number"
                  value={localFormData.monthToMonthNoticeDays}
                  onChange={handleFieldChange('monthToMonthNoticeDays')}
                  placeholder="Days"
                  style={{ ...inputStyle, width: '60px' }}
                  disabled={localFormData.leaseType !== 'month-to-month'}
                />
                <span>days from either Party to the other Party ("Lease Term").</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Section 3: Rent */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>3. Rent:</h5>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>The Tenant shall pay the Landlord, in equal monthly installments, $</span>
          <input
            type="number"
            value={localFormData.monthlyRent}
            onChange={handleFieldChange('monthlyRent')}
            placeholder="0.00"
            style={{ ...inputStyle, minWidth: '100px' }}
            required
          />
          <span>("Rent"). The Rent shall be due on the</span>
          <input
            type="number"
            value={localFormData.rentDueDay}
            onChange={handleFieldChange('rentDueDay')}
            placeholder="Day"
            min="1"
            max="31"
            style={{ ...inputStyle, width: '60px' }}
            required
          />
          <span>of every month ("Due Date") and paid under the following instructions:</span>
        </div>
        <input
          type="text"
          value={localFormData.rentPaymentInstructions}
          onChange={handleFieldChange('rentPaymentInstructions')}
          placeholder="Payment instructions (e.g., check payable to, online portal, etc.)"
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      {/* Section 4: Security Deposit */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>4. Security Deposit: As part of this Agreement: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.securityDepositRequired === 'yes'}
                onChange={() => handleRadioChange('securityDepositRequired', 'yes')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>The Landlord requires a payment in the amount of $</span>
                <input
                  type="number"
                  value={localFormData.securityDepositAmount}
                  onChange={handleFieldChange('securityDepositAmount')}
                  placeholder="0.00"
                  style={{ ...inputStyle, minWidth: '100px' }}
                  disabled={localFormData.securityDepositRequired !== 'yes'}
                />
                <span>("Security Deposit") for the faithful performance of the Tenant under the terms and conditions of this Agreement. Payment of the Security Deposit is required by the Tenant upon the execution of this Agreement. The Security Deposit shall be returned to the Tenant within</span>
                <input
                  type="number"
                  value={localFormData.securityDepositReturnDays}
                  onChange={handleFieldChange('securityDepositReturnDays')}
                  placeholder="Days"
                  style={{ ...inputStyle, width: '60px' }}
                  disabled={localFormData.securityDepositRequired !== 'yes'}
                />
                <span>days after the end of the Lease Term less any itemized deductions. This Security Deposit shall not be credited towards any Rent unless the Landlord gives their written consent.</span>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.securityDepositRequired === 'no'}
                onChange={() => handleRadioChange('securityDepositRequired', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>The Landlord does not require a Security Deposit as part of this Agreement.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 5: Utilities */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>5. Utilities:</h5>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>The Landlord shall provide the following utilities and services to the Tenant:</span>
        </div>
        <textarea
          value={localFormData.utilitiesProvided}
          onChange={handleFieldChange('utilitiesProvided')}
          placeholder="List utilities and services provided by landlord (e.g., water, electricity, gas, internet, cable, trash collection, etc.)"
          style={{ ...inputStyle, width: '100%', minHeight: '80px', resize: 'vertical', marginBottom: '15px' }}
        />
        <p style={{ lineHeight: '1.6' }}>
          Any other utilities or services not mentioned will be the responsibility of the Tenant.
        </p>
      </div>

      {/* Section 6: Occupants */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>6. Occupants: The Premises is to be occupied strictly as a residential dwelling with the following individual(s) in addition to the Tenant: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.hasOccupants === 'yes'}
                onChange={() => handleRadioChange('hasOccupants', 'yes')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                
                <input
                  type="text"
                  value={localFormData.occupantNames}
                  onChange={handleFieldChange('occupantNames')}
                  placeholder="List names of all occupants"
                  style={{ ...inputStyle, minWidth: '300px', flex: '1' }}
                  disabled={localFormData.hasOccupants !== 'yes'}
                />
                <span>("Occupant(s)")</span>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.hasOccupants === 'no'}
                onChange={() => handleRadioChange('hasOccupants', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>There are no Occupant(s).</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 7: Purpose */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>7. Purpose: The Tenant and Occupant(s) may only use the Premises as: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.purposeType === 'residential'}
                onChange={() => handleRadioChange('purposeType', 'residential')}
                style={{ marginRight: '8px' }}
              />
              <span>A residential dwelling only.</span>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.purposeType === 'mixed'}
                onChange={() => handleRadioChange('purposeType', 'mixed')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>A residential dwelling and:</span>
                <input
                  type="text"
                  value={localFormData.purposeAdditional}
                  onChange={handleFieldChange('purposeAdditional')}
                  placeholder="Specify additional use"
                  style={{ ...inputStyle, minWidth: '200px', flex: '1' }}
                  disabled={localFormData.purposeType !== 'mixed'}
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Section 8: Furnishings */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>8. Furnishings: The Premises is: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.isFurnished === 'yes'}
                onChange={() => handleRadioChange('isFurnished', 'yes')}
                style={{ marginRight: '8px', marginTop: '9px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>To be furnished with the following items:</span>
                <input
                  type="text"
                  value={localFormData.furnishingsList}
                  onChange={handleFieldChange('furnishingsList')}
                  placeholder="List all furnished items"
                  style={{ ...inputStyle, minWidth: '300px', flex: '1' }}
                  disabled={localFormData.isFurnished !== 'yes'}
                />
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.isFurnished === 'no'}
                onChange={() => handleRadioChange('isFurnished', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>Not furnished.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 9: Appliances */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>9. Appliances: The Landlord shall: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.appliancesProvided === 'yes'}
                onChange={() => handleRadioChange('appliancesProvided', 'yes')}
                style={{ marginRight: '8px', marginTop: '9px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>Provide the following appliances:</span>
                <input
                  type="text"
                  value={localFormData.appliancesList}
                  onChange={handleFieldChange('appliancesList')}
                  placeholder="List all appliances provided"
                  style={{ ...inputStyle, minWidth: '300px', flex: '1' }}
                  disabled={localFormData.appliancesProvided !== 'yes'}
                />
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.appliancesProvided === 'no'}
                onChange={() => handleRadioChange('appliancesProvided', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>Not provide any appliances.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 10: Non-Sufficient Funds (NSF Checks) */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>10. Non-Sufficient Funds (NSF Checks): If the Tenant pays the Rent with a check that is not honored due to insufficient funds (NSF): (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.nsfFeeCharged === 'yes'}
                onChange={() => handleRadioChange('nsfFeeCharged', 'yes')}
                style={{ marginRight: '8px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>There shall be a fee of $</span>
                <input
                  type="number"
                  value={localFormData.nsfFeeAmount}
                  onChange={handleFieldChange('nsfFeeAmount')}
                  placeholder="0.00"
                  style={{ ...inputStyle, width: '80px' }}
                  disabled={localFormData.nsfFeeCharged !== 'yes'}
                />
                <span>per incident.</span>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.nsfFeeCharged === 'no'}
                onChange={() => handleRadioChange('nsfFeeCharged', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>There shall be no fee.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 11: Late Fee */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>11. Late Fee: If Rent is not paid on the Due Date: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.lateFeeCharged === 'yes'}
                onChange={() => handleRadioChange('lateFeeCharged', 'yes')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <span>There shall be a penalty of $</span>
                  <input
                    type="number"
                    value={localFormData.lateFeeAmount}
                    onChange={handleFieldChange('lateFeeAmount')}
                    placeholder="0.00"
                    style={{ ...inputStyle, width: '80px' }}
                    disabled={localFormData.lateFeeCharged !== 'yes'}
                  />
                  <span>due as</span>
                  <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                    <input
                      type="checkbox"
                      checked={localFormData.lateFeeType === 'one-time'}
                      onChange={() => handleRadioChange('lateFeeType', 'one-time')}
                      style={{ marginRight: '4px' }}
                      disabled={localFormData.lateFeeCharged !== 'yes'}
                    />
                    <span> One (1) Time Payment</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                    <input
                      type="checkbox"
                      checked={localFormData.lateFeeType === 'daily'}
                      onChange={() => handleRadioChange('lateFeeType', 'daily')}
                      style={{ marginRight: '4px' }}
                      disabled={localFormData.lateFeeCharged !== 'yes'}
                    />
                    <span> Every Day Rent is Late</span>
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Rent is considered late when it has not been paid within</span>
                  <input
                    type="number"
                    value={localFormData.lateFeeGraceDays}
                    onChange={handleFieldChange('lateFeeGraceDays')}
                    placeholder="Days"
                    style={{ ...inputStyle, width: '60px' }}
                    disabled={localFormData.lateFeeCharged !== 'yes'}
                  />
                  <span>day(s) after the Due Date.</span>
                </div>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.lateFeeCharged === 'no'}
                onChange={() => handleRadioChange('lateFeeCharged', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>There shall be No Late Fee if Rent is late.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 12: First (1st) Month's Rent */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>12. First (1st) Month's Rent: The Tenant is required to pay the first (1st) month's rent: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.firstMonthRentDue === 'execution'}
                onChange={() => handleRadioChange('firstMonthRentDue', 'execution')}
                style={{ marginRight: '8px' }}
              />
              <span>Upon the execution of this Agreement.</span>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.firstMonthRentDue === 'first-day'}
                onChange={() => handleRadioChange('firstMonthRentDue', 'first-day')}
                style={{ marginRight: '8px' }}
              />
              <span>Upon the first (1st) day of the Lease Term.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 13: Pre-Payment */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>13. Pre-Payment: The Tenant shall: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.prePaymentRequired === 'yes'}
                onChange={() => handleRadioChange('prePaymentRequired', 'yes')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <span>Pre-Pay Rent in the amount of $</span>
                  <input
                    type="number"
                    value={localFormData.prePaymentAmount}
                    onChange={handleFieldChange('prePaymentAmount')}
                    placeholder="0.00"
                    style={{ ...inputStyle, minWidth: '100px' }}
                    disabled={localFormData.prePaymentRequired !== 'yes'}
                  />
                  <span>for the term starting on</span>
                  <input
                    type="date"
                    value={localFormData.prePaymentStartDate}
                    onChange={handleFieldChange('prePaymentStartDate')}
                    style={{ ...inputStyle, minWidth: '150px' }}
                    disabled={localFormData.prePaymentRequired !== 'yes'}
                  />
                  <span>and ending on</span>
                  <input
                    type="date"
                    value={localFormData.prePaymentEndDate}
                    onChange={handleFieldChange('prePaymentEndDate')}
                    style={{ ...inputStyle, minWidth: '150px' }}
                    disabled={localFormData.prePaymentRequired !== 'yes'}
                  />
                </div>
                <p style={{ margin: '5px 0' }}>The Pre-Payment of Rent shall be due upon the execution of this Agreement.</p>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.prePaymentRequired === 'no'}
                onChange={() => handleRadioChange('prePaymentRequired', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>Not be required to Pre-Pay Rent.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 14: Proration Period */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>14. Proration Period: The Tenant: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.prorationRequired === 'yes'}
                onChange={() => handleRadioChange('prorationRequired', 'yes')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <span>Shall take possession of the Premises before the start of the Lease Term on</span>
                  <input
                    type="date"
                    value={localFormData.prorationDate}
                    onChange={handleFieldChange('prorationDate')}
                    style={{ ...inputStyle, minWidth: '150px' }}
                    disabled={localFormData.prorationRequired !== 'yes'}
                  />
                  <span>and agrees to pay $</span>
                  <input
                    type="number"
                    value={localFormData.prorationAmount}
                    onChange={handleFieldChange('prorationAmount')}
                    placeholder="0.00"
                    style={{ ...inputStyle, minWidth: '100px' }}
                    disabled={localFormData.prorationRequired !== 'yes'}
                  />
                  <span>for the proration period.</span>
                </div>
                <p style={{ margin: '5px 0' }}>The proration rate is calculated by the monthly Rent on a daily basis which shall be paid by the Tenant upon the execution of this Agreement.</p>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.prorationRequired === 'no'}
                onChange={() => handleRadioChange('prorationRequired', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>Shall not be taking possession of the Premises before the Lease Term.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 15: Move-In Inspection */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>15. Move-In Inspection: Before, at the time of the Tenant accepting possession, or shortly thereafter, the Landlord and Tenant: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.moveInInspection === 'yes'}
                onChange={() => handleRadioChange('moveInInspection', 'yes')}
                style={{ marginRight: '8px', marginBottom:'20px' }}
              />
              <span>Agree to inspect the Premises and write any present damages or needed repairs on a move-in checklist.</span>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.moveInInspection === 'no'}
                onChange={() => handleRadioChange('moveInInspection', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>Shall not inspect the Premises or complete a move-in checklist.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 16: Parking */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>16. Parking: The Landlord: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.parkingProvided === 'yes'}
                onChange={() => handleRadioChange('parkingProvided', 'yes')}
                style={{ marginRight: '8px', marginTop: '8px' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <span>Shall provide</span>
                  <input
                    type="number"
                    value={localFormData.parkingSpaces}
                    onChange={handleFieldChange('parkingSpaces')}
                    placeholder="#"
                    style={{ ...inputStyle, width: '60px' }}
                    disabled={localFormData.parkingProvided !== 'yes'}
                  />
                  <span>parking space(s) to the Tenant for a fee of $</span>
                  <input
                    type="number"
                    value={localFormData.parkingFee}
                    onChange={handleFieldChange('parkingFee')}
                    placeholder="0.00"
                    style={{ ...inputStyle, width: '80px' }}
                    disabled={localFormData.parkingProvided !== 'yes'}
                  />
                  <span>to be paid</span>
                  <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                    <input
                      type="checkbox"
                      checked={localFormData.parkingFeePayment === 'execution'}
                      onChange={() => handleRadioChange('parkingFeePayment', 'execution')}
                      style={{ marginRight: '4px' }}
                      disabled={localFormData.parkingProvided !== 'yes'}
                    />
                    <span>at the execution of this Agreement</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                    <input
                      type="checkbox"
                      checked={localFormData.parkingFeePayment === 'monthly'}
                      onChange={() => handleRadioChange('parkingFeePayment', 'monthly')}
                      style={{ marginRight: '4px' }}
                      disabled={localFormData.parkingProvided !== 'yes'}
                    />
                    <span>on a monthly basis in addition to the rent.</span>
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>The parking space(s) are described as:</span>
                  <input
                    type="text"
                    value={localFormData.parkingDescription}
                    onChange={handleFieldChange('parkingDescription')}
                    placeholder="Description of parking spaces"
                    style={{ ...inputStyle, minWidth: '300px', flex: '1' }}
                    disabled={localFormData.parkingProvided !== 'yes'}
                  />
                </div>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.parkingProvided === 'no'}
                onChange={() => handleRadioChange('parkingProvided', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>Shall NOT provide parking.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 17: Sale of Property */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '10px' }}>17. Sale of Property:</h5> <p>If the Premises is sold, the Tenant is to be notified of the new Owner, and if there is a new Manager, their contact details for repairs and maintenance shall be forwarded. If the Premises is conveyed to another party, the new owner: (check one)</p>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.newOwnerCanTerminate === 'yes'}
                onChange={() => handleRadioChange('newOwnerCanTerminate', 'yes')}
                style={{ marginRight: '8px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Has the right to terminate this Agreement by providing</span>
                <input
                  type="number"
                  value={localFormData.saleTerminationDays}
                  onChange={handleFieldChange('saleTerminationDays')}
                  placeholder="Days"
                  style={{ ...inputStyle, width: '60px' }}
                  disabled={localFormData.newOwnerCanTerminate !== 'yes'}
                />
                <span>days' notice to the Tenant.</span>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.newOwnerCanTerminate === 'no'}
                onChange={() => handleRadioChange('newOwnerCanTerminate', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>Does not have the right to terminate this Agreement.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 18: Early Termination */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>18. Early Termination: The Tenant: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.earlyTerminationAllowed === 'yes'}
                onChange={() => handleRadioChange('earlyTerminationAllowed', 'yes')}
                style={{ marginRight: '8px', marginTop: '8px' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <span>Shall have the right to terminate this Agreement at any time by providing at least</span>
                  <input
                    type="number"
                    value={localFormData.earlyTerminationDays}
                    onChange={handleFieldChange('earlyTerminationDays')}
                    placeholder="Days"
                    style={{ ...inputStyle, width: '60px' }}
                    disabled={localFormData.earlyTerminationAllowed !== 'yes'}
                  />
                  <span>days' written notice to the Landlord along with an early termination fee of $</span>
                  <input
                    type="number"
                    value={localFormData.earlyTerminationFee}
                    onChange={handleFieldChange('earlyTerminationFee')}
                    placeholder="0.00"
                    style={{ ...inputStyle, width: '100px' }}
                    disabled={localFormData.earlyTerminationAllowed !== 'yes'}
                  />
                  <span>(US Dollars).</span>
                </div>
                <p style={{ margin: '5px 0' }}>During the notice period for termination the Tenant will remain responsible for the payment of rent.</p>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.earlyTerminationAllowed === 'no'}
                onChange={() => handleRadioChange('earlyTerminationAllowed', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>Shall not have the right to terminate this Agreement.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 19: Smoking Policy */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>19. Smoking Policy: Smoking on the Premises is: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.smokingPolicy === 'permitted'}
                onChange={() => handleRadioChange('smokingPolicy', 'permitted')}
                style={{ marginRight: '8px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Permitted ONLY in the following areas:</span>
                <input
                  type="text"
                  value={localFormData.smokingAreas}
                  onChange={handleFieldChange('smokingAreas')}
                  placeholder="Specify smoking areas"
                  style={{ ...inputStyle, minWidth: '300px', flex: '1' }}
                  disabled={localFormData.smokingPolicy !== 'permitted'}
                />
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.smokingPolicy === 'prohibited'}
                onChange={() => handleRadioChange('smokingPolicy', 'prohibited')}
                style={{ marginRight: '8px' }}
              />
              <span>Prohibited on the Premises and Common Areas.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 20: Pets */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>20. Pets: The Tenant: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.petsAllowed === 'yes'}
                onChange={() => handleRadioChange('petsAllowed', 'yes')}
                style={{ marginRight: '8px', marginTop: '8px' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <span>Shall have the right to have</span>
                  <input
                    type="number"
                    value={localFormData.maxPets}
                    onChange={handleFieldChange('maxPets')}
                    placeholder="#"
                    style={{ ...inputStyle, width: '60px' }}
                    disabled={localFormData.petsAllowed !== 'yes'}
                  />
                  <span>pet(s) on the Premises consisting of</span>
                  <input
                    type="text"
                    value={localFormData.petTypes}
                    onChange={handleFieldChange('petTypes')}
                    placeholder="Types of Pets Allowed"
                    style={{ ...inputStyle, minWidth: '200px', flex: '1' }}
                    disabled={localFormData.petsAllowed !== 'yes'}
                  />
                  <span>that are not to weigh over</span>
                  <input
                    type="number"
                    value={localFormData.maxPetWeight}
                    onChange={handleFieldChange('maxPetWeight')}
                    placeholder="lbs"
                    style={{ ...inputStyle, width: '60px' }}
                    disabled={localFormData.petsAllowed !== 'yes'}
                  />
                  <span>pounds.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <span>For the right to have pet(s) on the Premises the Landlord shall charge a fee of $</span>
                  <input
                    type="number"
                    value={localFormData.petFee}
                    onChange={handleFieldChange('petFee')}
                    placeholder="0.00"
                    style={{ ...inputStyle, width: '80px' }}
                    disabled={localFormData.petsAllowed !== 'yes'}
                  />
                  <span>that is</span>
                  <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                    <input
                      type="checkbox"
                      checked={localFormData.petFeeType === 'non-refundable'}
                      onChange={() => handleRadioChange('petFeeType', 'non-refundable')}
                      style={{ marginRight: '4px' }}
                      disabled={localFormData.petsAllowed !== 'yes'}
                    />
                    <span>non-refundable</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                    <input
                      type="checkbox"
                      checked={localFormData.petFeeType === 'refundable'}
                      onChange={() => handleRadioChange('petFeeType', 'refundable')}
                      style={{ marginRight: '4px' }}
                      disabled={localFormData.petsAllowed !== 'yes'}
                    />
                    <span>refundable unless there are damages related to the pet.</span>
                  </label>
                </div>
                <p style={{ margin: '5px 0' }}>The Tenant is responsible for all damage that any pet causes, regardless of ownership of said pet and agrees to restore the Premises to its original condition at their expense.</p>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.petsAllowed === 'no'}
                onChange={() => handleRadioChange('petsAllowed', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>Shall not have the right to have pets on the Premises or in the common areas.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 21: Waterbeds */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>21. Waterbeds: The Tenant: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.waterbedsAllowed === 'yes'}
                onChange={() => handleRadioChange('waterbedsAllowed', 'yes')}
                style={{ marginRight: '8px' }}
              />
              <span>Shall have the right to use a waterbed on the Premises.</span>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.waterbedsAllowed === 'no'}
                onChange={() => handleRadioChange('waterbedsAllowed', 'no')}
                style={{ marginRight: '8px' }}
              />
              <span>Shall not have the right to use a waterbed on the Premises.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 22: Notices */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>22. Notices: Any notice to be sent by the Landlord or the Tenant to each other shall use the following addresses:</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span><strong>Landlord's / Agent's Address:</strong></span>
            </div>
            <input
              type="text"
              value={localFormData.landlordAgentAddress}
              onChange={handleFieldChange('landlordAgentAddress')}
              placeholder="Complete address for notices to landlord/agent"
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <p style={{ marginBottom: '10px' }}><strong>Tenant's Mailing Address:</strong> (check one)</p>
            <div style={{ marginLeft: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={localFormData.tenantMailingAddress === 'premises'}
                  onChange={() => handleRadioChange('tenantMailingAddress', 'premises')}
                  style={{ marginRight: '4px' }}
                />
                <span>The Premises.</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={localFormData.tenantMailingAddress === 'other'}
                  onChange={() => handleRadioChange('tenantMailingAddress', 'other')}
                  style={{ marginRight: '4px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Other.</span>
                  <input
                    type="text"
                    value={localFormData.tenantOtherAddress}
                    onChange={handleFieldChange('tenantOtherAddress')}
                    placeholder="Alternative mailing address"
                    style={{ ...inputStyle, minWidth: '300px', flex: '1' }}
                    disabled={localFormData.tenantMailingAddress !== 'other'}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 23: Agent / Manager */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>23. Agent / Manager: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.hasManager === 'yes'}
                onChange={() => handleRadioChange('hasManager', 'yes')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div>
                <p style={{ marginBottom: '10px' }}>The Landlord does have a manager on the Premises that can be contacted for any maintenance or repair at:</p>
                <div style={{ marginLeft: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span>Name:</span>
                    <input
                      type="text"
                      value={localFormData.managerName}
                      onChange={handleFieldChange('managerName')}
                      placeholder="Manager's name"
                      style={{ ...inputStyle, minWidth: '200px' }}
                      disabled={localFormData.hasManager !== 'yes'}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span>Telephone:</span>
                    <input
                      type="tel"
                      value={localFormData.managerPhone}
                      onChange={handleFieldChange('managerPhone')}
                      placeholder="(555) 123-4567"
                      style={{ ...inputStyle, width: '150px' }}
                      disabled={localFormData.hasManager !== 'yes'}
                    />
                    <span>E-Mail:</span>
                    <input
                      type="email"
                      value={localFormData.managerEmail}
                      onChange={handleFieldChange('managerEmail')}
                      placeholder="manager@email.com"
                      style={{ ...inputStyle, width: '200px' }}
                      disabled={localFormData.hasManager !== 'yes'}
                    />
                  </div>
                </div>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.hasManager === 'no'}
                onChange={() => handleRadioChange('hasManager', 'no')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div>
                <p style={{ marginBottom: '10px' }}>The Landlord does not have a manager on the Premises although the Landlord can be contacted for any maintenance or repair at:</p>
                <div style={{ marginLeft: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Telephone:</span>
                    <input
                      type="tel"
                      value={localFormData.landlordPhone}
                      onChange={handleFieldChange('landlordPhone')}
                      placeholder="(555) 123-4567"
                      style={{ ...inputStyle, width: '150px' }}
                      disabled={localFormData.hasManager !== 'no'}
                    />
                    <span>E-Mail:</span>
                    <input
                      type="email"
                      value={localFormData.landlordEmail}
                      onChange={handleFieldChange('landlordEmail')}
                      placeholder="landlord@email.com"
                      style={{ ...inputStyle, width: '200px' }}
                      disabled={localFormData.hasManager !== 'no'}
                    />
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Section 24: Possession */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>24. Possession:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px', marginBottom: '10px' }}>
          Tenant has examined the condition of the Premises and by taking possession acknowledges that they have accepted the Premises in good order and in its current condition except as herein otherwise stated.
        </p>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          Failure of the Landlord to deliver possession of the Premises at the start of the Lease Term to the Tenant shall terminate this Agreement at the option of the Tenant. Furthermore, under such failure to deliver possession by the Landlord, and if the Tenant cancels this Agreement, the Security Deposit (if any) shall be returned to the Tenant along with any other pre-paid rent, fees, including if the Tenant paid a fee during the application process before the execution of this Agreement.
        </p>
      </div>

      {/* Section 25: Access */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>25. Access:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          Upon the beginning of the Proration Period or the start of the Lease Term, whichever is earlier, the Landlord agrees to give access to the Tenant in the form of keys, fobs, cards, or any type of keyless security entry as needed to enter the common areas and the Premises. Duplicate copies of the access provided may only be authorized under the consent of the Landlord and, if any replacements are needed, the Landlord may provide them for a fee. At the end of this Agreement all access provided to the Tenant shall be returned to the Landlord or a fee will be charged to the Tenant or the fee will be subtracted from the Security Deposit.
        </p>
      </div>

      {/* Section 26: Subletting */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>26. Subletting:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The Tenant shall not be able to sublet the Premises without the written consent from the Landlord. The consent by the Landlord to one subtenant shall not be deemed to be consent to any subsequent subtenant.
        </p>
      </div>

      {/* Section 27: Abandonment */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>27. Abandonment:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          If the Tenant vacates or abandons the Premises for a time-period that is the minimum set by State law or seven (7) days, whichever is less, the Landlord shall have the right to terminate this Agreement immediately and remove all belongings including any personal property off of the Premises. If the Tenant vacates or abandons the Premises, the Landlord shall immediately have the right to terminate this Agreement.
        </p>
      </div>

      {/* Section 28: Assignment */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>28. Assignment:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          Tenant shall not assign this Lease without the prior written consent of the Landlord. The consent by the Landlord to one assignment shall not be deemed to be consent to any subsequent assignment.
        </p>
      </div>

      {/* Section 29: Right of Entry */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>29. Right of Entry:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The Landlord shall have the right to enter the Premises during normal working hours by providing at least twenty-four (24) hours' notice in order for inspection, make necessary repairs, alterations or improvements, to supply services as agreed or for any reasonable purpose. The Landlord may exhibit the Premises to prospective purchasers, mortgagees, or lessees upon reasonable notice.
        </p>
      </div>

      {/* Section 30: Maintenance, Repairs, or Alterations */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>30. Maintenance, Repairs, or Alterations:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The Tenant shall, at their own expense and at all times, maintain premises in a clean and sanitary manner, and shall surrender the same at termination hereof, in as good condition as received, normal wear and tear excepted. The Tenant may not make any alterations to the leased premises without the consent in writing of the Landlord. The Landlord shall be responsible for repairs to the interior and exterior of the building. If the Premises includes a washer, dryer, freezer, dehumidifier unit and/or air conditioning unit, the Landlord makes no warranty as to the repair or replacement of units if one or all shall fail to operate. The Landlord will place fresh batteries in all battery-operated smoke detectors when the Tenant moves into the premises. After the initial placement of the fresh batteries it is the responsibility of the Tenant to replace batteries when needed. A monthly "cursory" inspection may be required for all fire extinguishers to make sure they are fully charged.
        </p>
      </div>

      {/* Section 31: Noise / Waste */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>31. Noise / Waste:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The Tenant agrees not to commit waste on the premises, maintain, or permit to be maintained, a nuisance thereon, or use, or permit the premises to be used, in an unlawful manner. The Tenant further agrees to abide by any and all local, county, and State noise ordinances.
        </p>
      </div>

      {/* Section 32: Guests */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>32. Guests:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          There shall be no other persons living on the Premises other than the Tenant and any Occupant(s). Guests of the Tenant are allowed for periods not lasting for more than 48 hours unless otherwise approved by the Landlord in writing.
        </p>
      </div>

      {/* Section 33: Compliance With Law */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>33. Compliance With Law:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The Tenant agrees that during the term of the Agreement, to promptly comply with any present and future laws, ordinances, orders, rules, regulations, and requirements of the Federal, State, County, City, and Municipal government or any of their departments, bureaus, boards, commissions and officials thereof with respect to the premises, or the use or occupancy thereof, whether said compliance shall be ordered or directed to or against the Tenant, the Landlord, or both.
        </p>
      </div>

      {/* Section 34: Default */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>34. Default:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px', marginBottom: '15px' }}>
          If the Tenant fails to comply with any of the financial or material provisions of this Agreement, or of any present rules and regulations or any that may be hereafter prescribed by the Landlord, or materially fails to comply with any duties imposed on the Tenant by statute or State laws, within the time period after delivery of written notice by the Landlord specifying the non-compliance and indicating the intention of the Landlord to terminate the Agreement by reason thereof, the Landlord may terminate this Agreement. If the Tenant fails to pay rent when due and the default continues for the time-period specified in the written notice thereafter, the Landlord may, at their option, declare the entire balance (compiling all months applicable to this Agreement) of rent payable hereunder to be immediately due and payable and may exercise any and all rights and remedies available to the Landlord at law or in equity and may immediately terminate this Agreement.
        </p>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The Tenant will be in default if: (a) Tenant does not pay rent or other amounts that are owed; (b) Tenant, their guests, or the Occupant(s) violate this Agreement, rules, or fire, safety, health, or criminal laws, regardless of whether arrest or conviction occurs; (c) Tenant abandons the Premises; (d) Tenant gives incorrect or false information in the rental application; (e) Tenant, or any Occupant(s) is arrested, convicted, or given deferred adjudication for a criminal offense involving actual or potential physical harm to a person, or involving possession, manufacture, or delivery of a controlled substance, marijuana, or drug paraphernalia under state statute; (f) any illegal drugs or paraphernalia are found in the Premises or on the person of the Tenant, guests, or Occupant(s) while on the Premises and/or; (g) as otherwise allowed by law.
        </p>
      </div>

      {/* Section 35: Multiple Tenant or Occupant(s) */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>35. Multiple Tenant or Occupant(s):</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          Each individual that is considered a Tenant is jointly and individually liable for all of this Agreement's obligations, including but not limited to rent monies. If any Tenant, guest, or Occupant(s) violates this Agreement, the Tenant is considered to have violated this Agreement. Landlord's requests and notices to the Tenant or any of the Occupant(s) of legal age constitutes notice to the Tenant. Notices and requests from the Tenant or any one of the Occupant(s) (including repair requests and entry permissions) constitutes notice from the Tenant. In eviction suits, the Tenant is considered the agent of the Premise for the service of process.
        </p>
      </div>

      {/* Section 36: Disputes */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>36. Disputes:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          If a dispute arises during or after the term of this Agreement between the Landlord and Tenant, they shall agree to hold negotiations amongst themselves, in "good faith", before any litigation.
        </p>
      </div>

      {/* Section 37: Severability */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>37. Severability:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          If any provision of this Agreement or the application thereof shall, for any reason and to any extent, be invalid or unenforceable, neither the remainder of this Agreement nor the application of the provision to other persons, entities or circumstances shall be affected thereby, but instead shall be enforced to the maximum extent permitted by law.
        </p>
      </div>

      {/* Section 38: Surrender of Premises */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>38. Surrender of Premises:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The Tenant has surrendered the Premises when (a) the move-out date has passed, and no one is living in the Premise within the Landlord's reasonable judgment; or (b) Access to the Premise have been turned in to Landlord – whichever comes first. Upon the expiration of the term hereof, the Tenant shall surrender the Premise in better or equal condition as it were at the commencement of this Agreement, reasonable use, wear and tear thereof, and damages by the elements excepted.
        </p>
      </div>

      {/* Section 39: Retaliation */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>39. Retaliation:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The Landlord is prohibited from making any type of retaliatory acts against the Tenant including but not limited to restricting access to the Premises, decreasing or cancelling services or utilities, failure to repair appliances or fixtures, or any other type of act that could be considered unjustified.
        </p>
      </div>

      {/* Section 40: Waiver */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>40. Waiver:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          A Waiver by the Landlord for a breach of any covenant or duty by the Tenant, under this Agreement is not a waiver for a breach of any other covenant or duty by the Tenant, or of any subsequent breach of the same covenant or duty. No provision of this Agreement shall be considered waived unless such a waiver shall be expressed in writing as a formal amendment to this Agreement and executed by the Tenant and Landlord.
        </p>
      </div>

      {/* Section 41: Equal Housing */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>41. Equal Housing:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          If the Tenant possesses any mental or physical impairment, the Landlord shall provide reasonable modifications to the Premises unless the modifications would be too difficult or expensive for the Landlord to provide. Any impairment(s) of the Tenant are encouraged to be provided and presented to the Landlord in writing in order to seek the most appropriate route for providing the modifications to the Premises.
        </p>
      </div>

      {/* Section 42: Hazardous Materials */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>42. Hazardous Materials:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The Tenant agrees to not possess any type of personal property that could be considered a fire hazard such as a substance having flammable or explosive characteristics on the Premises. Items that are prohibited to be brought into the Premises, other than for everyday cooking or the need of an appliance, includes but is not limited to gas (compressed), gasoline, fuel, propane, kerosene, motor oil, fireworks, or any other related content in the form of a liquid, solid, or gas.
        </p>
      </div>

      {/* Section 43: Indemnification */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>43. Indemnification:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The Landlord shall not be liable for any damage or injury to the Tenant, or any other person, or to any property, occurring on the Premises, or any part thereof, or in common areas thereof, and the Tenant agrees to hold the Landlord harmless from any claims or damages unless caused solely by the Landlord's negligence. It is recommended that renter's insurance be purchased at the Tenant's expense.
        </p>
      </div>

      {/* Section 44: Covenants */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>44. Covenants:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          The covenants and conditions herein contained shall apply to and bind the heirs, legal representatives, and assigns of the parties hereto, and all covenants are to be construed as conditions of this Agreement.
        </p>
      </div>

      {/* Section 45: Premises Deemed Uninhabitable */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>45. Premises Deemed Uninhabitable:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          If the Premises is deemed uninhabitable due to damage beyond reasonable repair the Tenant will be able to terminate this Agreement by written notice to the Landlord. If said damage was due to the negligence of the Tenant, the Tenant shall be liable to the Landlord for all repairs and for the loss of income due to restoring the Premises back to a livable condition in addition to any other losses that can be proved by the Landlord.
        </p>
      </div>

      {/* Section 46: Lead Paint */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>46. Lead Paint: The Premises: (check one)</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.leadPaintDisclosure === 'built-before-1978'}
                onChange={() => handleRadioChange('leadPaintDisclosure', 'built-before-1978')}
                style={{ marginRight: '8px' }}
              />
              <span>Was constructed prior to 1978, and the Landlord has completed the "Lead-Based Paint Disclosure" section of this Agreement.</span>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.leadPaintDisclosure === 'not-built-1978'}
                onChange={() => handleRadioChange('leadPaintDisclosure', 'not-built-1978')}
                style={{ marginRight: '8px' }}
              />
              <span>Was constructed in 1978 or later.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 47: Governing Law */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>47. Governing Law:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          This Agreement is to be governed under the laws of the State where the Premises is located.
        </p>
      </div>

      {/* Section 48: Additional Terms & Conditions */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>48. Additional Terms & Conditions:</h5>
        <textarea
          value={localFormData.additionalTerms}
          onChange={handleFieldChange('additionalTerms')}
          placeholder="Enter any additional terms and conditions for this lease agreement"
          style={{ 
            ...inputStyle, 
            width: '100%', 
            minHeight: '100px', 
            resize: 'vertical',
            marginLeft: '20px'
          }}
        />
      </div>

      {/* Section 49: Entire Agreement */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>49. Entire Agreement:</h5>
        <p style={{ lineHeight: '1.6', marginLeft: '20px' }}>
          This Agreement contains all the terms agreed to by the parties relating to its subject matter including any attachments or addendums. This Agreement replaces all previous discussions, understandings, and oral agreements. The Landlord and Tenant agree to the terms and conditions and shall be bound until the end of the Lease Term.
        </p>
      </div>


      {/* Signature Section */}
      <div style={{ 
        marginTop: '40px',
        padding: '30px',
        backgroundColor: '#f8f9fa',
        border: '2px solid #dee2e6',
        borderRadius: '8px'
      }}>
        <h5 style={{ fontWeight: '600', marginBottom: '30px', textAlign: 'center' }}>SIGNATURES</h5>
        
        {/* Landlord Signature */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: '500', minWidth: '150px' }}>Landlord's Signature:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              flex: '1', 
              height: '30px',
              marginRight: '20px'
            }}></div>
            <span style={{ fontWeight: '500' }}>Date:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              width: '100px', 
              height: '30px',
              marginLeft: '10px'
            }}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: '500', minWidth: '150px' }}>Print Name:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              flex: '1', 
              height: '30px'
            }}></div>
          </div>
        </div>

        {/* Tenant Signatures */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: '500', minWidth: '150px' }}>Tenant's Signature:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              flex: '1', 
              height: '30px',
              marginRight: '20px'
            }}></div>
            <span style={{ fontWeight: '500' }}>Date:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              width: '100px', 
              height: '30px',
              marginLeft: '10px'
            }}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: '500', minWidth: '150px' }}>Print Name:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              flex: '1', 
              height: '30px'
            }}></div>
          </div>
        </div>

        {/* Additional Tenant Signature */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: '500', minWidth: '150px' }}>Tenant's Signature:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              flex: '1', 
              height: '30px',
              marginRight: '20px'
            }}></div>
            <span style={{ fontWeight: '500' }}>Date:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              width: '100px', 
              height: '30px',
              marginLeft: '10px'
            }}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: '500', minWidth: '150px' }}>Print Name:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              flex: '1', 
              height: '30px'
            }}></div>
          </div>
        </div>

        {/* Agent Signature */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: '500', minWidth: '150px' }}>Agent's Signature:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              flex: '1', 
              height: '30px',
              marginRight: '20px'
            }}></div>
            <span style={{ fontWeight: '500' }}>Date:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              width: '100px', 
              height: '30px',
              marginLeft: '10px'
            }}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: '500', minWidth: '150px' }}>Print Name:</span>
            <div style={{ 
              borderBottom: '1px solid #000', 
              flex: '1', 
              height: '30px'
            }}></div>
          </div>
        </div>
      </div>

      {/* Amount Due at Signing */}
      <div style={{ marginTop: '40px', marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>AMOUNT ($) DUE AT SIGNING</h5>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '500', minWidth: '180px' }}>Security Deposit:</span>
            <span>$</span>
            <input
              type="number"
              value={localFormData.amountDueSecurityDeposit}
              onChange={handleFieldChange('amountDueSecurityDeposit')}
              placeholder="0.00"
              style={{ ...inputStyle, width: '120px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '500', minWidth: '180px' }}>First (1st) Month's Rent:</span>
            <span>$</span>
            <input
              type="number"
              value={localFormData.amountDueFirstMonthRent}
              onChange={handleFieldChange('amountDueFirstMonthRent')}
              placeholder="0.00"
              style={{ ...inputStyle, width: '120px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '500', minWidth: '180px' }}>Parking Fee:</span>
            <span>$</span>
            <input
              type="number"
              value={localFormData.amountDueParkingFee}
              onChange={handleFieldChange('amountDueParkingFee')}
              placeholder="0.00"
              style={{ ...inputStyle, width: '120px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '500', minWidth: '180px' }}>Pet Fee(s):</span>
            <span>$</span>
            <input
              type="number"
              value={localFormData.amountDuePetFees}
              onChange={handleFieldChange('amountDuePetFees')}
              placeholder="0.00"
              style={{ ...inputStyle, width: '120px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '500', minWidth: '180px' }}>Pre-Payment of Rent:</span>
            <span>$</span>
            <input
              type="number"
              value={localFormData.amountDuePrePayment}
              onChange={handleFieldChange('amountDuePrePayment')}
              placeholder="0.00"
              style={{ ...inputStyle, width: '120px' }}
            />
          </div>
          
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '500', minWidth: '180px' }}>Proration Amount:</span>
            <span>$</span>
            <input
              type="number"
              value={localFormData.amountDueProration}
              onChange={handleFieldChange('amountDueProration')}
              placeholder="0.00"
              style={{ ...inputStyle, width: '120px' }}
            />
          </div>
          
          <div style={{ borderTop: '1px solid #000', paddingTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: '600', minWidth: '180px' }}>Total Amount:</span>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>$</span>
            <input
              type="number"
              value={localFormData.amountDueTotal}
              onChange={handleFieldChange('amountDueTotal')}
              placeholder="0.00"
              style={{ ...inputStyle, fontSize: '16px', fontWeight: '600', width: '120px' }}
            />
          </div>
        </div>
      </div>

      {/* Lead-Based Paint Disclosure (Comprehensive) */}
      <div style={{ marginTop: '40px', marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>Disclosure of Information on Lead-Based Paint and/or Lead-Based Paint Hazards</h5>
        
        {/* Lead Warning Statement */}
        <div style={{ marginBottom: '20px' }}>
          <h6 style={{ fontWeight: '600', marginBottom: '10px' }}>1. Lead Warning Statement</h6>
          <p style={{ marginLeft: '20px', lineHeight: '1.6', fontSize: '14px' }}>
            Housing build before 1978 may contain lead-based paint. Lead from paint, paint chips, and dust can pose health hazards if not managed properly. Lead exposure is especially harmful to young children and pregnant women. Before renting pre-1978 housing, landlords must disclose the presence of known lead-based paint and /or lead-based paint hazards in the dwelling. Tenants must also receive a federally approved pamphlet on lead poisoning prevention.
          </p>
        </div>

        {/* Lessor's Disclosure */}
        <div style={{ marginBottom: '20px' }}>
          <h6 style={{ fontWeight: '600', marginBottom: '10px' }}>2. Lessor's Disclosure</h6>
          
          {/* Presence of lead-based paint */}
          <div style={{ marginLeft: '20px', marginBottom: '15px' }}>
            <p style={{ fontWeight: '600', marginBottom: '10px' }}>(a) Presence of lead-based paint and/or lead-based paint hazards (check one below):</p>
            <div style={{ marginLeft: '20px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.leadPaintKnownPresent === 'yes'}
                    onChange={() => handleRadioChange('leadPaintKnownPresent', 'yes')}
                    style={{ marginRight: '8px', marginTop: '5px' }}
                  />
                  <div style={{ flex: '1' }}>
                    <span>Known lead-based paint and/or lead-based paint hazards are present in the housing (explain): </span>
                    <input
                      type="text"
                      value={localFormData.leadPaintKnownExplanation}
                      onChange={handleFieldChange('leadPaintKnownExplanation')}
                      placeholder="Explain the presence of lead-based paint/hazards"
                      style={{ ...inputStyle, width: '100%', marginTop: '5px' }}
                      disabled={localFormData.leadPaintKnownPresent !== 'yes'}
                    />
                  </div>
                </label>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.leadPaintNoKnowledge === 'yes'}
                    onChange={() => handleRadioChange('leadPaintNoKnowledge', 'yes')}
                    style={{ marginRight: '8px' }}
                  />
                  <span>Landlord has no knowledge of lead-based paint and/or lead-based paint hazards in the housing.</span>
                </label>
              </div>
            </div>
          </div>

          {/* Records and reports */}
          <div style={{ marginLeft: '20px', marginBottom: '15px' }}>
            <p style={{ fontWeight: '600', marginBottom: '10px' }}>(b) Records and reports available to the landlord (check one below)</p>
            <div style={{ marginLeft: '20px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.leadPaintRecordsAvailable === 'yes'}
                    onChange={() => handleRadioChange('leadPaintRecordsAvailable', 'yes')}
                    style={{ marginRight: '8px', marginTop: '5px' }}
                  />
                  <div style={{ flex: '1' }}>
                    <span>Landlord has provided the tenant with all available records and reports pertaining to lead-based paint and/or lead-based paint hazards in the housing (list documents below).</span>
                    <textarea
                      value={localFormData.leadPaintRecordsList}
                      onChange={handleFieldChange('leadPaintRecordsList')}
                      placeholder="List all available documents and records"
                      style={{ ...inputStyle, width: '100%', marginTop: '5px', minHeight: '60px', resize: 'vertical' }}
                      disabled={localFormData.leadPaintRecordsAvailable !== 'yes'}
                    />
                  </div>
                </label>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.leadPaintNoRecords === 'yes'}
                    onChange={() => handleRadioChange('leadPaintNoRecords', 'yes')}
                    style={{ marginRight: '8px' }}
                  />
                  <span>Landlord has no reports or records pertaining to lead-based paint and/or lead-based paint hazards in the housing.</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant's Acknowledgement */}
        <div style={{ marginBottom: '20px' }}>
          <h6 style={{ fontWeight: '600', marginBottom: '10px' }}>3. Tenant's Acknowledgement</h6>
          <div style={{ marginLeft: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={localFormData.leadPaintTenantReceivedInfo}
                  onChange={handleCheckboxChange('leadPaintTenantReceivedInfo')}
                  style={{ marginRight: '8px' }}
                />
                <span>Tenant has received copies of all information listed above.</span>
              </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={localFormData.leadPaintTenantReceivedPamphlet}
                  onChange={handleCheckboxChange('leadPaintTenantReceivedPamphlet')}
                  style={{ marginRight: '8px' }}
                />
                <span>Tenant has received the pamphlet "Protect Your Family from Lead in Your Home".</span>
              </label>
            </div>
          </div>
        </div>

        {/* Broker's Acknowledgement */}
        <div style={{ marginBottom: '20px' }}>
          <h6 style={{ fontWeight: '600', marginBottom: '10px' }}>4. Broker's Acknowledgement</h6>
          <div style={{ marginLeft: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={localFormData.leadPaintBrokerInformed}
                  onChange={handleCheckboxChange('leadPaintBrokerInformed')}
                  style={{ marginRight: '8px' }}
                />
                <span>Broker has informed the tenant of the tenant's obligations under 42 USC 4852(d) and is aware of his/her responsibility to ensure compliance.</span>
              </label>
            </div>
          </div>
        </div>

        {/* Certification of Accuracy */}
        <div style={{ marginBottom: '20px' }}>
          <h6 style={{ fontWeight: '600', marginBottom: '10px' }}>5. Certification of Accuracy</h6>
          <p style={{ marginLeft: '20px', marginBottom: '20px', lineHeight: '1.6' }}>
            The following parties have reviewed the information above and certify, to the best of their knowledge, that the information they have provided is true and accurate.
          </p>
          
          {/* Lead Paint Signature Section */}
          <div style={{ marginLeft: '20px' }}>
            <h6 style={{ fontWeight: '600', marginBottom: '20px' }}>Lead Paint Disclosure Signatures</h6>
            
            {/* Landlord Signature */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', minWidth: '130px' }}>Landlord's Signature</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  flex: '1', 
                  height: '25px',
                  marginRight: '15px'
                }}></div>
                <span style={{ fontWeight: '500' }}>Date:</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  width: '80px', 
                  height: '25px',
                  marginLeft: '8px'
                }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', minWidth: '130px' }}>Print Name:</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  flex: '1', 
                  height: '25px'
                }}></div>
              </div>
            </div>

            {/* Tenant Signature 1 */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', minWidth: '130px' }}>Tenant's Signature</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  flex: '1', 
                  height: '25px',
                  marginRight: '15px'
                }}></div>
                <span style={{ fontWeight: '500' }}>Date:</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  width: '80px', 
                  height: '25px',
                  marginLeft: '8px'
                }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', minWidth: '130px' }}>Print Name:</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  flex: '1', 
                  height: '25px'
                }}></div>
              </div>
            </div>

            {/* Tenant Signature 2 */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', minWidth: '130px' }}>Tenant's Signature</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  flex: '1', 
                  height: '25px',
                  marginRight: '15px'
                }}></div>
                <span style={{ fontWeight: '500' }}>Date:</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  width: '80px', 
                  height: '25px',
                  marginLeft: '8px'
                }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', minWidth: '130px' }}>Print Name:</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  flex: '1', 
                  height: '25px'
                }}></div>
              </div>
            </div>

            {/* Agent Signature */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', minWidth: '130px' }}>Agent's Signature</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  flex: '1', 
                  height: '25px',
                  marginRight: '15px'
                }}></div>
                <span style={{ fontWeight: '500' }}>Date:</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  width: '80px', 
                  height: '25px',
                  marginLeft: '8px'
                }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', minWidth: '130px' }}>Print Name:</span>
                <div style={{ 
                  borderBottom: '1px solid #000', 
                  flex: '1', 
                  height: '25px'
                }}></div>
              </div>
            </div>
          </div>
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
          This Residential Lease Agreement is a legally binding document. Ensure all information is accurate before proceeding. 
          Both parties should retain copies of this document for their records.
        </p>
      </div>
    </FormWrapper>
  );
};

export default ResidentialLeaseAgreementForm;
