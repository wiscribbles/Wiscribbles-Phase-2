'use client';
import React from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';
import useDocumentForm from '@/hooks/useDocumentForm';
import DocumentFormStatus from '../shared/DocumentFormStatus';

const DurableFinancialPowerOfAttorneyForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const initialFormData = {
    // Opening section
    executionDay: '',
    executionMonth: '',
    executionYear: '',
    principalName: '',
    principalMailingAddress: '',
    principalCity: '',
    principalState: '',
    agentName: '',
    agentMailingAddress: '',
    agentCity: '',
    agentState: '',
    
    // Effective Date
    effectiveDateOption: '', // 'immediate' or 'incapacity'
    effectiveDatePrincipalName: '', // Principal name for effective date section
    
    // Powers of Attorney-in-Fact (checkboxes and initials)
    powerBanking: false,
    powerBankingInitials: '',
    powerSafeDepositBox: false,
    powerSafeDepositBoxInitials: '',
    powerLendingBorrowing: false,
    powerLendingBorrowingInitials: '',
    powerGovernmentBenefits: false,
    powerGovernmentBenefitsInitials: '',
    powerRetirementPlan: false,
    powerRetirementPlanInitials: '',
    powerTaxes: false,
    powerTaxesInitials: '',
    powerInsurance: false,
    powerInsuranceInitials: '',
    powerRealEstate: false,
    powerRealEstateInitials: '',
    powerPersonalProperty: false,
    powerPersonalPropertyInitials: '',
    powerManageProperty: false,
    powerManagePropertyInitials: '',
    powerGifts: false,
    powerGiftsInitials: '',
    powerLegalAdvice: false,
    powerLegalAdviceInitials: '',
    
    // Special Instructions
    specialInstructions: '',
    
    // State Law
    governingState: '',
    
    // Final execution details
    finalExecutionDay: '',
    finalExecutionMonth: '',
    finalExecutionYear: '',
    
    // Signatures
    principalSignature: '',
    
    // Witnesses
    witness1Signature: '',
    witness1Address: '',
    witness2Signature: '',
    witness2Address: '',
    
    // Notary Acknowledgment 1
    notaryState1: '',
    notaryCounty1: '',
    notaryDay1: '',
    notaryMonth1: '',
    notaryYear1: '',
    notaryPrincipalName1: '',
    notarySignature1: '',
    notaryCommissionExpires1: '',
    
    // Attorney-in-Fact Acceptance
    attorneyAcceptanceName: '',
    attorneySignature: '',
    
    // Notary Acknowledgment 2
    notaryState2: '',
    notaryCounty2: '',
    notaryDay2: '',
    notaryMonth2: '',
    notaryYear2: '',
    notaryAttorneyName2: '',
    notarySignature2: '',
    notaryCommissionExpires2: '',
    
    ...formData
  };

  const requiredFields = [
    'executionDay', 'executionMonth', 'executionYear', 'principalName', 'principalMailingAddress',
    'principalCity', 'principalState', 'agentName', 'agentMailingAddress', 'agentCity', 
    'agentState', 'effectiveDateOption', 'effectiveDatePrincipalName', 'governingState', 'finalExecutionDay', 
    'finalExecutionMonth', 'finalExecutionYear'
  ];

  // Custom validation function
  const customValidation = (formData) => {
    const errors = {};
    
    // At least one power must be selected
    const powersSelected = [
      'powerBanking', 'powerSafeDepositBox', 'powerLendingBorrowing', 'powerGovernmentBenefits',
      'powerRetirementPlan', 'powerTaxes', 'powerInsurance', 'powerRealEstate', 
      'powerPersonalProperty', 'powerManageProperty', 'powerGifts', 'powerLegalAdvice'
    ].some(power => formData[power]);
    
    if (!powersSelected) {
      errors.powers = 'At least one power must be selected';
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
    documentType: 'durable-financial-power-of-attorney',
    initialFormData,
    requiredFields,
    customValidation,
    onFormDataChange
  });

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
    fontSize: '18px',
    marginBottom: '15px',
    color: '#2d3748',
    textAlign: 'center',
    textTransform: 'uppercase'
  };

  if (isLoading) {
    return (
      <FormWrapper
        title="Durable (Financial) Power of Attorney"
        subtitle="Loading your saved data..."
        onProceed={() => false}
        isValid={false}
      >
        <DocumentFormStatus 
          isLoading={isLoading}
          loadingMessage="Loading your Durable Financial Power of Attorney data..."
        />
      </FormWrapper>
    );
  }

  return (
    <FormWrapper title="Durable (Financial) Power of Attorney" onProceed={() => isValid && onProceed()} isValid={isValid}>
      <DocumentFormStatus saveStatus={saveStatus} />
      
      {/* Opening Section */}
      <div style={sectionStyle}>
        
        <div style={{ lineHeight: '1.8', marginBottom: '20px' }}>
          On this{' '}
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
          />, I,{' '}
          <input
            type="text"
            value={localFormData.principalName}
            onChange={handleFieldChange('principalName')}
            style={{ ...inlineInputStyle, width: '200px' }}
            placeholder="Principal's Full Name"
            required
          /> (Principal), with the mailing address of{' '}
          <input
            type="text"
            value={localFormData.principalMailingAddress}
            onChange={handleFieldChange('principalMailingAddress')}
            style={{ ...inlineInputStyle, width: '250px' }}
            placeholder="Mailing Address"
            required
          />, City of{' '}
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
          />, hereby designate{' '}
          <input
            type="text"
            value={localFormData.agentName}
            onChange={handleFieldChange('agentName')}
            style={{ ...inlineInputStyle, width: '200px' }}
            placeholder="Agent's Full Name"
            required
          /> (Agent), with the mailing address of{' '}
          <input
            type="text"
            value={localFormData.agentMailingAddress}
            onChange={handleFieldChange('agentMailingAddress')}
            style={{ ...inlineInputStyle, width: '250px' }}
            placeholder="Agent's Mailing Address"
            required
          />, City of{' '}
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
          />, my attorney-in-fact (hereinafter my "attorney-in-fact"), to act as initialed below, in my name, in my stead and for my benefit, hereby revoking any and all financial powers of attorney I may have executed in the past.
        </div>
      </div>

      {/* Effective Date Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>EFFECTIVE DATE</div>
        <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
          I,{' '}
          <input
            type="text"
            value={localFormData.effectiveDatePrincipalName}
            onChange={handleFieldChange('effectiveDatePrincipalName')}
            style={{ ...inlineInputStyle, width: '200px' }}
            placeholder="Principal's Full Name"
            required
          />, choose the applicable paragraph by placing your initials in one of the preceding spaces.
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="radio"
                name="effectiveDateOption"
                value="immediate"
                checked={localFormData.effectiveDateOption === 'immediate'}
                onChange={() => handleRadioChange('effectiveDateOption', 'immediate')}
                style={checkboxStyle}
                required
              />
              <div>
                <strong>A.</strong> I grant my attorney-in-fact the powers set forth herein immediately upon the execution of this document. These powers shall not be affected by any subsequent disability or incapacity I may experience in the future.
              </div>
            </label>
          </div>
          
          <div style={{ textAlign: 'center', margin: '20px 0', fontWeight: 'bold' }}>or</div>
          
          <div style={{ lineHeight: '1.8' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="radio"
                name="effectiveDateOption"
                value="incapacity"
                checked={localFormData.effectiveDateOption === 'incapacity'}
                onChange={() => handleRadioChange('effectiveDateOption', 'incapacity')}
                style={checkboxStyle}
                required
              />
              <div>
                <strong>B.</strong> I grant my attorney-in-fact the powers set forth herein only when it has been determined in writing, by my attending physician, that I am unable to properly handle my financial affairs.
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Powers of Attorney-in-Fact Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>POWERS OF ATTORNEY-IN-FACT</div>
        <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          My attorney-in-fact shall exercise powers in my best interests and for my welfare, as a fiduciary. My attorney-in-fact shall have the following powers (choose the applicable power(s) by placing your initials in the preceding space):
        </div>
        
        <div style={{ marginLeft: '10px' }}>
          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerBanking}
                onChange={handleFieldChange('powerBanking')}
                style={checkboxStyle}
              />
              <div>
                <strong>BANKING:</strong> To receive and deposit funds in any financial institution, and to withdraw funds by check or otherwise to pay for goods, services, and any other personal and business expenses for my benefit. If necessary, to affect my attorney-in-fact's powers, my attorney-in-fact is authorized to execute any document required to be signed by such banking institution.
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerSafeDepositBox}
                onChange={handleFieldChange('powerSafeDepositBox')}
                style={checkboxStyle}
              />
              <div>
                <strong>SAFE DEPOSIT BOX:</strong> To have access at any time or times to any safe-deposit box rented by me or to which I may have access, wheresoever located, including drilling, if necessary, and to remove all or any part of the contents thereof, and to surrender or relinquish said safe-deposit box; and any institution in which any such safe-deposit box may be located shall not incur any liability to me or my estate as a result of permitting my attorney-in-fact to exercise this power.
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerLendingBorrowing}
                onChange={handleFieldChange('powerLendingBorrowing')}
                style={checkboxStyle}
              />
              <div>
                <strong>LENDING OR BORROWING:</strong> To make loans in my name; to borrow money in my name, individually or jointly with others; to give promissory notes or other obligations therefor; and to deposit or mortgage as collateral or for security for the payment thereof any or all of my securities, real estate, personal property, or other property of whatever nature and wherever situated, held by me personally or in trust for my benefit.
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerGovernmentBenefits}
                onChange={handleFieldChange('powerGovernmentBenefits')}
                style={checkboxStyle}
              />
              <div>
                <strong>GOVERNMENT BENEFITS:</strong> To apply for and receive any government benefits for which I may be eligible or become eligible, including but not limited to, Social Security, Medicare and Medicaid.
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerRetirementPlan}
                onChange={handleFieldChange('powerRetirementPlan')}
                style={checkboxStyle}
              />
              <div>
                <strong>RETIREMENT PLAN:</strong> To contribute to, select payment option of, roll-over, and receive benefits of any retirement plan or IRA I may own, except my attorney-in-fact shall not have power to change the beneficiary of any of my retirement plans or IRAs.
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerTaxes}
                onChange={handleFieldChange('powerTaxes')}
                style={checkboxStyle}
              />
              <div>
                <strong>TAXES:</strong> To complete and sign any local, state and federal tax returns on my behalf, pay any taxes and assessments due and receive credits and refunds owed to me and to sign any tax agency documents necessary to effectuate these powers.
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerInsurance}
                onChange={handleFieldChange('powerInsurance')}
                style={checkboxStyle}
              />
              <div>
                <strong>INSURANCE:</strong> To purchase, pay premiums and make claims on life, health, automobile and homeowners' insurance on my behalf, except my attorney-in-fact shall not have the power to cash in or change the beneficiary of any life insurance policy.
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerRealEstate}
                onChange={handleFieldChange('powerRealEstate')}
                style={checkboxStyle}
              />
              <div>
                <strong>REAL ESTATE:</strong> To acquire, purchase, exchange, lease, grant options to sell, and sell and convey real property, or any interests therein, on such terms and conditions, including credit arrangements, as my attorney-in-fact shall deem proper; to execute, acknowledge and deliver, under seal or otherwise, any and all assignments, transfers, deeds, papers, documents or instruments which my attorney-in-fact shall deem necessary in connection therewith.
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerPersonalProperty}
                onChange={handleFieldChange('powerPersonalProperty')}
                style={checkboxStyle}
              />
              <div>
                <strong>PERSONAL PROPERTY:</strong> To acquire, purchase, exchange, lease, grant options to sell, and sell and convey personal property, or any interests therein, on such terms and conditions, including credit arrangements, as my attorney-in-fact shall deem proper; to execute, acknowledge and deliver, under seal or otherwise, any and all assignments, transfers, titles, papers, documents or instruments which my attorney-in-fact shall deem necessary in connection therewith; to purchase, sell or otherwise dispose of, assign, transfer and convey shares of stock, bonds, securities and other personal property now or hereafter belonging to me, whether standing in my name or otherwise, and wherever situated.
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerManageProperty}
                onChange={handleFieldChange('powerManageProperty')}
                style={checkboxStyle}
              />
              <div>
                <strong>POWER TO MANAGE PROPERTY:</strong> To maintain, repair, improve, invest, manage, insure, rent, lease, encumber, and in any manner deal with any real or personal property, tangible or intangible, or any interests therein, that I now own or may hereafter acquire, in my name and for my benefit, upon such terms and conditions as my attorney-in-fact shall deem proper.
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerGifts}
                onChange={handleFieldChange('powerGifts')}
                style={checkboxStyle}
              />
              <div>
                <strong>GIFTS:</strong> To make gifts, grants, or other transfers (including the forgiveness of indebtedness and the completion of any charitable pledges I may have made) without consideration, either outright or in trust to such person(s) (including my attorney-in-fact hereunder) or organizations as my attorney-in-fact shall select, including, without limitation, the following actions: (a) transfer by gift in advancement of a bequest or devise to beneficiaries under my will or in the absence of a will to my spouse and descendants in whatever degree; and (b) release of any life interest, or waiver, renunciation, disclaimer, or declination of any gift to me by will, deed, or trust
              </div>
            </label>
          </div>

          <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input
                type="checkbox"
                checked={localFormData.powerLegalAdvice}
                onChange={handleFieldChange('powerLegalAdvice')}
                style={checkboxStyle}
              />
              <div>
                <strong>LEGAL ADVICE AND PROCEEDINGS:</strong> To obtain and pay for legal advice, to initiate or defend legal and administrative proceedings on my behalf, including actions against third parties who refuse, without cause, to honor this instrument.
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Special Instructions Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>SPECIAL INSTRUCTIONS</div>
        <div style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          On the following lines are any special instructions limiting or extending the powers I give to my attorney-in-fact (Write "None" if no additional instructions are given):
        </div>
        <textarea
          value={localFormData.specialInstructions}
          onChange={handleFieldChange('specialInstructions')}
          placeholder="Enter special instructions or write 'None'"
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

      {/* Authority, Liability, Reimbursement Sections */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>AUTHORITY OF ATTORNEY-IN-FACT</div>
        <div style={{ lineHeight: '1.6' }}>
          Any party dealing with my attorney-in-fact hereunder may rely absolutely on the authority granted herein and need not look to the application of any proceeds nor the authority of my attorney-in-fact as to any action taken hereunder. In this regard, no person who may in good faith act in reliance upon the representations of my attorney-in-fact or the authority granted hereunder shall incur any liability to me or my estate as a result of such act. I hereby ratify and confirm whatever my attorney-in-fact shall lawfully do under this instrument. My attorney-in-fact is authorized as he or she deems necessary to bring an action in court so that this instrument shall be given the full power and effect that I intend on by executing it.
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>LIABILITY OF ATTORNEY-IN-FACT</div>
        <div style={{ lineHeight: '1.6' }}>
          My attorney-in-fact shall not incur any liability to me under this power except for a breach of fiduciary duty.
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>REIMBURSEMENT OF ATTORNEY-IN-FACT</div>
        <div style={{ lineHeight: '1.6' }}>
          My attorney-in-fact is entitled to reimbursement for reasonable expenses incurred in exercising powers hereunder, and to reasonable compensation for services provided as attorney-in-fact.
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>AMENDMENT AND REVOCATION</div>
        <div style={{ lineHeight: '1.6' }}>
          I can amend or revoke this power of attorney through a writing delivered to my attorney-in-fact. Any amendment or revocation is ineffective as to a third party until such third party has notice of such revocation or amendment.
        </div>
      </div>

      {/* State Law Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>STATE LAW</div>
        <div style={{ lineHeight: '1.8' }}>
          This Power of Attorney is governed by the laws of the State of{' '}
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

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>PHOTOCOPIES</div>
        <div style={{ lineHeight: '1.6' }}>
          Photocopies of this document can be relied upon as though they were originals.
        </div>
      </div>

      {/* Final Execution Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>IN WITNESS WHEREOF</div>
        <div style={{ lineHeight: '1.8', marginBottom: '30px' }}>
          IN WITNESS WHEREOF, I have on this{' '}
          <input
            type="number"
            value={localFormData.finalExecutionDay}
            onChange={handleFieldChange('finalExecutionDay')}
            style={{ ...inlineInputStyle, width: '50px' }}
            min="1"
            max="31"
            placeholder="Day"
            required
          /> day of{' '}
          <input
            type="text"
            value={localFormData.finalExecutionMonth}
            onChange={handleFieldChange('finalExecutionMonth')}
            style={{ ...inlineInputStyle, width: '120px' }}
            placeholder="Month"
            required
          />, 20
          <input
            type="number"
            value={localFormData.finalExecutionYear}
            onChange={handleFieldChange('finalExecutionYear')}
            style={{ ...inlineInputStyle, width: '60px' }}
            min="20"
            max="99"
            placeholder="YY"
            required
          />, executed this Financial Power of Attorney.
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ marginBottom: '50px' }}>
            <input
              type="text"
              value={localFormData.principalSignature}
              onChange={handleFieldChange('principalSignature')}
              placeholder="Principal's Signature"
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
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
              Principal's Signature
            </div>
          </div>
        </div>
      </div>

      {/* Witness Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>WITNESSES</div>
        <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          We, the witnesses, each do hereby declare in the presence of the principal that the principal signed and executed this instrument in the presence of each of us, that the principal signed it willingly, that each of us hereby signs this Power of Attorney as witness at the request of the principal and in the principal's presence, and that, to the best of our knowledge, the principal is eighteen years of age or over, of sound mind, and under no constraint or undue influence.
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
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Witness's Signature</div>
            
            <input
              type="text"
              value={localFormData.witness1Address}
              onChange={handleFieldChange('witness1Address')}
              placeholder="First Witness Address"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '1px solid #666'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666' }}>Address</div>
          </div>
          
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
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Witness's Signature</div>
            
            <input
              type="text"
              value={localFormData.witness2Address}
              onChange={handleFieldChange('witness2Address')}
              placeholder="Second Witness Address"
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '1px solid #666'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666' }}>Address</div>
          </div>
        </div>
      </div>


      {/* Attorney-in-Fact Acceptance Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>SPECIMEN SIGNATURE AND ACCEPTANCE OF APPOINTMENT</div>
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
              textAlign: 'center'
            }}
          />
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            Attorney-in-Fact's Signature
          </div>
        </div>
      </div>

      {/* First Notary Acknowledgment Section */}
      <div style={{ ...sectionStyle, backgroundColor: '#f0f0f0', border: '1px solid #ddd' }}>
        <div style={sectionTitleStyle}>ACKNOWLEDGEMENT OF NOTARY PUBLIC</div>
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
          </span>, as Principal of this Power of Attorney who proved to me through government issued photo identification to be the above-named person, in my presence executed foregoing instrument and acknowledged that (s)he executed the same as his/her free act and deed.
        </div>
        
        <div style={{ textAlign: 'center' }}>
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
        This durable financial power of attorney is legally binding when properly executed and notarized.
      </div>

    </FormWrapper>
  );
};

export default DurableFinancialPowerOfAttorneyForm;
