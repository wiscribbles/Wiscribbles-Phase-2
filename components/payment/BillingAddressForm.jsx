import React from 'react';
import { useTranslations } from 'next-intl';
import CountrySelect from '@/components/CountrySelect';

export const BillingAddressForm = ({ formData, errors, onChange }) => {
  const t = useTranslations();

  const FormInput = ({ label, name, type = 'text', ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={onChange}
        className={`w-full px-3 py-2 rounded-md border ${
          errors[name] 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-primary'
        } focus:outline-none focus:ring-2 transition-colors`}
        {...props}
      />
      {errors[name] && (
        <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-6">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t('Enter your Billing Address')}
        </h3>
        
        <div className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label={t('First Name')}
              name="firstName"
              placeholder="John"
            />
            <FormInput
              label={t('Last Name')}
              name="lastName"
              placeholder="Doe"
            />
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label={t('Email Address')}
              name="email"
              type="email"
              placeholder="john@example.com"
            />
            <FormInput
              label={t('Phone')}
              name="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('Country')}
              </label>
              <CountrySelect
                value={formData.country}
                onChange={(value) => onChange({ target: { name: 'country', value }})}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.country 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-primary'
                } focus:outline-none focus:ring-2 transition-colors`}
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country}</p>
              )}
            </div>
            <FormInput
              label={t('Province/State')}
              name="province"
              placeholder="California"
            />
          </div>

          {/* Address Field */}
          <FormInput
            label={t('Address')}
            name="address"
            placeholder="123 Main St, Apt 4B"
          />

          {/* City and ZIP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label={t('City')}
              name="city"
              placeholder="San Francisco"
            />
            <FormInput
              label={t('ZIP Code')}
              name="zipCode"
              placeholder="94105"
              maxLength={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 