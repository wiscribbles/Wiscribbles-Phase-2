// Document Type Configuration System
// This replaces all hard-coded form components with a flexible, JSON-based approach

export const documentTypes = {
  // 'residential-lease-agreement': {
  //   id: 'residential-lease-agreement',
  //   title: 'Residential Lease Agreement',
  //   description: 'For apartments, houses, condos, and other residential properties',
  //   icon: '/assets/v3/img/form-img04.png',
  //   sections: [
  //     {
  //       id: 'parties',
  //       title: 'Parties',
  //       description: 'Information about landlord and tenant',
  //       fields: [
  //         {
  //           id: 'agreementDate',
  //           type: 'date',
  //           label: 'Agreement Date',
  //           required: true,
  //           defaultValue: () => new Date().toISOString().split('T')[0],
  //           validation: {
  //             required: 'Agreement date is required'
  //           }
  //         },
  //         {
  //           id: 'landlordName',
  //           type: 'text',
  //           label: 'Landlord Name',
  //           placeholder: 'Full name of landlord',
  //           required: true,
  //           validation: {
  //             required: 'Landlord name is required',
  //             minLength: { value: 2, message: 'Name must be at least 2 characters' }
  //           }
  //         },
  //         {
  //           id: 'landlordAddress',
  //           type: 'textarea',
  //           label: 'Landlord Mailing Address',
  //           placeholder: 'Complete mailing address',
  //           required: false
  //         },
  //         {
  //           id: 'tenantNames',
  //           type: 'text',
  //           label: 'Tenant Names',
  //           placeholder: 'All tenant names (comma separated)',
  //           required: true,
  //           validation: {
  //             required: 'At least one tenant name is required'
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       id: 'property',
  //       title: 'Property Information',
  //       description: 'Details about the rental property',
  //       fields: [
  //         {
  //           id: 'propertyAddress',
  //           type: 'textarea',
  //           label: 'Property Address',
  //           placeholder: 'Complete property address',
  //           required: true,
  //           validation: {
  //             required: 'Property address is required'
  //           }
  //         },
  //         {
  //           id: 'residenceType',
  //           type: 'select',
  //           label: 'Residence Type',
  //           required: true,
  //           options: [
  //             { value: '', label: 'Select residence type' },
  //             { value: 'apartment', label: 'Apartment' },
  //             { value: 'house', label: 'House' },
  //             { value: 'condo', label: 'Condo' },
  //             { value: 'other', label: 'Other' }
  //           ],
  //           conditionalFields: {
  //             'other': [
  //               {
  //                 id: 'residenceTypeOther',
  //                 type: 'text',
  //                 label: 'Specify Other',
  //                 placeholder: 'Please specify',
  //                 required: true
  //               }
  //             ]
  //           }
  //         },
  //         {
  //           id: 'bedrooms',
  //           type: 'number',
  //           label: 'Number of Bedrooms',
  //           min: 0,
  //           max: 10,
  //           required: false
  //         },
  //         {
  //           id: 'bathrooms',
  //           type: 'number',
  //           label: 'Number of Bathrooms',
  //           min: 0,
  //           max: 10,
  //           step: 0.5,
  //           required: false
  //         }
  //       ]
  //     },
  //     {
  //       id: 'terms',
  //       title: 'Lease Terms',
  //       description: 'Duration and terms of the lease',
  //       fields: [
  //         {
  //           id: 'leaseType',
  //           type: 'radio',
  //           label: 'Lease Type',
  //           required: true,
  //           options: [
  //             { 
  //               value: 'fixed', 
  //               label: 'Fixed Term Lease',
  //               conditionalFields: [
  //                 {
  //                   id: 'startDate',
  //                   type: 'date',
  //                   label: 'Start Date',
  //                   required: true
  //                 },
  //                 {
  //                   id: 'endDate',
  //                   type: 'date',
  //                   label: 'End Date',
  //                   required: true
  //                 }
  //               ]
  //             },
  //             { 
  //               value: 'month-to-month', 
  //               label: 'Month-to-Month',
  //               conditionalFields: [
  //                 {
  //                   id: 'monthlyStartDate',
  //                   type: 'date',
  //                   label: 'Start Date',
  //                   required: true
  //                 },
  //                 {
  //                   id: 'noticeDays',
  //                   type: 'number',
  //                   label: 'Notice Period (days)',
  //                   min: 1,
  //                   max: 365,
  //                   defaultValue: 30,
  //                   required: true
  //                 }
  //               ]
  //             }
  //           ]
  //         }
  //       ]
  //     },
  //     {
  //       id: 'financial',
  //       title: 'Financial Terms',
  //       description: 'Rent, deposits, and fees',
  //       fields: [
  //         {
  //           id: 'monthlyRent',
  //           type: 'currency',
  //           label: 'Monthly Rent',
  //           placeholder: '0.00',
  //           required: true,
  //           validation: {
  //             required: 'Monthly rent is required',
  //             min: { value: 1, message: 'Rent must be greater than 0' }
  //           }
  //         },
  //         {
  //           id: 'rentDueDay',
  //           type: 'number',
  //           label: 'Rent Due Day',
  //           min: 1,
  //           max: 31,
  //           defaultValue: 1,
  //           required: true
  //         },
  //         {
  //           id: 'securityDeposit',
  //           type: 'currency',
  //           label: 'Security Deposit',
  //           placeholder: '0.00',
  //           required: false
  //         },
  //         {
  //           id: 'lateFee',
  //           type: 'currency',
  //           label: 'Late Fee',
  //           placeholder: '0.00',
  //           required: false
  //         }
  //       ]
  //     },
  //     {
  //       id: 'additional',
  //       title: 'Additional Terms',
  //       description: 'Other important terms and conditions',
  //       fields: [
  //         {
  //           id: 'petsAllowed',
  //           type: 'checkbox',
  //           label: 'Pets Allowed',
  //           conditionalFields: {
  //             true: [
  //               {
  //                 id: 'petFee',
  //                 type: 'currency',
  //                 label: 'Pet Fee',
  //                 placeholder: '0.00'
  //               },
  //               {
  //                 id: 'petDescription',
  //                 type: 'textarea',
  //                 label: 'Pet Restrictions',
  //                 placeholder: 'Describe any pet restrictions'
  //               }
  //             ]
  //           }
  //         },
  //         {
  //           id: 'smokingAllowed',
  //           type: 'radio',
  //           label: 'Smoking Policy',
  //           options: [
  //             { value: 'prohibited', label: 'Prohibited' },
  //             { value: 'permitted', label: 'Permitted in designated areas' }
  //           ],
  //           defaultValue: 'prohibited'
  //         },
  //         {
  //           id: 'additionalTerms',
  //           type: 'textarea',
  //           label: 'Additional Terms & Conditions',
  //           placeholder: 'Enter any additional terms and conditions',
  //           rows: 4
  //         }
  //       ]
  //     }
  //   ],
  //   // Fields that can be edited by notary during video call
  //   notaryEditableFields: [
  //     'landlordName',
  //     'tenantNames', 
  //     'propertyAddress',
  //     'monthlyRent',
  //     'securityDeposit',
  //     'additionalTerms'
  //   ],
  //   // Required signatures
  //   signatures: [
  //     { type: 'landlord', label: 'Landlord Signature', required: true },
  //     { type: 'tenant1', label: 'Tenant Signature', required: true },
  //     { type: 'tenant2', label: 'Additional Tenant Signature', required: false },
  //     { type: 'witness', label: 'Witness Signature', required: false }
  //   ]
  // },

  // 'standard-lease-agreement': {
  //   id: 'standard-lease-agreement',
  //   title: 'Standard Lease Agreement',
  //   description: 'For commercial, retail, office, and other general lease purposes',
  //   icon: '/assets/v3/img/form-img04.png',
  //   sections: [
  //     {
  //       id: 'parties',
  //       title: 'Parties',
  //       description: 'Information about landlord and tenant',
  //       fields: [
  //         {
  //           id: 'agreementDate',
  //           type: 'date',
  //           label: 'Agreement Date',
  //           required: true,
  //           defaultValue: () => new Date().toISOString().split('T')[0],
  //           validation: {
  //             required: 'Agreement date is required'
  //           }
  //         },
  //         {
  //           id: 'landlordName',
  //           type: 'text',
  //           label: 'Landlord Name',
  //           placeholder: 'Full name of landlord or company',
  //           required: true,
  //           validation: {
  //             required: 'Landlord name is required',
  //             minLength: { value: 2, message: 'Name must be at least 2 characters' }
  //           }
  //         },
  //         {
  //           id: 'landlordAddress',
  //           type: 'textarea',
  //           label: 'Landlord Mailing Address',
  //           placeholder: 'Complete mailing address',
  //           required: false
  //         },
  //         {
  //           id: 'tenantNames',
  //           type: 'text',
  //           label: 'Tenant Names',
  //           placeholder: 'All tenant names (comma separated)',
  //           required: true,
  //           validation: {
  //             required: 'At least one tenant name is required'
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       id: 'property',
  //       title: 'Property Information',
  //       description: 'Details about the leased property',
  //       fields: [
  //         {
  //           id: 'propertyAddress',
  //           type: 'textarea',
  //           label: 'Property Address',
  //           placeholder: 'Complete property address',
  //           required: true,
  //           validation: {
  //             required: 'Property address is required'
  //           }
  //         },
  //         {
  //           id: 'propertyType',
  //           type: 'select',
  //           label: 'Property Type',
  //           required: true,
  //           options: [
  //             { value: '', label: 'Select property type' },
  //             { value: 'commercial', label: 'Commercial Space' },
  //             { value: 'retail', label: 'Retail Space' },
  //             { value: 'office', label: 'Office Space' },
  //             { value: 'warehouse', label: 'Warehouse' },
  //             { value: 'industrial', label: 'Industrial' },
  //             { value: 'other', label: 'Other' }
  //           ],
  //           conditionalFields: {
  //             'other': [
  //               {
  //                 id: 'propertyTypeOther',
  //                 type: 'text',
  //                 label: 'Specify Other',
  //                 placeholder: 'Please specify',
  //                 required: true
  //               }
  //             ]
  //           }
  //         },
  //         {
  //           id: 'squareFootage',
  //           type: 'number',
  //           label: 'Square Footage',
  //           min: 1,
  //           required: false,
  //           placeholder: 'Total square feet'
  //         },
  //         {
  //           id: 'usePermitted',
  //           type: 'textarea',
  //           label: 'Permitted Use',
  //           placeholder: 'Describe how the property may be used',
  //           required: false,
  //           rows: 3
  //         }
  //       ]
  //     },
  //     {
  //       id: 'terms',
  //       title: 'Lease Terms',
  //       description: 'Duration and terms of the lease',
  //       fields: [
  //         {
  //           id: 'leaseType',
  //           type: 'radio',
  //           label: 'Lease Type',
  //           required: true,
  //           options: [
  //             { 
  //               value: 'fixed', 
  //               label: 'Fixed Term Lease',
  //               conditionalFields: [
  //                 {
  //                   id: 'startDate',
  //                   type: 'date',
  //                   label: 'Start Date',
  //                   required: true
  //                 },
  //                 {
  //                   id: 'endDate',
  //                   type: 'date',
  //                   label: 'End Date',
  //                   required: true
  //                 }
  //               ]
  //             },
  //             { 
  //               value: 'month-to-month', 
  //               label: 'Month-to-Month',
  //               conditionalFields: [
  //                 {
  //                   id: 'monthlyStartDate',
  //                   type: 'date',
  //                   label: 'Start Date',
  //                   required: true
  //                 },
  //                 {
  //                   id: 'noticeDays',
  //                   type: 'number',
  //                   label: 'Notice Period (days)',
  //                   min: 1,
  //                   max: 365,
  //                   defaultValue: 30,
  //                   required: true
  //                 }
  //               ]
  //             }
  //           ]
  //         }
  //       ]
  //     },
  //     {
  //       id: 'financial',
  //       title: 'Financial Terms',
  //       description: 'Rent, deposits, and fees',
  //       fields: [
  //         {
  //           id: 'monthlyRent',
  //           type: 'currency',
  //           label: 'Monthly Rent',
  //           placeholder: '0.00',
  //           required: true,
  //           validation: {
  //             required: 'Monthly rent is required',
  //             min: { value: 1, message: 'Rent must be greater than 0' }
  //           }
  //         },
  //         {
  //           id: 'rentDueDay',
  //           type: 'number',
  //           label: 'Rent Due Day',
  //           min: 1,
  //           max: 31,
  //           defaultValue: 1,
  //           required: true
  //         },
  //         {
  //           id: 'securityDeposit',
  //           type: 'currency',
  //           label: 'Security Deposit',
  //           placeholder: '0.00',
  //           required: false
  //         },
  //         {
  //           id: 'lateFee',
  //           type: 'currency',
  //           label: 'Late Fee',
  //           placeholder: '0.00',
  //           required: false
  //         },
  //         {
  //           id: 'returnedCheckFee',
  //           type: 'currency',
  //           label: 'Returned Check Fee',
  //           placeholder: '0.00',
  //           required: false
  //         }
  //       ]
  //     },
  //     {
  //       id: 'additional',
  //       title: 'Additional Terms',
  //       description: 'Other important terms and conditions',
  //       fields: [
  //         {
  //           id: 'sublettingAllowed',
  //           type: 'radio',
  //           label: 'Assignment/Subletting',
  //           required: true,
  //           options: [
  //             { value: 'not_allowed', label: 'Not Allowed' },
  //             { value: 'allowed', label: 'Allowed with Permission' }
  //           ],
  //           defaultValue: 'not_allowed'
  //         },
  //         {
  //           id: 'petsAllowed',
  //           type: 'checkbox',
  //           label: 'Pets Allowed',
  //           conditionalFields: {
  //             true: [
  //               {
  //                 id: 'petFee',
  //                 type: 'currency',
  //                 label: 'Pet Fee per Pet',
  //                 placeholder: '0.00'
  //               },
  //               {
  //                 id: 'petDescription',
  //                 type: 'textarea',
  //                 label: 'Pet Restrictions',
  //                 placeholder: 'Describe any pet restrictions (types, weight limits, etc.)'
  //               }
  //             ]
  //           }
  //         },
  //         {
  //           id: 'rentIncreaseNotice',
  //           type: 'number',
  //           label: 'Rent Increase Notice (days)',
  //           min: 1,
  //           max: 365,
  //           defaultValue: 30,
  //           required: false,
  //           placeholder: 'Days notice required for rent increases'
  //         },
  //         {
  //           id: 'additionalTerms',
  //           type: 'textarea',
  //           label: 'Additional Terms & Conditions',
  //           placeholder: 'Enter any additional terms and conditions',
  //           rows: 4
  //         }
  //       ]
  //     }
  //   ],
  //   // Fields that can be edited by notary during video call
  //   notaryEditableFields: [
  //     'landlordName',
  //     'tenantNames', 
  //     'propertyAddress',
  //     'monthlyRent',
  //     'securityDeposit',
  //     'additionalTerms'
  //   ],
  //   // Required signatures
  //   signatures: [
  //     { type: 'landlord', label: 'Landlord Signature', required: true },
  //     { type: 'tenant1', label: 'Tenant Signature', required: true },
  //     { type: 'tenant2', label: 'Additional Tenant Signature', required: false },
  //     { type: 'witness', label: 'Witness Signature', required: false }
  //   ]
  // },

  // 'power-of-attorney': {
  //   id: 'power-of-attorney',
  //   title: 'Power of Attorney',
  //   description: 'Legal document granting authority to act on behalf of another person',
  //   icon: '/assets/v3/img/form-img01.png',
  //   hasSubtypes: true,
  //   
  //   // Subtype selection section - shown first to determine which form to load
  //   sections: [
  //     {
  //       id: 'subtype_selection',
  //       title: 'Power of Attorney Type Selection',
  //       description: 'Please select the specific type of Power of Attorney document you need',
  //       fields: [
  //         {
  //           id: 'poa_subtype',
  //           type: 'radio',
  //           label: 'Select Power of Attorney Type',
  //           required: true,
  //           options: [
  //             {
  //               value: 'durable_financial',
  //               label: 'Durable Financial Power of Attorney Form',
  //               description: 'Grants broad financial powers that remain effective even if you become incapacitated. This includes banking, investments, real estate, and other financial matters.'
  //             },
  //             {
  //               value: 'limited_special',
  //               label: 'Limited Special Power of Attorney Form',
  //               description: 'Grants specific, limited powers for particular transactions or time periods. Used for single transactions or temporary arrangements.'
  //             },
  //             {
  //               value: 'real_estate',
  //               label: 'Real Estate Power of Attorney Form',
  //               description: 'Specifically grants authority to handle real estate transactions, property sales, purchases, and related matters.'
  //             }
  //           ],
  //           validation: {
  //             required: 'Please select a Power of Attorney type'
  //           }
  //         }
  //       ]
  //     }
  //   ],
    
  //   // Subtype configurations - will be populated when you provide form details
  //   subtypes: {
  //     durable_financial: {
  //       id: 'durable_financial',
  //       title: 'Durable Financial Power of Attorney Form',
  //       description: 'Grants broad financial powers that remain effective even if the principal becomes incapacitated',
  //       sections: [
  //         {
  //           id: 'basic_information',
  //           title: 'Basic Information',
  //           fields: [
  //             {
  //               id: 'execution_date_day',
  //               label: 'Day of Execution',
  //               type: 'number',
  //               required: true,
  //               placeholder: 'Day (1-31)',
  //               validation: { min: 1, max: 31 }
  //             },
  //             {
  //               id: 'execution_date_month',
  //               label: 'Month of Execution',
  //               type: 'text',
  //               required: true,
  //               placeholder: 'Month name (e.g., January)'
  //             },
  //             {
  //               id: 'execution_date_year',
  //               label: 'Year of Execution',
  //               type: 'number',
  //               required: true,
  //               placeholder: 'Year (e.g., 2024)',
  //               validation: { min: 2020, max: 2040 }
  //             },
  //             {
  //               id: 'principal_name',
  //               label: 'Principal Name (Your Full Legal Name)',
  //               type: 'text',
  //               required: true,
  //               placeholder: 'Full legal name of person granting power'
  //             },
  //             {
  //               id: 'principal_address',
  //               label: 'Principal Mailing Address',
  //               type: 'text',
  //               required: true,
  //               placeholder: 'Street address, apartment/unit number'
  //             },
  //             {
  //               id: 'principal_city',
  //               label: 'Principal City',
  //               type: 'text',
  //               required: true,
  //               placeholder: 'City name'
  //             },
  //             {
  //               id: 'principal_state',
  //               label: 'Principal State',
  //               type: 'text',
  //               required: true,
  //               placeholder: 'State name'
  //             },
  //             {
  //               id: 'attorney_name',
  //               label: 'Attorney-in-Fact Name',
  //               type: 'text',
  //               required: true,
  //               placeholder: 'Full name of person receiving power'
  //             },
  //             {
  //               id: 'attorney_address',
  //               label: 'Attorney-in-Fact Mailing Address',
  //               type: 'text',
  //               required: true,
  //               placeholder: 'Street address, apartment/unit number'
  //             },
  //             {
  //               id: 'attorney_city',
  //               label: 'Attorney-in-Fact City',
  //               type: 'text',
  //               required: true,
  //               placeholder: 'City name'
  //             },
  //             {
  //               id: 'attorney_state',
  //               label: 'Attorney-in-Fact State',
  //               type: 'text',
  //               required: true,
  //               placeholder: 'State name'
  //             }
  //           ]
  //         },
  //       }
  //     ],
  //     
  //     // Common notary fields for all subtypes
  //     notaryEditableFields: [
  //       'notary_signature',
  //       'notary_seal',
  //       'notary_commission_number',
  //       'notary_commission_expiry',
  //       'verification_date',
  //       'acknowledgment_text',
  //       'notary_address'
  //     ],
  //     
  //     // Common signature requirements
  //     signatures: [
  //       { type: 'principal', label: 'Principal Signature', required: true },
  //       { type: 'notary', label: 'Notary Signature', required: true },
  //       { type: 'witness', label: 'Witness Signature', required: false }
  //     ]
  // },

  // 'promissory-note': {
  //   id: 'promissory-note',
  //   title: 'Promissory Note',
  //   description: 'Legal IOU document for loans',
  //   icon: '/assets/v3/img/form-img05.png',
  //   sections: [
  //     {
  //       id: 'parties',
  //       title: 'Parties',
  //       fields: [
  //         {
  //           id: 'borrowerName',
  //           type: 'text',
  //           label: 'Borrower Name',
  //           required: true
  //         },
  //         {
  //           id: 'lenderName',
  //           type: 'text', 
  //           label: 'Lender Name',
  //           required: true
  //         }
  //       ]
  //     },
  //     {
  //       id: 'loan_details',
  //       title: 'Loan Details',
  //       fields: [
  //         {
  //           id: 'principalAmount',
  //           type: 'currency',
  //           label: 'Principal Amount',
  //           required: true
  //         },
  //         {
  //           id: 'interestRate',
  //           type: 'number',
  //           label: 'Interest Rate (%)',
  //           step: 0.01,
  //           min: 0,
  //           max: 100,
  //           required: true
  //         },
  //         {
  //           id: 'maturityDate',
  //           type: 'date',
  //           label: 'Maturity Date',
  //           required: true
  //         }
  //       ]
  //     }
  //   ],
  //   notaryEditableFields: ['borrowerName', 'lenderName', 'principalAmount', 'interestRate'],
  //   signatures: [
  //     { type: 'borrower', label: 'Borrower Signature', required: true },
  //     { type: 'lender', label: 'Lender Signature', required: true }
  //   ]
  // },

  // Custom document removed - using dedicated UploadDocumentForm component instead
};

