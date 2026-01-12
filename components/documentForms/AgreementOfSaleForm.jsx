'use client';
import React, { useState, useEffect } from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';

const AgreementOfSaleForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const [localFormData, setLocalFormData] = useState({
    // Transaction Details
    county: '',
    state: '',
    transactionDate: '',
    
    // Buyer Information
    buyerName: '',
    buyerAddress: '',
    
    // Seller Information
    sellerName: '',
    sellerAddress: '',
    
    // Vehicle Description
    vehicleMake: '',
    vehicleModel: '',
    vehicleBodyType: '',
    vehicleYear: '',
    vehicleColor: '',
    vehicleOdometer: '',
    vehicleVin: '',
    
    // Exchange Information
    exchangeType: '', // cash, trade, gift, other
    cashAmount: '',
    tradeAmount: '',
    tradeMake: '',
    tradeModel: '',
    tradeBodyType: '',
    tradeYear: '',
    tradeColor: '',
    tradeOdometer: '',
    giftValue: '',
    otherExchange: '',
    
    // Taxes
    taxPaidBy: '', // buyer, seller
    
    // Signatures
    buyerSignature: '',
    buyerSignatureDate: '',
    buyerPrintName: '',
    sellerSignature: '',
    sellerSignatureDate: '',
    sellerPrintName: '',
    
    // Odometer Disclosure
    odometerReading: '',
    odometerDiscrepancy: '', // accurate, excess, incorrect
    sellerNameOdometer: '', // separate field for odometer disclosure
    buyerOdometerSignature: '',
    buyerOdometerDate: '',
    buyerOdometerPrintName: '',
    sellerOdometerSignature: '',
    sellerOdometerDate: '',
    sellerOdometerPrintName: '',
    
    // Notary Information (disabled)
    notaryState: '',
    notaryCounty: '',
    notaryDate: '',
    notaryYear: '',
    notaryName: '',
    notaryTitle: '',
    sellerNameNotary: '',
    notaryPublicName: '',
    notaryPrintName: '',
    notaryExpires: '',
    notaryExpiresYear: '',
    
    ...formData
  });
  
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    onFormDataChange(localFormData);
  }, [localFormData, onFormDataChange]);

  useEffect(() => {
    const requiredFields = [
      'county', 'state', 'transactionDate', 'buyerName', 'buyerAddress',
      'sellerName', 'sellerAddress', 'vehicleMake', 'vehicleModel', 'vehicleYear',
      'vehicleVin', 'exchangeType', 'taxPaidBy', 'buyerSignature', 'buyerSignatureDate',
      'buyerPrintName', 'sellerSignature', 'sellerSignatureDate', 'sellerPrintName',
      'odometerReading', 'odometerDiscrepancy', 'buyerOdometerSignature',
      'buyerOdometerDate', 'buyerOdometerPrintName', 'sellerOdometerSignature',
      'sellerOdometerDate', 'sellerOdometerPrintName'
    ];
    
    // Exchange type specific validation
    const exchangeValid = () => {
      switch(localFormData.exchangeType) {
        case 'cash':
          return localFormData.cashAmount;
        case 'trade':
          return localFormData.tradeAmount && localFormData.tradeMake && localFormData.tradeModel && localFormData.tradeYear;
        case 'gift':
          return localFormData.giftValue;
        case 'other':
          return localFormData.otherExchange;
        default:
          return false;
      }
    };
    
    const valid = requiredFields.every(field => localFormData[field]) && exchangeValid();
    setIsValid(valid);
  }, [localFormData]);

  const handleFieldChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setLocalFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRadioChange = (field, value) => {
    setLocalFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <FormWrapper 
      title="Motor Vehicle Agreement of Sale" 
      subtitle="Complete this bill of sale to transfer vehicle ownership"
      onProceed={() => isValid && onProceed()} 
      isValid={isValid}
    >
      {/* Section 1: THE PARTIES */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>1. THE PARTIES</h5>
        
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>This transaction is made in the County of</span>
          <input
            type="text"
            value={localFormData.county}
            onChange={handleFieldChange('county')}
            placeholder="County name"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '150px'
            }}
            required
          />
          <span>, State of</span>
          <input
            type="text"
            value={localFormData.state}
            onChange={handleFieldChange('state')}
            placeholder="State name"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '150px'
            }}
            required
          />
          <span>, on</span>
          <input
            type="date"
            value={localFormData.transactionDate}
            onChange={handleFieldChange('transactionDate')}
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '150px'
            }}
            required
          />
          <span>, by and between:</span>
        </div>
        
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>Buyer:</span>
          <input
            type="text"
            value={localFormData.buyerName}
            onChange={handleFieldChange('buyerName')}
            placeholder="Buyer's full name"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '250px',
              flex: '1'
            }}
            required
          />
          <span>with a mailing address of</span>
        </div>
        
        <input
          value={localFormData.buyerAddress}
          onChange={handleFieldChange('buyerAddress')}
          placeholder="Enter buyer's complete mailing address"
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '14px',
            width: '100%',
            minHeight: '30px',
            marginBottom: '15px',
            resize: 'vertical'
          }}
          required
        />
        
        <p style={{ marginBottom: '15px' }}>("Buyer"), and agrees to purchase the Vehicle from:</p>
        
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>Seller:</span>
          <input
            type="text"
            value={localFormData.sellerName}
            onChange={handleFieldChange('sellerName')}
            placeholder="Seller's full name"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '250px',
              flex: '1'
            }}
            required
          />
          <span>with a mailing address of</span>
        </div>
        
        <input
          value={localFormData.sellerAddress}
          onChange={handleFieldChange('sellerAddress')}
          placeholder="Enter seller's complete mailing address"
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '14px',
            width: '100%',
            minHeight: '30px',
            marginBottom: '15px',
            resize: 'vertical'
          }}
          required
        />
        
        <p>("Seller"), and agrees to sell the Vehicle to the Buyer under the following terms:</p>
      </div>

      {/* Section 2: VEHICLE DESCRIPTION */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>2. VEHICLE DESCRIPTION</h5>
        
        <div className="row" style={{ marginBottom: '15px' }}>
          <div className="col-md-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span>Make:</span>
              <input
                type="text"
                value={localFormData.vehicleMake}
                onChange={handleFieldChange('vehicleMake')}
                placeholder="Vehicle make"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  flex: '1'
                }}
                required
              />
            </div>
          </div>
          <div className="col-md-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span>Model:</span>
              <input
                type="text"
                value={localFormData.vehicleModel}
                onChange={handleFieldChange('vehicleModel')}
                placeholder="Vehicle model"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  flex: '1'
                }}
                required
              />
            </div>
          </div>
          <div className="col-md-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span>Body Type:</span>
              <input
                type="text"
                value={localFormData.vehicleBodyType}
                onChange={handleFieldChange('vehicleBodyType')}
                placeholder="e.g., Sedan, SUV"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  flex: '1'
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="row" style={{ marginBottom: '15px' }}>
          <div className="col-md-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span>Year:</span>
              <input
                type="number"
                value={localFormData.vehicleYear}
                onChange={handleFieldChange('vehicleYear')}
                placeholder="Year"
                min="1900"
                max="2030"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  flex: '1'
                }}
                required
              />
            </div>
          </div>
          <div className="col-md-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span>Color:</span>
              <input
                type="text"
                value={localFormData.vehicleColor}
                onChange={handleFieldChange('vehicleColor')}
                placeholder="Vehicle color"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  flex: '1'
                }}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span>Odometer:</span>
              <input
                type="number"
                value={localFormData.vehicleOdometer}
                onChange={handleFieldChange('vehicleOdometer')}
                placeholder="Miles"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  minWidth: '100px'
                }}
              />
              <span>Miles</span>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Vehicle Identification Number (VIN):</span>
            <input
              type="text"
              value={localFormData.vehicleVin}
              onChange={handleFieldChange('vehicleVin')}
              placeholder="Enter 17-digit VIN"
              maxLength="17"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                minWidth: '200px',
                letterSpacing: '1px'
              }}
              required
            />
          </div>
        </div>
        
        <p>Hereinafter known as the "Vehicle."</p>
      </div>

      {/* Section 3: THE EXCHANGE */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>3. THE EXCHANGE</h5>
        <p style={{ marginBottom: '15px' }}>The Seller agrees to transfer ownership and possession of the Vehicle for: (check one)</p>
        
        <div style={{ marginLeft: '20px' }}>
          {/* Cash Payment */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="radio"
                name="exchangeType"
                value="cash"
                checked={localFormData.exchangeType === 'cash'}
                onChange={() => handleRadioChange('exchangeType', 'cash')}
                style={{ marginRight: '8px' }}
              />
              <span>Cash Payment. The Buyer agrees to pay $</span>
              <input
                type="number"
                value={localFormData.cashAmount}
                onChange={handleFieldChange('cashAmount')}
                placeholder="0.00"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  minWidth: '100px',
                  marginLeft: '8px',
                  marginRight: '8px'
                }}
                disabled={localFormData.exchangeType !== 'cash'}
              />
              <span>to the Seller.</span>
            </label>
          </div>
          
          {/* Trade */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="radio"
                name="exchangeType"
                value="trade"
                checked={localFormData.exchangeType === 'trade'}
                onChange={() => handleRadioChange('exchangeType', 'trade')}
                style={{ marginRight: '8px' }}
              />
              <span>Trade. The Buyer agrees to pay $</span>
              <input
                type="number"
                value={localFormData.tradeAmount}
                onChange={handleFieldChange('tradeAmount')}
                placeholder="0.00"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  minWidth: '100px',
                  marginLeft: '8px',
                  marginRight: '8px'
                }}
                disabled={localFormData.exchangeType !== 'trade'}
              />
              <span>and trade the following:</span>
            </label>
            
            {localFormData.exchangeType === 'trade' && (
              <div style={{ marginLeft: '24px', marginTop: '10px' }}>
                <div className="row">
                  <div className="col-md-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span>Make:</span>
                      <input
                        type="text"
                        value={localFormData.tradeMake}
                        onChange={handleFieldChange('tradeMake')}
                        placeholder="Trade vehicle make"
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '14px',
                          flex: '1'
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span>Model:</span>
                      <input
                        type="text"
                        value={localFormData.tradeModel}
                        onChange={handleFieldChange('tradeModel')}
                        placeholder="Trade vehicle model"
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '14px',
                          flex: '1'
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span>Body Type:</span>
                      <input
                        type="text"
                        value={localFormData.tradeBodyType}
                        onChange={handleFieldChange('tradeBodyType')}
                        placeholder="Body type"
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '14px',
                          flex: '1'
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-3">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span>Year:</span>
                      <input
                        type="number"
                        value={localFormData.tradeYear}
                        onChange={handleFieldChange('tradeYear')}
                        placeholder="Year"
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '14px',
                          flex: '1'
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span>Color:</span>
                      <input
                        type="text"
                        value={localFormData.tradeColor}
                        onChange={handleFieldChange('tradeColor')}
                        placeholder="Color"
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '14px',
                          flex: '1'
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span>Odometer:</span>
                      <input
                        type="number"
                        value={localFormData.tradeOdometer}
                        onChange={handleFieldChange('tradeOdometer')}
                        placeholder="Miles"
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '14px',
                          minWidth: '100px'
                        }}
                      />
                      <span>Miles</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Gift */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="radio"
                name="exchangeType"
                value="gift"
                checked={localFormData.exchangeType === 'gift'}
                onChange={() => handleRadioChange('exchangeType', 'gift')}
                style={{ marginRight: '8px' }}
              />
              <span>As a Gift. The Seller is giving the vehicle as a gift to the Buyer. The value of the vehicle is $</span>
              <input
                type="number"
                value={localFormData.giftValue}
                onChange={handleFieldChange('giftValue')}
                placeholder="0.00"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  minWidth: '100px',
                  marginLeft: '8px',
                  marginRight: '8px'
                }}
                disabled={localFormData.exchangeType !== 'gift'}
              />
              <span>.</span>
            </label>
          </div>
          
          {/* Other */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="radio"
                name="exchangeType"
                value="other"
                checked={localFormData.exchangeType === 'other'}
                onChange={() => handleRadioChange('exchangeType', 'other')}
                style={{ marginRight: '8px' }}
              />
              <span>Other.</span>
              <input
                type="text"
                value={localFormData.otherExchange}
                onChange={handleFieldChange('otherExchange')}
                placeholder="Describe other exchange terms"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  minWidth: '300px',
                  marginLeft: '8px'
                }}
                disabled={localFormData.exchangeType !== 'other'}
              />
              <span>.</span>
            </label>
          </div>
        </div>
        
        <p>Hereinafter known as the "Exchange."</p>
      </div>

      {/* Section 4: TAXES */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>4. TAXES</h5>
        <p style={{ marginBottom: '15px' }}>All municipal, county, and state taxes in relation to the sale of the Vehicle, including sales taxes, are paid by the: (check one)</p>
        
        <div style={{ marginLeft: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="taxPaidBy"
                value="buyer"
                checked={localFormData.taxPaidBy === 'buyer'}
                onChange={() => handleRadioChange('taxPaidBy', 'buyer')}
                style={{ marginRight: '8px' }}
              />
              <span>Buyer and not included in the exchange.</span>
            </label>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="taxPaidBy"
                value="seller"
                checked={localFormData.taxPaidBy === 'seller'}
                onChange={() => handleRadioChange('taxPaidBy', 'seller')}
                style={{ marginRight: '8px' }}
              />
              <span>Seller and included as part of the exchange.</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 5: BUYER AND SELLER CONDITIONS */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>5. BUYER AND SELLER CONDITIONS</h5>
        <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
          The undersigned Seller affirms that the above information about the Vehicle is accurate to the best of their knowledge. 
          The undersigned Buyer accepts receipt of this document and understands that the above vehicle is sold on an "as is, where is" 
          condition with no guarantees or warranties, either expressed or implied.
        </p>
      </div>

      {/* Section 6: AUTHORIZATION */}
      <div style={{ marginBottom: '30px' }}>
        <h5 style={{ fontWeight: '600', marginBottom: '20px' }}>6. AUTHORIZATION</h5>
        
        <div className="row">
          <div className="col-md-6">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>Buyer Signature:</span>
                <input
                  type="text"
                  value={localFormData.buyerSignature}
                  onChange={handleFieldChange('buyerSignature')}
                  placeholder="Type buyer's full name"
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    flex: '1'
                  }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>Date:</span>
                <input
                  type="date"
                  value={localFormData.buyerSignatureDate}
                  onChange={handleFieldChange('buyerSignatureDate')}
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Print Name:</span>
                <input
                  type="text"
                  value={localFormData.buyerPrintName}
                  onChange={handleFieldChange('buyerPrintName')}
                  placeholder="Buyer's printed name"
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    flex: '1'
                  }}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>Seller Signature:</span>
                <input
                  type="text"
                  value={localFormData.sellerSignature}
                  onChange={handleFieldChange('sellerSignature')}
                  placeholder="Type seller's full name"
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    flex: '1'
                  }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>Date:</span>
                <input
                  type="date"
                  value={localFormData.sellerSignatureDate}
                  onChange={handleFieldChange('sellerSignatureDate')}
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Print Name:</span>
                <input
                  type="text"
                  value={localFormData.sellerPrintName}
                  onChange={handleFieldChange('sellerPrintName')}
                  placeholder="Seller's printed name"
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    flex: '1'
                  }}
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ODOMETER DISCLOSURE STATEMENT */}
      <div style={{ marginBottom: '30px', borderTop: '2px solid #000', paddingTop: '20px' }}>
        <h4 style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>ODOMETER DISCLOSURE STATEMENT</h4>
        
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <p style={{ fontWeight: 'bold', margin: 0, fontSize: '14px' }}>
            FEDERAL and STATE LAW requires that you state the mileage in connection with the transfer of ownership. 
            Failure to complete or providing a false statement may result in fines and/or imprisonment.
          </p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
            <span>I/We,</span>
            <input
              type="text"
              value={localFormData.sellerNameOdometer || localFormData.sellerName}
              onChange={handleFieldChange('sellerNameOdometer')}
              placeholder="Seller's name for odometer disclosure"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                minWidth: '200px'
              }}
              required
            />
            <span>, the Seller, certify to the best of my/our knowledge that the odometer reading of</span>
            <input
              type="number"
              value={localFormData.odometerReading}
              onChange={handleFieldChange('odometerReading')}
              placeholder="Miles"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                minWidth: '100px'
              }}
              required
            />
            <span>Miles.</span>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ marginBottom: '15px' }}>The actual mileage of the vehicle is accurate, unless one (1) of the following statements is checked ( ):</p>
          
          <div style={{ marginLeft: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="odometerDiscrepancy"
                  value="excess"
                  checked={localFormData.odometerDiscrepancy === 'excess'}
                  onChange={() => handleRadioChange('odometerDiscrepancy', 'excess')}
                  style={{ marginRight: '8px', marginTop: '2px' }}
                />
                <span>I hereby certify that the odometer reading reflects the amount of mileage in excess of its mechanical limits.</span>
              </label>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="odometerDiscrepancy"
                  value="incorrect"
                  checked={localFormData.odometerDiscrepancy === 'incorrect'}
                  onChange={() => handleRadioChange('odometerDiscrepancy', 'incorrect')}
                  style={{ marginRight: '8px', marginTop: '2px' }}
                />
                <span>I hereby certify that the odometer reading is not the actual mileage. WARNING – ODOMETER DISCREPANCY</span>
              </label>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="odometerDiscrepancy"
                  value="accurate"
                  checked={localFormData.odometerDiscrepancy === 'accurate'}
                  onChange={() => handleRadioChange('odometerDiscrepancy', 'accurate')}
                  style={{ marginRight: '8px', marginTop: '2px' }}
                />
                <span>The odometer reading is accurate (no discrepancy)</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-6">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>Buyer Signature:</span>
                <input
                  type="text"
                  value={localFormData.buyerOdometerSignature}
                  onChange={handleFieldChange('buyerOdometerSignature')}
                  placeholder="Type buyer's full name"
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    flex: '1'
                  }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>Date:</span>
                <input
                  type="date"
                  value={localFormData.buyerOdometerDate}
                  onChange={handleFieldChange('buyerOdometerDate')}
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Print Name:</span>
                <input
                  type="text"
                  value={localFormData.buyerOdometerPrintName}
                  onChange={handleFieldChange('buyerOdometerPrintName')}
                  placeholder="Buyer's printed name"
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    flex: '1'
                  }}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>Seller Signature:</span>
                <input
                  type="text"
                  value={localFormData.sellerOdometerSignature}
                  onChange={handleFieldChange('sellerOdometerSignature')}
                  placeholder="Type seller's full name"
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    flex: '1'
                  }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>Date:</span>
                <input
                  type="date"
                  value={localFormData.sellerOdometerDate}
                  onChange={handleFieldChange('sellerOdometerDate')}
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Print Name:</span>
                <input
                  type="text"
                  value={localFormData.sellerOdometerPrintName}
                  onChange={handleFieldChange('sellerOdometerPrintName')}
                  placeholder="Seller's printed name"
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    flex: '1'
                  }}
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NOTARY ACKNOWLEDGMENT (SELLER ONLY) - Disabled */}
      <div style={{
        backgroundColor: '#f5f5f5',
        border: '2px solid #ccc',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '30px',
        opacity: '0.7'
      }}>
        <h4 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>NOTARY ACKNOWLEDGMENT<br />(SELLER ONLY)</h4>
        
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
        
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>On</span>
          <input
            type="text"
            value={localFormData.notaryDate}
            onChange={handleFieldChange('notaryDate')}
            placeholder="[DATE]"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '100px',
              backgroundColor: '#f8f8f8',
              color: '#666'
            }}
            disabled
          />
          <span>, 20</span>
          <input
            type="text"
            value={localFormData.notaryYear}
            onChange={handleFieldChange('notaryYear')}
            placeholder="[YEAR]"
            maxLength="2"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              width: '60px',
              backgroundColor: '#f8f8f8',
              color: '#666'
            }}
            disabled
          />
          <span>, before me,</span>
          <input
            type="text"
            value={localFormData.notaryName}
            onChange={handleFieldChange('notaryName')}
            placeholder="[NOTARY NAME AND TITLE]"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '200px',
              backgroundColor: '#f8f8f8',
              color: '#666'
            }}
            disabled
          />
          <span>(insert name and title of the officer), personally appeared</span>
        </div>
        
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <input
            type="text"
            value={localFormData.sellerNameNotary}
            onChange={handleFieldChange('sellerNameNotary')}
            placeholder="[SELLER'S NAME]"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '200px',
              backgroundColor: '#f8f8f8',
              color: '#666'
            }}
            disabled
          />
          <span>(seller's name) who proved to me on the basis of satisfactory evidence to be the person whose name is subscribed within the Motor Vehicle Bill of Sale and acknowledged to me that they executed the same in their authorized capacity, and that by their signature on the instrument the person, or the entity upon behalf of which the person acted, executed the instrument.</span>
        </div>
        
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>I certify under PENALTY OF PERJURY under the laws of the state of</span>
          <input
            type="text"
            value={localFormData.notaryState}
            readOnly
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '14px',
              minWidth: '100px',
              backgroundColor: '#f8f8f8',
              color: '#666'
            }}
            disabled
          />
          <span>that the foregoing paragraph is true and correct.</span>
        </div>
        
        <p style={{ marginBottom: '20px' }}>WITNESS my hand and official seal.</p>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span>Notary Public:</span>
            <input
              type="text"
              value={localFormData.notaryPublicName}
              onChange={handleFieldChange('notaryPublicName')}
              placeholder="[NOTARY SIGNATURE]"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                width: '160px',
                backgroundColor: '#f8f8f8',
                color: '#666'
              }}
              disabled
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span>Print Name:</span>
            <input
              type="text"
              value={localFormData.notaryPrintName}
              onChange={handleFieldChange('notaryPrintName')}
              placeholder="[NOTARY PRINTED NAME]"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                width: '170px',
                backgroundColor: '#f8f8f8',
                color: '#666'
              }}
              disabled
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>My Commission Expires:</span>
            <input
              type="text"
              value={localFormData.notaryExpires}
              onChange={handleFieldChange('notaryExpires')}
              placeholder="[DATE]"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                width: '90px',
                backgroundColor: '#f8f8f8',
                color: '#666'
              }}
              disabled
            />
            <span>, 20</span>
            <input
              type="text"
              value={localFormData.notaryExpiresYear}
              onChange={handleFieldChange('notaryExpiresYear')}
              placeholder="[YEAR]"
              maxLength="2"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '14px',
                width: '60px',
                backgroundColor: '#f8f8f8',
                color: '#666'
              }}
              disabled
            />
          </div>
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
          This Motor Vehicle Bill of Sale is a legally binding document. Ensure all information is accurate before signing. 
          Both parties should retain copies of this document for their records.
        </p>
      </div>
    </FormWrapper>
  );
};

export default AgreementOfSaleForm;
