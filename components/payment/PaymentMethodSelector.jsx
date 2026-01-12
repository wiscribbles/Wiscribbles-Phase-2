import React from 'react';

export const PaymentMethodSelector = ({ selectedMethod, onSelect }) => {
  const methods = [
    {
      id: 'credit-card',
      name: 'Credit Card',
      icon: '/assets/v3/img/creditCard.png'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: '/assets/v3/img/payPal.png'
    }
  ];

  return (
    <div className="space-y-4 mb-6">
      {methods.map((method) => (
        <div
          key={method.id}
          onClick={() => onSelect(method.id)}
          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
            selectedMethod === method.id
              ? 'border-2 border-primary bg-gray-50'
              : 'border border-gray-200 bg-white'
          } hover:shadow-md`}
        >
          <div className="flex items-center gap-3">
            <img
              src={method.icon}
              alt={method.name}
              className="w-6 h-6 object-contain"
            />
            <span className="text-gray-800 font-medium">{method.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}; 