// Field type definitions and validation rules
export const fieldTypes = {
  text: {
    component: 'input',
    inputType: 'text',
    validation: {
      maxLength: 255
    }
  },
  textarea: {
    component: 'textarea',
    validation: {
      maxLength: 2000
    }
  },
  number: {
    component: 'input',
    inputType: 'number',
    validation: {
      pattern: /^\d+(\.\d+)?$/
    }
  },
  currency: {
    component: 'input',
    inputType: 'number',
    step: 0.01,
    min: 0,
    prefix: '$',
    validation: {
      min: 0,
      pattern: /^\d+(\.\d{1,2})?$/
    }
  },
  date: {
    component: 'input',
    inputType: 'date',
    validation: {
      pattern: /^\d{4}-\d{2}-\d{2}$/
    }
  },
  select: {
    component: 'select',
    validation: {}
  },
  radio: {
    component: 'radioGroup',
    validation: {}
  },
  checkbox: {
    component: 'checkbox',
    validation: {}
  },
  checkboxGroup: {
    component: 'checkboxGroup',
    validation: {}
  },
  file: {
    component: 'fileUpload',
    validation: {
      maxSize: 10485760, // 10MB
      allowedTypes: ['.pdf', '.doc', '.docx']
    }
  },
  tel: {
    component: 'input',
    inputType: 'tel',
    validation: {
      pattern: /^[\+]?[1-9][\d]{0,15}$/
    }
  },
  email: {
    component: 'input',
    inputType: 'email',
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  }
};

