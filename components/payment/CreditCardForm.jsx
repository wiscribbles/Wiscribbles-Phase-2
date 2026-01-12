import React from 'react';
import { useTranslations } from 'next-intl';

export const CreditCardForm = ({ formData, errors, onChange }) => {
  const t = useTranslations();

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    onChange({
      target: {
        name: 'cardNumber',
        value: formattedValue
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t('Enter your Credit Card Details')}
        </h3>
        
        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('Card Number')}
            </label>
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              placeholder="XXXX XXXX XXXX XXXX"
              maxLength="19"
              className={`w-full px-3 py-2 rounded-md border ${
                errors.cardNumber 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-primary'
              } focus:outline-none focus:ring-2 transition-colors`}
            />
            {errors.cardNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
            )}
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('Cardholder Name')}
            </label>
            <input
              type="text"
              name="cardholderName"
              value={formData.cardholderName}
              onChange={onChange}
              placeholder="John Doe"
              className={`w-full px-3 py-2 rounded-md border ${
                errors.cardholderName 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-primary'
              } focus:outline-none focus:ring-2 transition-colors`}
            />
            {errors.cardholderName && (
              <p className="mt-1 text-sm text-red-600">{errors.cardholderName}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Expiry Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('Expiry Month')}
              </label>
              <input
                type="text"
                name="expiryMonth"
                value={formData.expiryMonth}
                onChange={onChange}
                placeholder="MM"
                maxLength="2"
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.expiryMonth 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-primary'
                } focus:outline-none focus:ring-2 transition-colors`}
              />
              {errors.expiryMonth && (
                <p className="mt-1 text-sm text-red-600">{errors.expiryMonth}</p>
              )}
            </div>

            {/* Expiry Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('Expiry Year')}
              </label>
              <input
                type="text"
                name="expiryYear"
                value={formData.expiryYear}
                onChange={onChange}
                placeholder="YYYY"
                maxLength="4"
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.expiryYear 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-primary'
                } focus:outline-none focus:ring-2 transition-colors`}
              />
              {errors.expiryYear && (
                <p className="mt-1 text-sm text-red-600">{errors.expiryYear}</p>
              )}
            </div>

            {/* CVV */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('CVV')}
              </label>
              <input
                type="password"
                name="cvv"
                value={formData.cvv}
                onChange={onChange}
                placeholder="123"
                maxLength="4"
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.cvv 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-primary'
                } focus:outline-none focus:ring-2 transition-colors`}
              />
              {errors.cvv && (
                <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 