'use client';
import React, { useState, useEffect } from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';

const PromissoryNoteForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const [localFormData, setLocalFormData] = useState({
    // Section 1 - The Parties
    noteDate: '',
    borrowerName: '',
    borrowerAddress: '',
    lenderName: '',
    lenderAddress: '',
    
    // Section 2 - Loan Terms
    principalAmount: '',
    interestRate: '',
    interestCompoundPeriod: '', // 'month', 'annum', 'other'
    interestCompoundOther: '',
    borrowerReceiveDate: '',
    
    // Section 3 - Payments
    paymentType: '', // 'lump_sum', 'installments'
    lumpSumAmount: '',
    lumpSumDueDate: '',
    installmentAmount: '',
    firstPaymentDate: '',
    installmentFrequency: '', // 'weekly', 'monthly', 'quarterly'
    finalPaymentDate: '',
    
    // Section 4 - Payment is Due
    lateDays: '',
    
    // Section 5 - Late Fee
    lateFeeType: '', // 'no_late_fee', 'late_fee'
    lateFeeAmount: '',
    lateFeeFrequency: '', // 'occurrence', 'day'
    
    // Section 6 - Security
    securityType: '', // 'unsecured', 'secured'
    securityDescription: '',
    
    // Section 7 - Co-Signer
    coSignerType: '', // 'no_cosigner', 'cosigner'
    coSignerName: '',
    
    // Section 8 - Prepayment Penalty
    prepaymentPenaltyType: '', // 'no_penalty', 'penalty'
    prepaymentPenaltyMethod: '', // 'amount', 'percent', 'other'
    prepaymentPenaltyAmount: '',
    prepaymentPenaltyPercent: '',
    prepaymentPenaltyOther: '',
    
    // Section 20 - Governing Law
    governingLaw: '',
    
    // Section 21 - Additional Terms
    additionalTerms: '',
    
    // Signature Section
    lenderSignature: '',
    lenderSignatureDate: '',
    lenderPrintName: '',
    borrowerSignature: '',
    borrowerSignatureDate: '',
    borrowerPrintName: '',
    coSignerSignature: '',
    coSignerSignatureDate: '',
    coSignerPrintName: '',
    
    ...formData
  });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => { onFormDataChange(localFormData); }, [localFormData, onFormDataChange]);
  
  useEffect(() => {
    const requiredFields = [
      'noteDate', 'borrowerName', 'borrowerAddress', 'lenderName', 'lenderAddress',
      'principalAmount', 'interestRate', 'interestCompoundPeriod', 'borrowerReceiveDate',
      'paymentType', 'lateDays', 'lateFeeType', 'securityType', 'coSignerType',
      'prepaymentPenaltyType', 'governingLaw'
    ];
    
    let valid = requiredFields.every(field => localFormData[field]);
    
    // Additional conditional validations
    if (localFormData.interestCompoundPeriod === 'other' && !localFormData.interestCompoundOther) valid = false;
    if (localFormData.paymentType === 'lump_sum' && (!localFormData.lumpSumAmount || !localFormData.lumpSumDueDate)) valid = false;
    if (localFormData.paymentType === 'installments' && (!localFormData.installmentAmount || !localFormData.firstPaymentDate || !localFormData.installmentFrequency || !localFormData.finalPaymentDate)) valid = false;
    if (localFormData.lateFeeType === 'late_fee' && (!localFormData.lateFeeAmount || !localFormData.lateFeeFrequency)) valid = false;
    if (localFormData.securityType === 'secured' && !localFormData.securityDescription) valid = false;
    if (localFormData.coSignerType === 'cosigner' && !localFormData.coSignerName) valid = false;
    if (localFormData.prepaymentPenaltyType === 'penalty') {
      if (!localFormData.prepaymentPenaltyMethod) valid = false;
      if (localFormData.prepaymentPenaltyMethod === 'amount' && !localFormData.prepaymentPenaltyAmount) valid = false;
      if (localFormData.prepaymentPenaltyMethod === 'percent' && !localFormData.prepaymentPenaltyPercent) valid = false;
      if (localFormData.prepaymentPenaltyMethod === 'other' && !localFormData.prepaymentPenaltyOther) valid = false;
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
    <FormWrapper title="Standard Promissory Note" onProceed={() => isValid && onProceed()} isValid={isValid}>
      
      {/* Section 1 - The Parties */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>1. THE PARTIES</div>
        <div style={{ lineHeight: '1.8', marginBottom: '20px' }}>
          This Standard Promissory Note ("Note") made on{' '}
          <input
            type="date"
            value={localFormData.noteDate}
            onChange={handleFieldChange('noteDate')}
            style={{ ...inlineInputStyle, width: '150px' }}
            required
          />, is by and between:
        </div>
        
        <div style={{ marginBottom: '20px', lineHeight: '1.8' }}>
          <strong>Borrower:</strong>{' '}
          <input
            type="text"
            value={localFormData.borrowerName}
            onChange={handleFieldChange('borrowerName')}
            placeholder="Borrower's Name"
            style={{ ...inlineInputStyle, width: '200px' }}
            required
          /> with a mailing address of{' '}
          <input
            type="text"
            value={localFormData.borrowerAddress}
            onChange={handleFieldChange('borrowerAddress')}
            placeholder="Borrower's Address"
            style={{ ...inlineInputStyle, width: '300px' }}
            required
          /> ("Borrower"), and
        </div>
        
        <div style={{ lineHeight: '1.8' }}>
          <strong>Lender:</strong>{' '}
          <input
            type="text"
            value={localFormData.lenderName}
            onChange={handleFieldChange('lenderName')}
            placeholder="Lender's Name"
            style={{ ...inlineInputStyle, width: '200px' }}
            required
          /> with a mailing address of{' '}
          <input
            type="text"
            value={localFormData.lenderAddress}
            onChange={handleFieldChange('lenderAddress')}
            placeholder="Lender's Address"
            style={{ ...inlineInputStyle, width: '300px' }}
            required
          /> ("Lender").
        </div>
      </div>
      
      {/* Section 2 - Loan Terms */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>2. LOAN TERMS</div>
        <div style={{ marginBottom: '15px' }}>
          The Lender agrees to lend the Borrower under the following terms:
        </div>
        
        <div style={{ paddingLeft: '20px' }}>
          <div style={{ marginBottom: '15px', lineHeight: '1.8' }}>
            <strong>a. Principal Amount:</strong> $
            <input
              type="number"
              value={localFormData.principalAmount}
              onChange={handleFieldChange('principalAmount')}
              placeholder="Amount Borrowed"
              style={{ ...inlineInputStyle, width: '150px' }}
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div style={{ marginBottom: '15px', lineHeight: '1.8' }}>
            <strong>b. Interest Rate:</strong>{' '}
            <input
              type="number"
              value={localFormData.interestRate}
              onChange={handleFieldChange('interestRate')}
              placeholder="Rate"
              style={{ ...inlineInputStyle, width: '80px' }}
              min="0"
              step="0.01"
              required
            />% compounded per: (check one)
            <div style={{ marginTop: '10px', marginLeft: '20px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label>
                  <input
                    type="radio"
                    name="interestCompoundPeriod"
                    value="month"
                    checked={localFormData.interestCompoundPeriod === 'month'}
                    onChange={() => handleRadioChange('interestCompoundPeriod', 'month')}
                    style={checkboxStyle}
                    required
                  />
                  Month
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label>
                  <input
                    type="radio"
                    name="interestCompoundPeriod"
                    value="annum"
                    checked={localFormData.interestCompoundPeriod === 'annum'}
                    onChange={() => handleRadioChange('interestCompoundPeriod', 'annum')}
                    style={checkboxStyle}
                    required
                  />
                  Annum
                </label>
              </div>
              <div style={{ lineHeight: '1.8' }}>
                <label>
                  <input
                    type="radio"
                    name="interestCompoundPeriod"
                    value="other"
                    checked={localFormData.interestCompoundPeriod === 'other'}
                    onChange={() => handleRadioChange('interestCompoundPeriod', 'other')}
                    style={checkboxStyle}
                    required
                  />
                  Other:{' '}
                  {localFormData.interestCompoundPeriod === 'other' && (
                    <input
                      type="text"
                      value={localFormData.interestCompoundOther}
                      onChange={handleFieldChange('interestCompoundOther')}
                      placeholder="Specify other period"
                      style={{ ...inlineInputStyle, width: '200px' }}
                      required
                    />
                  )}
                </label>
              </div>
            </div>
          </div>
          
          <div style={{ lineHeight: '1.8' }}>
            <strong>c. Borrower to Receive the Borrowed Money on:</strong>{' '}
            <input
              type="date"
              value={localFormData.borrowerReceiveDate}
              onChange={handleFieldChange('borrowerReceiveDate')}
              style={{ ...inlineInputStyle, width: '150px' }}
              required
            />
          </div>
        </div>
        
        <div style={{ marginTop: '20px', fontStyle: 'italic' }}>
          Hereinafter known as the "Borrowed Money."
        </div>
      </div>
      
      {/* Section 3 - Payments */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>3. PAYMENTS</div>
        <div style={{ marginBottom: '15px' }}>
          The full balance of the Borrowed Money, including all accrued interest and any other fees or penalties, is due and payable in: (check one)
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label>
              <input
                type="radio"
                name="paymentType"
                value="lump_sum"
                checked={localFormData.paymentType === 'lump_sum'}
                onChange={() => handleRadioChange('paymentType', 'lump_sum')}
                style={checkboxStyle}
                required
              />
              <strong>A LUMP SUM.</strong> The Borrower shall repay the Borrowed Money as a lump sum, in full, in the amount of $
              {localFormData.paymentType === 'lump_sum' && (
                <>
                  <input
                    type="number"
                    value={localFormData.lumpSumAmount}
                    onChange={handleFieldChange('lumpSumAmount')}
                    placeholder="Amount"
                    style={{ ...inlineInputStyle, width: '120px' }}
                    min="0"
                    step="0.01"
                    required
                  />
                  {' '}(principal and interest) by{' '}
                  <input
                    type="date"
                    value={localFormData.lumpSumDueDate}
                    onChange={handleFieldChange('lumpSumDueDate')}
                    style={{ ...inlineInputStyle, width: '150px' }}
                    required
                  />
                </>
              )}
              {' '}("Due Date").
            </label>
          </div>
          
          <div style={{ lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="paymentType"
                value="installments"
                checked={localFormData.paymentType === 'installments'}
                onChange={() => handleRadioChange('paymentType', 'installments')}
                style={checkboxStyle}
                required
              />
              <strong>INSTALLMENTS.</strong> Borrower shall pay principal and interest installment amounts equal to $
              {localFormData.paymentType === 'installments' && (
                <>
                  <input
                    type="number"
                    value={localFormData.installmentAmount}
                    onChange={handleFieldChange('installmentAmount')}
                    placeholder="Amount"
                    style={{ ...inlineInputStyle, width: '120px' }}
                    min="0"
                    step="0.01"
                    required
                  />
                  {' '}with the first (1st) payment due on{' '}
                  <input
                    type="date"
                    value={localFormData.firstPaymentDate}
                    onChange={handleFieldChange('firstPaymentDate')}
                    style={{ ...inlineInputStyle, width: '150px' }}
                    required
                  />
                  {' '}and the remaining payments to be paid: (check one)
                  <div style={{ marginTop: '10px', marginLeft: '20px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <label>
                        <input
                          type="radio"
                          name="installmentFrequency"
                          value="weekly"
                          checked={localFormData.installmentFrequency === 'weekly'}
                          onChange={() => handleRadioChange('installmentFrequency', 'weekly')}
                          style={{ marginRight: '5px' }}
                          required
                        />
                        Weekly with any remaining balance payable on{' '}
                        <input
                          type="date"
                          value={localFormData.finalPaymentDate}
                          onChange={handleFieldChange('finalPaymentDate')}
                          style={{ ...inlineInputStyle, width: '150px' }}
                          required
                        />
                        {' '}("Due Date").
                      </label>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <label>
                        <input
                          type="radio"
                          name="installmentFrequency"
                          value="monthly"
                          checked={localFormData.installmentFrequency === 'monthly'}
                          onChange={() => handleRadioChange('installmentFrequency', 'monthly')}
                          style={{ marginRight: '5px' }}
                          required
                        />
                        Monthly with any remaining balance payable on{' '}
                        <input
                          type="date"
                          value={localFormData.finalPaymentDate}
                          onChange={handleFieldChange('finalPaymentDate')}
                          style={{ ...inlineInputStyle, width: '150px' }}
                          required
                        />
                        {' '}("Due Date").
                      </label>
                    </div>
                    <div>
                      <label>
                        <input
                          type="radio"
                          name="installmentFrequency"
                          value="quarterly"
                          checked={localFormData.installmentFrequency === 'quarterly'}
                          onChange={() => handleRadioChange('installmentFrequency', 'quarterly')}
                          style={{ marginRight: '5px' }}
                          required
                        />
                        Quarterly with any remaining balance payable on{' '}
                        <input
                          type="date"
                          value={localFormData.finalPaymentDate}
                          onChange={handleFieldChange('finalPaymentDate')}
                          style={{ ...inlineInputStyle, width: '150px' }}
                          required
                        />
                        {' '}("Due Date").
                      </label>
                    </div>
                  </div>
                </>
              )}
            </label>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', fontStyle: 'italic' }}>
          Hereinafter known as the "Repayment Period."
        </div>
      </div>
      
      {/* Section 4 - Payment is Due */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>4. PAYMENT IS DUE</div>
        <div style={{ lineHeight: '1.8' }}>
          Any payment made by the Borrower is considered late if made more than{' '}
          <input
            type="number"
            value={localFormData.lateDays}
            onChange={handleFieldChange('lateDays')}
            placeholder="#"
            style={{ ...inlineInputStyle, width: '60px' }}
            min="1"
            required
          />
          {' '}day(s) after any payment due date ("Payment Due Date"). This shall include, but not be limited to, any payment made related to the Repayment Period, the Due Date, or any other payment mentioned in this Note.
        </div>
      </div>
      
      {/* Section 5 - Late Fee */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>5. LATE FEE</div>
        <div style={{ marginBottom: '15px' }}>
          If the Borrower makes a late payment for any Payment Due Date, there shall be: (check one)
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="radio"
                name="lateFeeType"
                value="no_late_fee"
                checked={localFormData.lateFeeType === 'no_late_fee'}
                onChange={() => handleRadioChange('lateFeeType', 'no_late_fee')}
                style={checkboxStyle}
                required
              />
              <strong>NO LATE FEE.</strong>
            </label>
          </div>
          
          <div style={{ lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="lateFeeType"
                value="late_fee"
                checked={localFormData.lateFeeType === 'late_fee'}
                onChange={() => handleRadioChange('lateFeeType', 'late_fee')}
                style={checkboxStyle}
                required
              />
              <strong>LATE FEE.</strong> The Borrower shall pay a late fee of $
              {localFormData.lateFeeType === 'late_fee' && (
                <>
                  <input
                    type="number"
                    value={localFormData.lateFeeAmount}
                    onChange={handleFieldChange('lateFeeAmount')}
                    placeholder="Amount"
                    style={{ ...inlineInputStyle, width: '100px' }}
                    min="0"
                    step="0.01"
                    required
                  />
                  {' '}for each: (check one)
                  <div style={{ marginTop: '10px', marginLeft: '20px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <label>
                        <input
                          type="radio"
                          name="lateFeeFrequency"
                          value="occurrence"
                          checked={localFormData.lateFeeFrequency === 'occurrence'}
                          onChange={() => handleRadioChange('lateFeeFrequency', 'occurrence')}
                          style={{ marginRight: '5px' }}
                          required
                        />
                        Occurrence payment is late.
                      </label>
                    </div>
                    <div>
                      <label>
                        <input
                          type="radio"
                          name="lateFeeFrequency"
                          value="day"
                          checked={localFormData.lateFeeFrequency === 'day'}
                          onChange={() => handleRadioChange('lateFeeFrequency', 'day')}
                          style={{ marginRight: '5px' }}
                          required
                        />
                        Day payment is late.
                      </label>
                    </div>
                  </div>
                </>
              )}
            </label>
          </div>
        </div>
      </div>
      
      {/* Section 6 - Security */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>6. SECURITY</div>
        <div style={{ marginBottom: '15px' }}>
          This Note shall be: (check one)
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="radio"
                name="securityType"
                value="unsecured"
                checked={localFormData.securityType === 'unsecured'}
                onChange={() => handleRadioChange('securityType', 'unsecured')}
                style={checkboxStyle}
                required
              />
              <strong>UNSECURED.</strong> There shall be no security provided in this Note.
            </label>
          </div>
          
          <div style={{ lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="securityType"
                value="secured"
                checked={localFormData.securityType === 'secured'}
                onChange={() => handleRadioChange('securityType', 'secured')}
                style={checkboxStyle}
                required
              />
              <strong>SECURED.</strong> There shall be property to secure this Note described as:{' '}
              {localFormData.securityType === 'secured' && (
                <input
                  type="text"
                  value={localFormData.securityDescription}
                  onChange={handleFieldChange('securityDescription')}
                  placeholder="Security Description"
                  style={{ ...inlineInputStyle, width: '300px' }}
                  required
                />
              )}
              {' '}("Security").
            </label>
          </div>
        </div>
        
        {localFormData.securityType === 'secured' && (
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
            The Security shall transfer to the possession and ownership of the Lender immediately pursuant to Section 11 of this Note. The Security may not be sold or transferred without the Lender's consent until the Due Date. If Borrower breaches this provision, Lender may declare all sums due under this Note immediately due and payable, unless prohibited by applicable law. The Lender shall have the sole option to accept the Security as full payment for the Borrowed Money without further liabilities or obligations. If the market value of the Security does not exceed the Borrowed Money, the Borrower shall remain liable for the balance due while accruing interest at the maximum rate allowed by law.
          </div>
        )}
      </div>
      
      {/* Section 7 - Co-Signer */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>7. CO-SIGNER</div>
        <div style={{ marginBottom: '15px' }}>
          (check one)
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="radio"
                name="coSignerType"
                value="no_cosigner"
                checked={localFormData.coSignerType === 'no_cosigner'}
                onChange={() => handleRadioChange('coSignerType', 'no_cosigner')}
                style={checkboxStyle}
                required
              />
              <strong>NO CO-SIGNER.</strong> This Note shall not have a Co-Signer.
            </label>
          </div>
          
          <div style={{ lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="coSignerType"
                value="cosigner"
                checked={localFormData.coSignerType === 'cosigner'}
                onChange={() => handleRadioChange('coSignerType', 'cosigner')}
                style={checkboxStyle}
                required
              />
              <strong>CO-SIGNER.</strong> This Note shall have a Co-Signer known as{' '}
              {localFormData.coSignerType === 'cosigner' && (
                <input
                  type="text"
                  value={localFormData.coSignerName}
                  onChange={handleFieldChange('coSignerName')}
                  placeholder="Co-Signer's Name"
                  style={{ ...inlineInputStyle, width: '200px' }}
                  required
                />
              )}
              {' '}("Co-Signer") who agrees to the liabilities and obligations on behalf of the Borrower under the terms of this Note. If the Borrower does not make payment, the Co-Signer shall be personally responsible and is guaranteeing the payment of the principal, late fees, and all accrued interest under the terms of this Note.
            </label>
          </div>
        </div>
      </div>
      
      {/* Section 8 - Prepayment Penalty */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>8. PREPAYMENT PENALTY</div>
        <div style={{ marginBottom: '15px' }}>
          The Borrower shall be charged: (check one)
        </div>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="radio"
                name="prepaymentPenaltyType"
                value="no_penalty"
                checked={localFormData.prepaymentPenaltyType === 'no_penalty'}
                onChange={() => handleRadioChange('prepaymentPenaltyType', 'no_penalty')}
                style={checkboxStyle}
                required
              />
              <strong>NO PRE-PAYMENT PENALTY.</strong> The Borrower is eligible to pre-pay the Borrowed Money, at any time, with no pre-payment fee.
            </label>
          </div>
          
          <div style={{ lineHeight: '1.8' }}>
            <label>
              <input
                type="radio"
                name="prepaymentPenaltyType"
                value="penalty"
                checked={localFormData.prepaymentPenaltyType === 'penalty'}
                onChange={() => handleRadioChange('prepaymentPenaltyType', 'penalty')}
                style={checkboxStyle}
                required
              />
              <strong>A PRE-PAYMENT PENALTY.</strong> If the Borrower pays any Borrowed Money to the Lender with the specific purpose of paying less interest, there shall be a pre-payment fee of: (check one)
              {localFormData.prepaymentPenaltyType === 'penalty' && (
                <div style={{ marginTop: '10px', marginLeft: '20px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <label>
                      <input
                        type="radio"
                        name="prepaymentPenaltyMethod"
                        value="amount"
                        checked={localFormData.prepaymentPenaltyMethod === 'amount'}
                        onChange={() => handleRadioChange('prepaymentPenaltyMethod', 'amount')}
                        style={{ marginRight: '5px' }}
                        required
                      />
                      $
                      <input
                        type="number"
                        value={localFormData.prepaymentPenaltyAmount}
                        onChange={handleFieldChange('prepaymentPenaltyAmount')}
                        placeholder="Amount"
                        style={{ ...inlineInputStyle, width: '100px' }}
                        min="0"
                        step="0.01"
                        required
                      />
                    </label>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label>
                      <input
                        type="radio"
                        name="prepaymentPenaltyMethod"
                        value="percent"
                        checked={localFormData.prepaymentPenaltyMethod === 'percent'}
                        onChange={() => handleRadioChange('prepaymentPenaltyMethod', 'percent')}
                        style={{ marginRight: '5px' }}
                        required
                      />
                      <input
                        type="number"
                        value={localFormData.prepaymentPenaltyPercent}
                        onChange={handleFieldChange('prepaymentPenaltyPercent')}
                        placeholder="Percent"
                        style={{ ...inlineInputStyle, width: '80px' }}
                        min="0"
                        step="0.01"
                        required
                      />
                      % of the pre-paid amount.
                    </label>
                  </div>
                  <div>
                    <label>
                      <input
                        type="radio"
                        name="prepaymentPenaltyMethod"
                        value="other"
                        checked={localFormData.prepaymentPenaltyMethod === 'other'}
                        onChange={() => handleRadioChange('prepaymentPenaltyMethod', 'other')}
                        style={{ marginRight: '5px' }}
                        required
                      />
                      Other.{' '}
                      <input
                        type="text"
                        value={localFormData.prepaymentPenaltyOther}
                        onChange={handleFieldChange('prepaymentPenaltyOther')}
                        placeholder="Describe other penalty"
                        style={{ ...inlineInputStyle, width: '250px' }}
                        required
                      />
                    </label>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>
      
      {/* Section 9 - Interest Due in Event of Default */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>9. INTEREST DUE IN THE EVENT OF DEFAULT</div>
        <div style={{ lineHeight: '1.6' }}>
          In the event the Borrower fails to pay the Note in full on the Due Date, the unpaid principal shall accrue interest at the maximum rate allowed by law until the Borrower is no longer in default.
        </div>
      </div>
      
      {/* Section 10 - Allocation of Payments */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>10. ALLOCATION OF PAYMENTS</div>
        <div style={{ lineHeight: '1.6' }}>
          Payments shall be first (1st) credited to any late fees due, second (2nd) any to interest due, and any remainder will be credited to the principal.
        </div>
      </div>
      
      {/* Section 11 - Acceleration */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>11. ACCELERATION</div>
        <div style={{ lineHeight: '1.6' }}>
          If the Borrower is in default under this Note or is in default under another provision of this Note, and such default is not cured within the minimum allotted time by law after written notice of such default, then Lender may, at its option, declare all outstanding sums owed on this Note to be immediately due and payable. This includes any rights of possession in relation to the Security described in Section 6.
        </div>
      </div>
      
      {/* Section 12 - Attorneys' Fees and Costs */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>12. ATTORNEYS' FEES AND COSTS</div>
        <div style={{ lineHeight: '1.6' }}>
          Borrower shall pay all costs incurred by Lender in collecting sums due under this Note after a default, including reasonable attorneys' fees. If Lender or Borrower sues to enforce this Note or to obtain a declaration of its rights hereunder, the prevailing party in any such proceeding shall be entitled to recover its reasonable attorneys' fees and costs incurred in the proceeding (including those incurred in any bankruptcy proceeding or appeal) from the non-prevailing party.
        </div>
      </div>
      
      {/* Section 13 - Waiver of Presentments */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>13. WAIVER OF PRESENTMENTS</div>
        <div style={{ lineHeight: '1.6' }}>
          Borrower waives presentment for payment, a notice of dishonor, protest, and notice of protest.
        </div>
      </div>
      
      {/* Section 14 - Non-Waiver */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>14. NON-WAIVER</div>
        <div style={{ lineHeight: '1.6' }}>
          No failure or delay by Lender in exercising Lender's rights under this Note shall be considered a waiver of such rights.
        </div>
      </div>
      
      {/* Section 15 - Severability */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>15. SEVERABILITY</div>
        <div style={{ lineHeight: '1.6' }}>
          In the event that any provision herein is determined to be void or unenforceable for any reason, such determination shall not affect the validity or enforceability of any other provision, all of which shall remain in full force and effect.
        </div>
      </div>
      
      {/* Section 16 - Integration */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>16. INTEGRATION</div>
        <div style={{ lineHeight: '1.6' }}>
          There are no agreements, verbal or otherwise that modify or affect the terms of this Note. This Note may not be modified or amended except by a written agreement signed by Borrower and Lender.
        </div>
      </div>
      
      {/* Section 17 - Conflicting Terms */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>17. CONFLICTING TERMS</div>
        <div style={{ lineHeight: '1.6' }}>
          The terms of this Note shall control over any conflicting terms in any referenced agreement or document.
        </div>
      </div>
      
      {/* Section 18 - Notice */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>18. NOTICE</div>
        <div style={{ lineHeight: '1.6' }}>
          Any notices required or permitted to be given hereunder shall be given in writing and shall be delivered (a) in person, (b) by certified mail, postage prepaid, return receipt requested, (c) by facsimile, or (d) by a commercial overnight courier that guarantees next day delivery and provides a receipt, and such notices shall be made to the parties at the addresses listed above.
        </div>
      </div>
      
      {/* Section 19 - Execution */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>19. EXECUTION</div>
        <div style={{ lineHeight: '1.6' }}>
          The Borrower executes this Note as a principal and not as a surety. If there is a Co-Signer, the Borrower and Co-Signer shall be jointly and severally liable under this Note.
        </div>
      </div>
      
      {/* Section 20 - Governing Law */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>20. GOVERNING LAW</div>
        <div style={{ lineHeight: '1.8' }}>
          This note shall be governed under the laws in the State of{' '}
          <input
            type="text"
            value={localFormData.governingLaw}
            onChange={handleFieldChange('governingLaw')}
            placeholder="State"
            style={{ ...inlineInputStyle, width: '150px' }}
            required
          />.
        </div>
      </div>
      
      {/* Section 21 - Additional Terms & Conditions */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>21. ADDITIONAL TERMS & CONDITIONS</div>
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
      
      {/* Section 22 - Entire Agreement */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>22. ENTIRE AGREEMENT</div>
        <div style={{ lineHeight: '1.6' }}>
          This Note contains all the terms agreed to by the parties relating to its subject matter, including any attachments or addendums. This Note replaces all previous discussions, understandings, and oral agreements. The Borrower and Lender agree to the terms and conditions and shall be bound until the Borrower repays the Borrowed Money in full.
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
          BY SIGNING BELOW, the parties acknowledge that they have read, understood, and agree to be bound by the terms and conditions of this Promissory Note.
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: localFormData.coSignerType === 'cosigner' ? '1fr 1fr 1fr' : '1fr 1fr', 
          gap: '60px',
          maxWidth: localFormData.coSignerType === 'cosigner' ? '1200px' : '800px',
          margin: '0 auto'
        }}>
          {/* Lender Signature */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '20px', 
              fontSize: '16px',
              color: '#2d3748'
            }}>
              LENDER
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <input
                type="text"
                value={localFormData.lenderSignature}
                onChange={handleFieldChange('lenderSignature')}
                placeholder="Sign your name here"
                style={{
                  width: '100%',
                  maxWidth: '250px',
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
                Lender's Signature
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
                  value={localFormData.lenderSignatureDate}
                  onChange={handleFieldChange('lenderSignatureDate')}
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
                  value={localFormData.lenderPrintName}
                  onChange={handleFieldChange('lenderPrintName')}
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
          
          {/* Borrower Signature */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '20px', 
              fontSize: '16px',
              color: '#2d3748'
            }}>
              BORROWER
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <input
                type="text"
                value={localFormData.borrowerSignature}
                onChange={handleFieldChange('borrowerSignature')}
                placeholder="Sign your name here"
                style={{
                  width: '100%',
                  maxWidth: '250px',
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
                Borrower's Signature
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
                  value={localFormData.borrowerSignatureDate}
                  onChange={handleFieldChange('borrowerSignatureDate')}
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
                  value={localFormData.borrowerPrintName}
                  onChange={handleFieldChange('borrowerPrintName')}
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
          
          {/* Co-Signer Signature (if applicable) */}
          {localFormData.coSignerType === 'cosigner' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '20px', 
                fontSize: '16px',
                color: '#2d3748'
              }}>
                CO-SIGNER
              </div>
              
              <div style={{ marginBottom: '30px' }}>
                <input
                  type="text"
                  value={localFormData.coSignerSignature}
                  onChange={handleFieldChange('coSignerSignature')}
                  placeholder="Sign your name here"
                  style={{
                    width: '100%',
                    maxWidth: '250px',
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
                  Co-Signer's Signature
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
                    value={localFormData.coSignerSignatureDate}
                    onChange={handleFieldChange('coSignerSignatureDate')}
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
                    value={localFormData.coSignerPrintName}
                    onChange={handleFieldChange('coSignerPrintName')}
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
          )}
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
          This promissory note is legally binding when signed by all parties.
        </div>
      </div>
      
    </FormWrapper>
  );
};

export default PromissoryNoteForm;
