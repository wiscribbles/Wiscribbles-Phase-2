'use client';
import React, { useState, useEffect } from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';

const StandardLeaseAgreementForm = ({ formData = {}, onFormDataChange, onProceed }) => {
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
    tenantName: '',
    tenantMailingAddress: '',
    tenantCity: '',
    tenantState: '',
    
    // Property Information
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    
    // Term Information
    leaseCommenceDate: '',
    leaseCommenceYear: '',
    leaseEndDate: '',
    leaseEndYear: '',
    
    // Rent Information
    monthlyRent: '',
    rentDueDay: '',
    
    // Late Rent
    lateFeeGraceDays: '',
    lateFeeType: 'fixed', // 'fixed' or 'percentage'
    lateFeeAmount: '',
    lateFeePercentage: '',
    lateFeeFrequency: 'per_day', // 'per_day' or 'per_occurrence'
    
    // Returned Checks
    returnedCheckFee: '',
    
    // Rent Increases
    rentIncreaseNotice: '',
    
    // Security Deposit
    securityDepositAmount: '',
    
    // Use of Property - Authorized Occupants
    authorizedOccupants: '',
    
    // Assignment/Sub-letting
    sublettingAllowed: 'not_allowed', // 'not_allowed' or 'allowed'
    
    // Animals/Pets
    petsAllowed: 'not_allowed', // 'not_allowed' or 'allowed'
    numberOfPets: '',
    petTypes: [],
    petWeightLimit: '',
    petWeightUnit: 'pounds',
    petFeePerPet: '',
    petOtherType: '',
    
    // Notice Address
    landlordNoticeAddress: '',
    
    // Lead-Based Paint Disclosure
    propertyBuiltBefore1978: false,
    leadPaintDisclosureReceived: false,
    
    ...formData
  });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    onFormDataChange(localFormData);
  }, [localFormData, onFormDataChange]);

  useEffect(() => {
    const requiredFields = [
      'landlordName', 'tenantName', 'propertyAddress', 'monthlyRent', 
      'leaseCommenceDate', 'leaseEndDate', 'securityDepositAmount', 'rentDueDay'
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

  const handlePetTypesChange = (petType) => (e) => {
    if (e.target.checked) {
      setLocalFormData(prev => ({ ...prev, petTypes: [...prev.petTypes, petType] }));
    } else {
      setLocalFormData(prev => ({ ...prev, petTypes: prev.petTypes.filter(type => type !== petType) }));
    }
  };

  const inputStyle = {
    border: '1px solid #E2E8F0',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '14px',
    fontFamily: 'inherit'
  };

  const handleRadioChange = (field, value) => {
    setLocalFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <FormWrapper 
      title="Standard Lease Agreement" 
      subtitle="Complete this standard residential lease agreement"
      onProceed={() => isValid && onProceed()} 
      isValid={isValid}
    >
      <div style={{ marginBottom: '30px' }}>
        
        
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>THIS AGREEMENT (hereinafter referred to as the "Standard Lease Agreement") is made and entered into this</span>
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
            maxLength="2"
            style={{ ...inputStyle, width: '60px' }}
            required
          />
          <span>, by and between the Landlord known as</span>
          <input
            type="text"
            value={localFormData.landlordName}
            onChange={handleFieldChange('landlordName')}
            placeholder="Landlord's full name or company name"
            style={{ ...inputStyle, minWidth: '250px', flex: '1' }}
            required
          />
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
          <span>(hereinafter referred to as "Landlord") and the Tenant known as</span>
          <input
            type="text"
            value={localFormData.tenantName}
            onChange={handleFieldChange('tenantName')}
            placeholder="Tenant's full name or company name"
            style={{ ...inputStyle, minWidth: '250px', flex: '1' }}
            required
          />
          <span>with a mailing address of</span>
        </div>
        
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <input
            type="text"
            value={localFormData.tenantMailingAddress}
            onChange={handleFieldChange('tenantMailingAddress')}
            placeholder="Tenant's complete mailing address"
            style={{ ...inputStyle, minWidth: '300px', flex: '1' }}
          />
          <span>, City of</span>
          <input
            type="text"
            value={localFormData.tenantCity}
            onChange={handleFieldChange('tenantCity')}
            placeholder="City"
            style={{ ...inputStyle, minWidth: '120px' }}
          />
          <span>, State of</span>
          <input
            type="text"
            value={localFormData.tenantState}
            onChange={handleFieldChange('tenantState')}
            placeholder="State"
            style={{ ...inputStyle, minWidth: '100px' }}
          />
          <span>(hereinafter referred to as "Tenant").</span>
        </div>
        
        <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          For and in consideration of the covenants and obligations contained herein and other good and valuable consideration, 
          the receipt and sufficiency of which is hereby acknowledged, the parties hereto hereby agree as follows:
        </p>
      </div>

      {/* Section 1: PROPERTY */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>1. PROPERTY.</h5>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>Landlord owns certain real property and improvements located at</span>
          <input
            type="text"
            value={localFormData.propertyAddress}
            onChange={handleFieldChange('propertyAddress')}
            placeholder="Property address"
            style={{ ...inputStyle, minWidth: '300px', flex: '1' }}
            required
          />
          <span>, City of</span>
          <input
            type="text"
            value={localFormData.propertyCity}
            onChange={handleFieldChange('propertyCity')}
            placeholder="City"
            style={{ ...inputStyle, minWidth: '120px' }}
          />
          <span>, State of</span>
          <input
            type="text"
            value={localFormData.propertyState}
            onChange={handleFieldChange('propertyState')}
            placeholder="State"
            style={{ ...inputStyle, minWidth: '100px' }}
          />
        </div>
        <p>(hereinafter referred to as the "Property"). Landlord desires to lease the Property to Tenant upon the terms and conditions contained herein. Tenant desires to lease the Property from Landlord upon the terms and conditions contained herein.</p>
      </div>

      {/* Section 2: TERM */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>2. TERM.</h5>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>This Standard Lease Agreement shall commence on</span>
          <input
            type="date"
            value={localFormData.leaseCommenceDate}
            onChange={handleFieldChange('leaseCommenceDate')}
            style={{ ...inputStyle, minWidth: '150px' }}
            required
          />
          <span>, and end on</span>
          <input
            type="date"
            value={localFormData.leaseEndDate}
            onChange={handleFieldChange('leaseEndDate')}
            style={{ ...inputStyle, minWidth: '150px' }}
            required
          />
          <span>, at 11:59 PM local time (hereinafter referred to as the "Term").</span>
        </div>
        <p style={{ lineHeight: '1.6' }}>
          Upon the end of the Term, Tenant shall be required to vacate the Property unless one of the following circumstances occur:
          <br />i. Landlord and Tenant formally extend this Standard Lease Agreement in writing or create and execute a new, written and signed Standard Lease Agreement; or
          <br />ii. Landlord willingly accepts new Rent from Tenant, which does not constitute past due Rent.
        </p>
        <p style={{ lineHeight: '1.6', marginTop:'10px' }}>
          In the event that Landlord accepts new rent from Tenant after the termination date, a month-to-month tenancy shall be created. 
          If at any time either party desires to terminate the month-to-month tenancy, such party may do so by providing to the other party 
          written notice of intention to terminate at least thirty (30) days prior to the desired date or the minimum time-period required by the State, whichever is less.
        </p>
      </div>

      {/* Section 3: RENT */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>3. RENT.</h5>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>Tenant shall pay to Landlord the sum of $</span>
          <input
            type="number"
            value={localFormData.monthlyRent}
            onChange={handleFieldChange('monthlyRent')}
            placeholder="0.00"
            style={{ ...inputStyle, minWidth: '100px' }}
            required
          />
          <span>per month (hereinafter referred to as "Rent") for the Term of the Agreement. The due date for Rent payment shall be the</span>
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
          <span>day of each calendar month and shall be considered advance payment for that month (hereinafter referred to as the "Due Date").</span>
        </div>
        <p>Weekends and holidays do not delay or excuse Tenant's obligation to pay Rent in a timely manner.</p>
        
        <div style={{ marginTop: '20px' }}>
          <h6 style={{ fontWeight: '600', marginBottom: '15px' }}>A. Late Rent.</h6>
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>If Rent is not paid within</span>
            <input
              type="number"
              value={localFormData.lateFeeGraceDays}
              onChange={handleFieldChange('lateFeeGraceDays')}
              placeholder="Days"
              style={{ ...inputStyle, width: '60px' }}
            />
            <span>days of the Due Date, the Rent shall be considered past due and a late fee of</span>
            
            <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', marginRight: '8px' }}>
              <input
                type="checkbox"
                checked={localFormData.lateFeeType === 'fixed'}
                onChange={() => handleRadioChange('lateFeeType', 'fixed')}
                style={{ marginRight: '4px' }}
              />
              <span>$</span>
              <input
                type="number"
                value={localFormData.lateFeeAmount}
                onChange={handleFieldChange('lateFeeAmount')}
                placeholder="Amount"
                style={{ ...inputStyle, width: '80px', marginLeft: '4px' }}
                disabled={localFormData.lateFeeType !== 'fixed'}
              />
            </label>
            
            <span>or</span>
            
            <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', marginRight: '8px' }}>
              <input
                type="checkbox"
                checked={localFormData.lateFeeType === 'percentage'}
                onChange={() => handleRadioChange('lateFeeType', 'percentage')}
                style={{ marginRight: '4px' }}
              />
              <input
                type="number"
                value={localFormData.lateFeePercentage}
                onChange={handleFieldChange('lateFeePercentage')}
                placeholder="%"
                style={{ ...inputStyle, width: '60px', marginRight: '4px' }}
                disabled={localFormData.lateFeeType !== 'percentage'}
              />
              <span>% of the Rent past due</span>
            </label>
            
            <span>shall be applied for every</span>
            
            <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px', marginRight: '8px' }}>
              <input
                type="checkbox"
                checked={localFormData.lateFeeFrequency === 'per_day'}
                onChange={() => handleRadioChange('lateFeeFrequency', 'per_day')}
                style={{ marginRight: '4px' }}
              />
              <span>day Rent is late</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
              <input
                type="checkbox"
                checked={localFormData.lateFeeFrequency === 'per_occurrence'}
                onChange={() => handleRadioChange('lateFeeFrequency', 'per_occurrence')}
                style={{ marginRight: '4px' }}
              />
              <span>occurrence Rent is late.</span>
            </label>
          </div>
          
          <h6 style={{ fontWeight: '600', marginBottom: '15px', marginTop: '20px' }}>B. Returned Checks.</h6>
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>In the event that any payment by Tenant is returned for insufficient funds ("NSF") or if Tenant stops payment, Tenant will pay $</span>
            <input
              type="number"
              value={localFormData.returnedCheckFee}
              onChange={handleFieldChange('returnedCheckFee')}
              placeholder="0.00"
              style={{ ...inputStyle, minWidth: '80px' }}
            />
            <span>to Landlord for each such check, plus late Rent penalties, as described above, until Landlord has received payment.</span>
          </div>
          
          <h6 style={{ fontWeight: '600', marginBottom: '15px', marginTop: '20px' }}>C. Order in which Funds are Applied.</h6>
          <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
            Landlord will apply all funds received from Tenant first to any non-rent obligations of Tenant, including late charges, returned check charges, charge-backs for repairs, brokerage fees, and periodic utilities, then to Rent, regardless of any notations on a check.
          </p>
          
          <h6 style={{ fontWeight: '600', marginBottom: '15px', marginTop: '20px' }}>D. Rent Increases.</h6>
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>There will be no rent increases through the Term of the Standard Lease Agreement. If this lease is renewed automatically on a month-to-month basis, Landlord may increase the rent during the renewal period by providing written notice to Tenant that becomes effective the month following the</span>
            <input
              type="number"
              value={localFormData.rentIncreaseNotice}
              onChange={handleFieldChange('rentIncreaseNotice')}
              placeholder="Days"
              style={{ ...inputStyle, width: '60px' }}
            />
            <span>day after the notice is provided.</span>
          </div>
        </div>
      </div>

      {/* Section 4: SECURITY DEPOSIT */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>4. SECURITY DEPOSIT.</h5>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>Upon execution of this Standard Lease Agreement, Tenant shall deposit with Landlord the sum of $</span>
          <input
            type="number"
            value={localFormData.securityDepositAmount}
            onChange={handleFieldChange('securityDepositAmount')}
            placeholder="0.00"
            style={{ ...inputStyle, minWidth: '100px' }}
            required
          />
          <span>(hereinafter referred to as the "Security Deposit") receipt of which is hereby acknowledged by Landlord, as security for any damage caused to the Property during the term hereof.</span>
        </div>
        <p style={{ lineHeight: '1.6' }}>
          Landlord may place the Security Deposit in an interest-bearing account and any interest earned will be paid to Landlord or Landlord's representative.
        </p>
        
        <div style={{ marginTop: '20px' }}>
          <h6 style={{ fontWeight: '600', marginBottom: '15px' }}>A. Refunds.</h6>
          <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
            Upon termination of the tenancy, all funds held by the landlord as Security Deposit may be applied to the payment of accrued rent and the amount of damages that the landlord has suffered by reason of the tenant's noncompliance with the terms of this Standard Lease Agreement or with any and all laws, ordinances, rules, and orders of any and all governmental or quasi-governmental authorities affecting the cleanliness, use, occupancy, and preservation of the Property.
          </p>
          
          <h6 style={{ fontWeight: '600', marginBottom: '15px', marginTop: '20px' }}>B. Deductions.</h6>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>Landlord may deduct reasonable charges from the Security Deposit for:</p>
          <div style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <p style={{ margin: '5px 0' }}>(1.) Unpaid or accelerated rent;</p>
            <p style={{ margin: '5px 0' }}>(2.) Late charges;</p>
            <p style={{ margin: '5px 0' }}>(3.) Unpaid utilities;</p>
            <p style={{ margin: '5px 0' }}>(4.) Costs of cleaning, deodorizing, and repairing the Property and its contents for which Tenant is responsible;</p>
            <p style={{ margin: '5px 0' }}>(5.) Pet violation charges;</p>
            <p style={{ margin: '5px 0' }}>(6.) Replacing unreturned keys, garage door openers, or other security devices;</p>
            <p style={{ margin: '5px 0' }}>(7.) The removal of unauthorized locks or fixtures installed by Tenant;</p>
            <p style={{ margin: '5px 0' }}>(8.) Insufficient light bulbs;</p>
            <p style={{ margin: '5px 0' }}>(9.) Packing, removing, and storing abandoned property;</p>
            <p style={{ margin: '5px 0' }}>(10.) Removing abandoned or illegally parked vehicles;</p>
            <p style={{ margin: '5px 0' }}>(11.) Costs of reletting, if Tenant is in default;</p>
            <p style={{ margin: '5px 0' }}>(12.) Attorney fees and costs of court incurred in any proceeding against Tenant;</p>
            <p style={{ margin: '5px 0' }}>(13.) Any fee due for early removal of an authorized key box; and</p>
            <p style={{ margin: '5px 0' }}>(14.) Other items Tenant is responsible to pay under this Lease.</p>
          </div>
          <p style={{ lineHeight: '1.6', marginTop: '15px' }}>
            If deductions exceed the Security Deposit, Tenant will pay Landlord the excess amount within ten (10) days after Landlord makes written demand. The Security Deposit will be applied first to any non-rent items, including late charges, returned check charges, repairs, brokerage fees, and periodic utilities, then to any unpaid rent.
          </p>
          
          <h6 style={{ fontWeight: '600', marginBottom: '15px', marginTop: '20px' }}>C. Returning.</h6>
          <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
            The Landlord shall return the Security Deposit to the Tenant within the requirements within the State or sixty (60) days from the end of the Term, whichever is less.
          </p>
        </div>
      </div>

      {/* Section 5: USE OF PROPERTY */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>5. USE OF PROPERTY.</h5>
        <div style={{ marginBottom: '15px' }}>
          <span>The Property shall be used and occupied solely by Tenant and Tenant's immediate family, consisting of only the following named person(s):</span>
        </div>
        <textarea
          value={localFormData.authorizedOccupants}
          onChange={handleFieldChange('authorizedOccupants')}
          placeholder="List the names of all authorized occupants"
          style={{ ...inputStyle, width: '100%', minHeight: '60px', resize: 'vertical', marginBottom: '15px' }}
        />
        <p style={{ lineHeight: '1.6' }}>
          and to be used exclusively as a private single family dwelling, and no part of the Property shall be used at any time during the term 
          of this Standard Lease Agreement by Tenant for the purpose of carrying on any business, profession, or trade of any kind, or for any purpose other than as a private single family dwelling. Tenant shall not allow any other person, other than Tenant's immediate family or transient relatives and friends who are guests of Tenant, to use or occupy the Property without first obtaining Landlord's written consent to such use. Tenant shall comply with any and all laws, ordinances, rules, and orders of any and all governmental or quasi-governmental authorities affecting the cleanliness, use, occupancy, and preservation of the Property
        </p>
      </div>

      {/* Section 6: CONDITION OF THE PROPERTY */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>6. CONDITION OF THE PROPERTY.</h5>
        <p style={{ lineHeight: '1.6' }}>
          Tenant stipulates, represents, and warrants that Tenant has examined the Property and that they are at the time of this Lease in good order, repair, and in a safe, clean, and tenantable condition.
        </p>
      </div>

      {/* Section 7: ASSIGNMENT/SUB-LETTING */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>7. ASSIGNMENT/SUB-LETTING.</h5>
        <p style={{ marginBottom: '15px' }}>Under this Standard Lease Agreement: (check one)</p>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.sublettingAllowed === 'not_allowed'}
                onChange={() => handleRadioChange('sublettingAllowed', 'not_allowed')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <span>Sub-Letting Not Allowed. Tenant shall not assign this Standard Lease Agreement or sublet or grant any license to use the Property or any part thereof without the prior written consent of Landlord. A consent by Landlord to one such assignment, sub-letting, or license shall not be deemed to be a consent to any subsequent assignment, sub-letting, or license. An assignment, sub-letting, or license without the prior written consent of Landlord or an assignment or sub-letting by operation of law shall be absolutely null and void and shall, at Landlord's option, terminate this Standard Lease Agreement.</span>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.sublettingAllowed === 'allowed'}
                onChange={() => handleRadioChange('sublettingAllowed', 'allowed')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <span>Sub-Letting Allowed. Tenant shall have the right to sublet and grant a license to other individual(s) to use the Property or any part thereof without the prior written consent of the Landlord. In the event the Tenant shall sublet the Property, notice shall be given to the Landlord within five (5) days of the Sub-Tenant’s name and address. In the event the Sub-Tenant violates any portion of this Standard Lease Agreement, all liability shall be held against the Tenant.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 8: ALTERATIONS AND IMPROVEMENTS */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>8. ALTERATIONS AND IMPROVEMENTS.</h5>
        <p style={{ lineHeight: '1.6' }}>
          Tenant shall make no alterations to the buildings or improvements on the Property or construct any building or make any other improvements on the Property without the prior written consent of Landlord. Any and all alterations, changes, and/or improvements built, constructed, or placed on the Property by Tenant shall, unless otherwise provided by written agreement between Landlord and Tenant, be and become the property of Landlord and remain on the Property at the expiration or earlier termination of this Standard Lease Agreement.
        </p>
      </div>

      {/* Section 9: NON-DELIVERY OF POSSESSION */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>9. NON-DELIVERY OF POSSESSION.</h5>
        <p style={{ lineHeight: '1.6' }}>
          In the event Landlord cannot deliver possession of the Property to Tenant upon the commencement of the Lease term, through no fault of Landlord or its agents, then Landlord or its agents shall have no liability, but the rental herein provided shall abate until possession is given. Landlord or its agents shall have thirty (30) days in which to give possession and, if possession is tendered within such time, Tenant agrees to accept the demised Property and pay the rental herein provided from that date. In the event possession cannot be delivered within such time, through no fault of Landlord or its agents, then this Standard Lease Agreement and all rights hereunder shall terminate.
        </p>
      </div>

      {/* Section 10: HAZARDOUS MATERIALS */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>10. HAZARDOUS MATERIALS.</h5>
        <p style={{ lineHeight: '1.6' }}>
          Tenant shall not keep on the Property any item of a dangerous, flammable or explosive, nature that might unreasonably increase the danger of fire or explosion on the Property or that might be considered hazardous or extra hazardous by any responsible insurance company.
        </p>
      </div>

      {/* Section 11: UTILITIES */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>11. UTILITIES.</h5>
        <p style={{ lineHeight: '1.6' }}>
          Tenant shall be responsible for arranging for and paying for all utility services required on the Property.
        </p>
      </div>

      {/* Section 12: MAINTENANCE, REPAIR, AND RULES */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>12. MAINTENANCE, REPAIR, AND RULES.</h5>
        <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>
          Tenant will, at its sole expense, keep and maintain the Property and appurtenances in good and sanitary condition and repair during the term of this Standard Lease Agreement and any renewal thereof. Without limiting the generality of the foregoing, Tenant shall:
        </p>
        
        <div style={{ marginLeft: '20px', lineHeight: '1.6' }}>
          <p style={{ margin: '10px 0' }}><strong>A.</strong> Not obstruct the driveways, sidewalks, courts, entry ways, stairs and/or halls, which shall be used for the purposes of ingress and egress only;</p>
          <p style={{ margin: '10px 0' }}><strong>B.</strong> Keep all windows, glass, window coverings, doors, locks, and hardware in good, clean order and repair;</p>
          <p style={{ margin: '10px 0' }}><strong>C.</strong> Not obstruct or cover the windows or doors; Not leave windows or doors in an open position during any inclement weather;</p>
          <p style={{ margin: '10px 0' }}><strong>D.</strong> Not hang any laundry, clothing, sheets, etc., from any window, rail, porch or balcony nor air or dry any of same within any yard area or space;</p>
          <p style={{ margin: '10px 0' }}><strong>E.</strong> Not cause or permit any locks or hooks to be placed upon any door or window without the prior written consent of Landlord;</p>
          <p style={{ margin: '10px 0' }}><strong>F.</strong> Keep all air conditioning filters clean and free from dirt;</p>
          <p style={{ margin: '10px 0' }}><strong>G.</strong> Keep all lavatories, sinks, toilets, and all other water and plumbing apparatus in good order and repair and shall use the same only for the purposes for which they were constructed;</p>
          <p style={{ margin: '10px 0' }}><strong>H.</strong> Tenant shall not allow any sweepings, rubbish, sand, rags, ashes, or other substances to be thrown or deposited into any water or plumbing apparatus. Any damage to any such apparatus and the cost of clearing stopped plumbing resulting from misuse shall be borne by Tenant;</p>
          <p style={{ margin: '10px 0' }}><strong>I.</strong> Tenant's family and guests shall at all times maintain order in the Property and at all places on the Property, and shall not make or permit any loud or improper noises, or otherwise disturb other residents; Keep all radios, television sets, stereos, phonographs, etc., turned down to a level of sound that does not annoy or interfere with other residents;</p>
          <p style={{ margin: '10px 0' }}><strong>J.</strong> Deposit all trash, garbage, rubbish, or refuse in the locations provided and shall not allow any trash, garbage, rubbish, or refuse to be deposited or permitted to stand on the exterior of any building or within the common elements;</p>
          <p style={{ margin: '10px 0' }}><strong>K.</strong> Abide by and be bound by any and all rules and regulations affecting the Property or the common area appurtenant thereto which may be adopted or promulgated by the Condominium or Homeowners' Association having control over them.</p>
        </div>
      </div>

      {/* Section 13: ANIMALS */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>13. ANIMALS.</h5>
        <p style={{ marginBottom: '15px' }}>Under this Standard Lease Agreement: (check one)</p>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.petsAllowed === 'allowed'}
                onChange={() => handleRadioChange('petsAllowed', 'allowed')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>Pets Allowed. The Tenant shall be allowed to have</span>
                <input
                  type="number"
                  value={localFormData.numberOfPets}
                  onChange={handleFieldChange('numberOfPets')}
                  placeholder="#"
                  style={{ ...inputStyle, width: '50px' }}
                  disabled={localFormData.petsAllowed !== 'allowed'}
                />
                <span>pet(s) on the Property consisting of</span>
                
                <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.petTypes.includes('Dogs')}
                    onChange={handlePetTypesChange('Dogs')}
                    style={{ marginRight: '4px' }}
                    disabled={localFormData.petsAllowed !== 'allowed'}
                  />
                  <span>Dogs</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.petTypes.includes('Cats')}
                    onChange={handlePetTypesChange('Cats')}
                    style={{ marginRight: '4px' }}
                    disabled={localFormData.petsAllowed !== 'allowed'}
                  />
                  <span>Cats</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.petTypes.includes('Fish')}
                    onChange={handlePetTypesChange('Fish')}
                    style={{ marginRight: '4px' }}
                    disabled={localFormData.petsAllowed !== 'allowed'}
                  />
                  <span>Fish</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.petTypes.includes('Other')}
                    onChange={handlePetTypesChange('Other')}
                    style={{ marginRight: '4px' }}
                    disabled={localFormData.petsAllowed !== 'allowed'}
                  />
                  <span>Other</span>
                  {localFormData.petTypes.includes('Other') && (
                    <input
                      type="text"
                      value={localFormData.petOtherType}
                      onChange={handleFieldChange('petOtherType')}
                      placeholder="Specify"
                      style={{ ...inputStyle, width: '100px', marginLeft: '8px' }}
                      disabled={localFormData.petsAllowed !== 'allowed'}
                    />
                  )}
                </label>
                
                <span>not weighing more than</span>
                <input
                  type="number"
                  value={localFormData.petWeightLimit}
                  onChange={handleFieldChange('petWeightLimit')}
                  placeholder="Weight"
                  style={{ ...inputStyle, width: '70px' }}
                  disabled={localFormData.petsAllowed !== 'allowed'}
                />
                
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.petWeightUnit === 'pounds'}
                    onChange={() => handleRadioChange('petWeightUnit', 'pounds')}
                    style={{ marginRight: '4px' }}
                    disabled={localFormData.petsAllowed !== 'allowed'}
                  />
                  <span>pounds</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                  <input
                    type="checkbox"
                    checked={localFormData.petWeightUnit === 'kilograms'}
                    onChange={() => handleRadioChange('petWeightUnit', 'kilograms')}
                    style={{ marginRight: '4px' }}
                    disabled={localFormData.petsAllowed !== 'allowed'}
                  />
                  <span>kilograms</span>
                </label>
                
                <span>. The Landlord shall administer a fee of $</span>
                <input
                  type="number"
                  value={localFormData.petFeePerPet}
                  onChange={handleFieldChange('petFeePerPet')}
                  placeholder="0.00"
                  style={{ ...inputStyle, width: '80px' }}
                  disabled={localFormData.petsAllowed !== 'allowed'}
                />
                <span>per pet on the Property. Landlord shall be held harmless in the event any of the Tenant’s pets cause harm, injury, death, or sickness to another individual or animal. Tenant is responsible and liable for any damage or required cleaning to the Property caused by any authorized or unauthorized animal and for all costs Landlord may incur in removing or causing any animal to be removed.</span>
              </div>
            </label>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localFormData.petsAllowed === 'not_allowed'}
                onChange={() => handleRadioChange('petsAllowed', 'not_allowed')}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <span>Pets Not Allowed. There shall be no animals permitted on the Property or in any common areas UNLESS said pet is legally allowed under law in regard to assistance with a disability. Pets shall include, but not be limited to, any mammal, reptile, bird, fish, rodent, or insect on the Property. If the Tenant violates this provision by having a pet on the Property, this Standard Lease Agreement shall terminate immediately and the Tenant shall be charged a fee equivalent to one (1) month’s rent. If the pet is left on the Property after the Tenant has been removed from the Property, the Landlord agrees to release the pet to the local animal shelter.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 14: QUIET ENJOYMENT */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>14. QUIET ENJOYMENT.</h5>
        <p style={{ lineHeight: '1.6' }}>
          Upon payment of all of the sums referred to herein as being payable by Tenant and Tenant's performance of all Tenant's agreements contained herein and Tenant's observance of all rules and regulations, Tenant shall and may peacefully and quietly have, hold, and enjoy said Property for the term hereof.
        </p>
      </div>

      {/* Section 15: INDEMNIFICATION */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>15. INDEMNIFICATION.</h5>
        <p style={{ lineHeight: '1.6' }}>
          Landlord shall not be liable for any injury to the tenant, tenant's family, guests, invitees, agents, or employees or to any person entering the property and shall not be liable for any damage to the building in which the property is located or to goods or equipment, or to the structure or equipment of the structure in which the Property is located, and Tenant hereby agrees to indemnify, defend, and hold Landlord harmless from any and all claims or assertions of every kind and nature.
        </p>
      </div>

      {/* Section 16: DEFAULT */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>16. DEFAULT.</h5>
        <p style={{ lineHeight: '1.6' }}>
          If Landlord breaches this Lease, Tenant may seek any relief provided by law. If Tenant fails to comply with any of the material provisions of this Standard Lease Agreement, other than the covenant to pay rent or of any present rules and regulations, or any that may be hereafter prescribed by Landlord, or materially fails to comply with any duties imposed on Tenant by statute, Landlord may terminate this Standard Lease Agreement seven (7) days after delivery of written notice by Landlord specifying the noncompliance and indicating the intention of Landlord to terminate the Lease by reason thereof. If Tenant fails to pay rent when due and the default continues for seven (7) days thereafter, Landlord may, at Landlord's option, declare the entire balance of rent payable hereunder to be immediately due and payable and may exercise any and all rights and remedies available to Landlord at law or in equity or may immediately terminate this Standard Lease Agreement.
        </p>
      </div>

      {/* Section 17: ABANDONMENT */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>17. ABANDONMENT.</h5>
        <p style={{ lineHeight: '1.6' }}>
          If at any time during the Term of this Standard Lease Agreement Tenant abandons the Property or any part thereof, Landlord may, at Landlord's option, obtain possession of the Property in the manner provided by law, and without becoming liable to Tenant for damages or for any payment of any kind whatsoever. Landlord may, at Landlord's discretion, as agent for Tenant, relet the Property, or any part thereof, for the whole or any part of the then unexpired term, and may receive and collect all rent payable by virtue of such reletting, and, at Landlord's option, hold Tenant liable for any difference between the rent that would have been payable under this Standard Lease Agreement during the balance of the unexpired term, if this Standard Lease Agreement had continued in force, and the net rent for such period realized by Landlord by means of such reletting. If Landlord's right of reentry is exercised following abandonment of the Property by Tenant, then Landlord shall consider any personal property belonging to Tenant and left on the Property to also have been abandoned, in which case Landlord may dispose of all such personal property in any manner Landlord shall deem proper and Landlord is hereby relieved of all liability for doing so.
        </p>
      </div>

      {/* Section 18: ATTORNEYS' FEES */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>18. ATTORNEYS' FEES.</h5>
        <p style={{ lineHeight: '1.6' }}>
          Should it become necessary for Landlord to employ an attorney to enforce any of the conditions or covenants hereof, including the collection of rentals or gaining possession of the Property, Tenant agrees to pay all expenses so incurred, including a reasonable attorneys' fee.
        </p>
      </div>

      {/* Section 19: RECORDING OF STANDARD LEASE AGREEMENT */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>19. RECORDING OF STANDARD LEASE AGREEMENT.</h5>
        <p style={{ lineHeight: '1.6' }}>
          Tenant shall not record this Standard Lease Agreement on the Public Records of any public office. In the event that Tenant shall record this Standard Lease Agreement, this Standard Lease Agreement shall, at Landlord's option, terminate immediately and Landlord shall be entitled to all rights and remedies that it has at law or in equity.
        </p>
      </div>

      {/* Section 20: GOVERNING LAW */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>20. GOVERNING LAW.</h5>
        <p style={{ lineHeight: '1.6' }}>
          This Standard Lease Agreement shall be governed, construed and interpreted by, through and under the Laws of the State of the where the Property is located.
        </p>
      </div>

      {/* Section 21: SEVERABILITY */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>21. SEVERABILITY.</h5>
        <p style={{ lineHeight: '1.6' }}>
          If any provision of this Standard Lease Agreement or the application thereof shall, for any reason and to any extent, be invalid or unenforceable, neither the remainder of this Standard Lease Agreement nor the application of the provision to other persons, entities, or circumstances shall be affected thereby, but instead shall be enforced to the maximum extent permitted by law.
        </p>
      </div>

      {/* Section 22: BINDING EFFECT */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>22. BINDING EFFECT.</h5>
        <p style={{ lineHeight: '1.6' }}>
          The covenants, obligations, and conditions herein contained shall be binding on and inure to the benefit of the heirs, legal representatives, and assigns of the parties hereto.
        </p>
      </div>

      {/* Section 23: DESCRIPTIVE HEADINGS */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>23. DESCRIPTIVE HEADINGS.</h5>
        <p style={{ lineHeight: '1.6' }}>
          The descriptive headings used herein are for convenience of reference only and they are not intended to have any effect whatsoever in determining the rights or obligations of the Landlord or Tenant.
        </p>
      </div>

      {/* Section 24: CONSTRUCTION */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>24. CONSTRUCTION.</h5>
        <p style={{ lineHeight: '1.6' }}>
          The pronouns used herein shall include, where appropriate, either gender or both, singular and plural.
        </p>
      </div>

      {/* Section 25: NON-WAIVER */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>25. NON-WAIVER.</h5>
        <p style={{ lineHeight: '1.6' }}>
          No delay, indulgence, waiver, non-enforcement, election, or non-election by Landlord under this Standard Lease Agreement will be deemed to be a waiver of any other breach by Tenant, nor shall it affect Tenant's duties, obligations, and liabilities hereunder.
        </p>
      </div>

      {/* Section 26: MODIFICATION */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>26. MODIFICATION.</h5>
        <p style={{ lineHeight: '1.6' }}>
          The parties hereby agree that this document contains the entire agreement between the parties and this Standard Lease Agreement shall not be modified, changed, altered, or amended in any way except through a written amendment signed by all of the parties hereto.
        </p>
      </div>

      {/* Section 27: NOTICE */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>27. NOTICE.</h5>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>Any notice required or permitted under this Lease or under state law shall be delivered to Tenant at the Property address, and to Landlord at the following address:</span>
        </div>
        <input
          type="text"
          value={localFormData.landlordNoticeAddress}
          onChange={handleFieldChange('landlordNoticeAddress')}
          placeholder="Landlord's notice address for tenant communications"
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      {/* Section 28: LEAD-BASED PAINT DISCLOSURE */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>28. LEAD-BASED PAINT DISCLOSURE.</h5>
        <p style={{ lineHeight: '1.6' }}>
          If the Property were constructed prior to 1978, Tenant acknowledges receipt of the form entitled "LEAD-BASED PAINT DISCLOSURE" which contains disclosure of information on lead-based paint and/or lead-based paint hazards.
        </p>
      </div>

      {/* Section 29: ENTIRE AGREEMENT */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>29. Entire Agreement.</h5>
        <p style={{ lineHeight: '1.6' }}>
          This Standard Lease Agreement and the Exhibits and Rider, if any, attached hereto is the complete agreement between the Landlord and Tenant concerning the Property and the total building facilities. There are no oral agreements, understandings, promises, or representation between the landlord and tenant affecting this Standard Lease Agreement. All prior negotiations and understandings, if any, between the parties hereto with respect to the Property and the total building facilities shall be of no force or effect and shall not be used to interpret this Standard Lease Agreement.
        </p>
      </div>

      {/* Signature Section */}
      <div style={{ marginTop: '40px', borderTop: '2px solid #000', paddingTop: '20px' }}>
        <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '30px' }}>
          IN WITNESS WHEREOF, the Landlord and Tenant have executed this Standard Lease Agreement in multiple originals as of the undersigned date(s).
        </p>
        
        <div style={{ marginBottom: '40px' }}>
          <p style={{ marginBottom: '10px' }}>Landlord's Signature ____________________________ Date ____________________</p>
          <p style={{ marginBottom: '30px' }}>Print Name _______________________</p>
        </div>
        
        <div style={{ marginBottom: '40px' }}>
          <p style={{ marginBottom: '10px' }}>Tenant's Signature ____________________________ Date _____________________</p>
          <p style={{ marginBottom: '30px' }}>Print Name _______________________</p>
        </div>
        
        <div style={{ marginBottom: '40px' }}>
          <p style={{ marginBottom: '10px' }}>Tenant's Signature ____________________________ Date _____________________</p>
          <p style={{ marginBottom: '30px' }}>Print Name _______________________</p>
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
          This Standard Lease Agreement is a legally binding document. Ensure all information is accurate before proceeding. 
          Both parties should retain copies of this document for their records.
        </p>
      </div>
    </FormWrapper>
  );
};

export default StandardLeaseAgreementForm;