// Export utility functions
export const getDocumentType = (id) => documentTypes[id];
export const getAllDocumentTypes = () => Object.values(documentTypes);
export const getFieldType = (type) => fieldTypes[type];

// New utility functions for the dynamic system
export const getDocumentConfig = (documentTypeId, subtype = null) => {
  const docType = documentTypes[documentTypeId];
  if (!docType) return null;
  
  // If document has subtypes and a subtype is specified
  if (docType.hasSubtypes && subtype && docType.subtypes?.[subtype]) {
    return {
      ...docType,
      ...docType.subtypes[subtype],
      parentId: documentTypeId
    };
  }
  
  return docType;
};

// Get available document types for selection
export const getAvailableDocumentTypes = () => {
  return Object.values(documentTypes).map(docType => ({
    id: docType.id,
    title: docType.title,
    description: docType.description,
    icon: docType.icon,
    hasSubtypes: docType.hasSubtypes,
    subtypes: docType.hasSubtypes ? Object.values(docType.subtypes || {}) : null
  }));
};

// Get subtypes for a specific document type
export const getDocumentSubtypes = (documentTypeId) => {
  const docType = documentTypes[documentTypeId];
  if (!docType?.hasSubtypes || !docType.subtypes) return [];
  
  return Object.values(docType.subtypes);
};

// Validate if a document type and subtype combination is valid
export const isValidDocumentConfig = (documentTypeId, subtype = null) => {
  const docType = documentTypes[documentTypeId];
  if (!docType) return false;
  
  if (docType.hasSubtypes) {
    return subtype && docType.subtypes?.[subtype];
  }
  
  return true;
};

// Get all fields for a document configuration (flattened)
export const getAllFields = (config) => {
  if (!config?.sections) return [];
  
  const fields = [];
  config.sections.forEach(section => {
    if (section.fields) {
      fields.push(...section.fields);
    }
  });
  
  return fields;
};

// Get signature fields for a document configuration
export const getSignatureFields = (config) => {
  const allFields = getAllFields(config);
  return allFields.filter(field => field.type === 'signature');
};

// Get notary editable fields for a document configuration
export const getNotaryEditableFields = (config) => {
  return config?.notaryEditableFields || [];
};
