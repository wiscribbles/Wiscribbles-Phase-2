// 'use client';
// import React, { useState, useEffect } from 'react';
// import FormWrapper, { FormField } from '../shared/FormWrapper';

// const LeaseAgreementForm = ({ formData = {}, onFormDataChange, onProceed }) => {
//   const [localFormData, setLocalFormData] = useState({
//     landlordName: '', tenantName: '', propertyAddress: '', rentAmount: '', leaseTerm: '', ...formData
//   });
//   const [isValid, setIsValid] = useState(false);

//   useEffect(() => { onFormDataChange(localFormData); }, [localFormData, onFormDataChange]);
//   useEffect(() => {
//     const valid = ['landlordName', 'tenantName', 'propertyAddress', 'rentAmount'].every(field => localFormData[field]);
//     setIsValid(valid);
//   }, [localFormData]);

//   const handleFieldChange = (field) => (e) => {
//     setLocalFormData(prev => ({ ...prev, [field]: e.target.value }));
//   };

//   return (
//     <FormWrapper title="Lease Agreement Form" onProceed={() => isValid && onProceed()} isValid={isValid}>
//       <div className="row">
//         <div className="col-md-6">
//           <FormField label="Landlord Name" value={localFormData.landlordName} onChange={handleFieldChange('landlordName')} required />
//         </div>
//         <div className="col-md-6">
//           <FormField label="Tenant Name" value={localFormData.tenantName} onChange={handleFieldChange('tenantName')} required />
//         </div>
//       </div>
//       <FormField label="Property Address" value={localFormData.propertyAddress} onChange={handleFieldChange('propertyAddress')} required />
//       <div className="row">
//         <div className="col-md-6">
//           <FormField label="Monthly Rent" type="number" value={localFormData.rentAmount} onChange={handleFieldChange('rentAmount')} required />
//         </div>
//         <div className="col-md-6">
//           <FormField label="Lease Term (months)" type="number" value={localFormData.leaseTerm} onChange={handleFieldChange('leaseTerm')} />
//         </div>
//       </div>
//     </FormWrapper>
//   );
// };

// export default LeaseAgreementForm;
