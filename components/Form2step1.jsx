
'use client';

// Import pdfjs from react-pdf to avoid webpack issues
import { pdfjs } from 'react-pdf';

// Set up PDF.js worker for Next.js environment
if (typeof window !== 'undefined') {
  // Try local worker first (now version 5.3.93 to match react-pdf)
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  
  // Test if local worker is accessible, fallback to CDN if not
  fetch('/pdf.worker.min.mjs', { method: 'HEAD' })
    .then(response => {
      if (!response.ok) {
        console.log('Local worker not found, using CDN');
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      } else {
        console.log('Using local PDF.js worker');
      }
    })
    .catch(() => {
      console.log('Failed to check local worker, using CDN');
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    });
  
  console.log('PDF.js API version:', pdfjs.version);
}

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Logo from './Logo';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Col, FormLabel, Row } from "react-bootstrap";
import CountrySelect from "@/components/CountrySelect";
import useForm2store from "@/store/form2store";
import { useFormSteps } from "@/hooks/useFormSteps";
import FormProgressSidebar from './FormProgressSidebar';
import { saveFormData, getFormData, uploadToCloudinary } from '@/utils/formStorage';

import {  Upload } from 'lucide-react'

// Add Alert component for verification messages
const Alert = ({ type, message, children }) => {
  const alertStyles = {
    padding: '12px 16px',
    borderRadius: '8px',
    marginTop: '8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const styles = {
    success: {
      ...alertStyles,
      backgroundColor: '#F0FDF4',
      border: '1px solid #BBF7D0',
      color: '#166534'
    },
    error: {
      ...alertStyles,
      backgroundColor: '#FEF2F2',
      border: '1px solid #FECACA',
      color: '#DC2626'
    },
    info: {
      ...alertStyles,
      backgroundColor: '#EFF6FF',
      border: '1px solid #BFDBFE',
      color: '#1D4ED8'
    },
    warning: {
      ...alertStyles,
      backgroundColor: '#FFFBEB',
      border: '1px solid #FED7AA',
      color: '#D97706'
    }
  };

  return (
    <div style={styles[type]}>
      {type === 'success' && <i className="fa fa-check-circle"></i>}
      {type === 'error' && <i className="fa fa-exclamation-circle"></i>}
      {type === 'info' && <i className="fa fa-info-circle"></i>}
      {type === 'warning' && <i className="fa fa-exclamation-triangle"></i>}
      <span>{message}</span>
      {children}
    </div>
  );
};

const identificationOptions = [
  { value: "", label: "form2_select_identification_type" },
  { value: "passport", label: "form2_passport" },
  { value: "driverLicense", label: "form2_drivers_license" },
  { value: "nationalId", label: "form2_national_id" },
];

// Define the 4 allowed countries for jurisdiction
const jurisdictionCountries = [
  { value: "BB", label: "Barbados" },
  { value: "GY", label: "Guyana" },
  { value: "JM", label: "Jamaica" },
  { value: "TT", label: "Trinidad & Tobago" },
];

// Utility to check if two dates are the same, regardless of format
function datesMatch(inputDate, ocrText) {
  // Try MM/DD/YYYY and DD/MM/YYYY
  const [mm, dd, yyyy] = inputDate.split('/');
  const mmddyyyy = `${mm}/${dd}/${yyyy}`;
  const ddmmyyyy = `${dd}/${mm}/${yyyy}`;
  return (
    ocrText.includes(mmddyyyy) ||
    ocrText.includes(ddmmyyyy) ||
    ocrText.includes(`${yyyy}-${mm}-${dd}`) ||
    ocrText.includes(`${yyyy}-${dd}-${mm}`)
  );
}

const Form2step1 = ({ totalSteps }) => {
  // All hooks must be called unconditionally at the top level
  const router = useRouter();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    countryOfResidence: '',
    email: '',
    identificationType: '',
    dateOfIssue: '',
    licenseIdNumber: '',
    jurisdictionOfDocumentUse: '',
    identificationImage: null,
    identificationImageUrl: '',
  });
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'pending', 'success', 'fail'
  const [ocrResult, setOcrResult] = useState(null);
  const [verificationError, setVerificationError] = useState('');
  const [showNoImageAlert, setShowNoImageAlert] = useState(false);

  // Define error class name
  const errorClassName = "mt-2 text-sm text-red-600";

  // Initialize form steps and get methods
  useFormSteps();
  const methods = useForm();
  const nextBtnRef = useRef(null);

  // Load saved data when component mounts
  useEffect(() => {
    if (!methods) return;
    
    const savedData = getFormData();
    console.log("Loading saved data in useEffect:", savedData);
    
    if (savedData.step1) {
      console.log("Found saved step1 data:", savedData.step1);
      // Update local state
      setFormData(prev => ({
        ...prev,
        ...savedData.step1
      }));
      
      // Update React Hook Form values
      Object.entries(savedData.step1).forEach(([key, value]) => {
        methods.setValue(key, value);
      });
    }
  }, [methods]);

  // Save data when it changes
  useEffect(() => {
    console.log("Saving form data:", formData);
    const dataToSave = { ...formData };
    delete dataToSave.identificationImage; // Don't save the file object
    const saveResult = saveFormData(1, dataToSave);
    console.log("Save result:", saveResult);
  }, [formData]);

  // Early return if methods is not available
  if (!methods) return null;

  const {
    register,
    control,
    setError,
    trigger,
    getValues,
    setValue,
    watch
  } = methods;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Update React Hook Form value
    setValue(name, value);
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  function getPossibleDateFormats(dateStr) {
    // Accepts 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'
    const [yyyy, mm, dd] = dateStr.split('-');
    return [
      `${mm}/${dd}/${yyyy}`,
      `${dd}/${mm}/${yyyy}`,
      `${yyyy}-${mm}-${dd}`,
      `${yyyy}/${mm}/${dd}`,
      `${yyyy}/${dd}/${mm}`,
      `${dd}-${mm}-${yyyy}`,
      `${mm}-${dd}-${yyyy}`,
    ];
  }

  const verifyDocumentWithOCR = async (file, formData) => {
    if (file.type !== 'application/pdf') {
      setVerificationStatus('fail');
      setVerificationError('Please upload a valid PDF file.');
      return false;
    }

    setIsUploading(true);
    setVerificationStatus('pending');
    setVerificationError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF with error handling using pdfjs from react-pdf
      let pdf;
      try {
        console.log('Loading PDF with pdfjs version:', pdfjs.version);
        const loadingTask = pdfjs.getDocument({
          data: arrayBuffer,
          // Use less restrictive options for better compatibility
          disableRange: false,
          disableStream: false,
          disableAutoFetch: false,
        });
        pdf = await loadingTask.promise;
        console.log('PDF loaded successfully, pages:', pdf.numPages);
      } catch (pdfLoadError) {
        console.error('Error loading PDF:', pdfLoadError);
        
        // Check for specific error types
        if (pdfLoadError.message && pdfLoadError.message.includes('version')) {
          // Version mismatch error - try to continue anyway
          console.warn('PDF.js version mismatch detected, attempting to continue...');
          throw new Error('PDF version compatibility issue. Please refresh the page and try again.');
        } else if (pdfLoadError.name === 'PasswordException') {
          throw new Error('This PDF is password protected and cannot be processed.');
        } else if (pdfLoadError.name === 'InvalidPDFException') {
          throw new Error('The file appears to be corrupted or is not a valid PDF.');
        } else {
          throw new Error('Failed to load PDF. Please ensure the file is a valid PDF document.');
        }
      }
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        
        // Log the raw text content for each page
        console.log(`\n===== PAGE ${i} CONTENT =====`);
        console.log(pageText);
        console.log(`===== END PAGE ${i} =====\n`);
        
        fullText += pageText + ' ';
      }

      setOcrResult(fullText);
      
      // Log the complete extracted text
      console.log('\n========== COMPLETE EXTRACTED TEXT ==========');
      console.log(fullText);
      console.log('Total characters extracted:', fullText.length);
      console.log('==============================================\n');
      
      // Normalize text for better matching - remove extra spaces, special chars, make lowercase
      const cleanText = fullText
        .replace(/[^a-zA-Z0-9\s\/\-\.]/g, ' ') // Keep only alphanumeric, spaces, slashes, hyphens, dots
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .toLowerCase()
        .trim();
      
      console.log('\n========== CLEANED TEXT FOR MATCHING ==========');
      console.log(cleanText);
      console.log('================================================\n');
      
      console.log('\n========== FORM DATA TO VERIFY ==========');
      console.log('Form Data:', formData);
      console.log('==========================================\n');

      // Get current form values (use getValues to ensure we have the latest data)
      const currentValues = getValues();
      const { firstName, middleName, lastName, dateOfBirth } = { ...formData, ...currentValues };
      
      // Helper function to check name variations
      const checkNameVariations = (name, text) => {
        if (!name || name.trim() === '') return true;
        
        const cleanName = name.trim().toLowerCase();
        const variations = [
          cleanName,
          cleanName.replace(/\s+/g, ''), // Remove spaces
          cleanName.replace(/[^a-zA-Z]/g, ''), // Remove non-letters
        ];
        
        return variations.some(variant => {
          if (variant.length < 2) return false; // Skip very short names
          return text.includes(variant);
        });
      };

      const matchesFirstName = checkNameVariations(firstName, cleanText);
      const matchesMiddleName = !middleName || middleName.trim() === '' || checkNameVariations(middleName, cleanText);
      const matchesLastName = checkNameVariations(lastName, cleanText);

      let matchesDOB = true;
      if (dateOfBirth) {
        const possibleDates = getPossibleDateFormats(dateOfBirth);
        matchesDOB = possibleDates.some(fmt => {
          // Try different date format variations
          const datesToCheck = [
            fmt,
            fmt.replace(/\//g, '-'), // Replace / with -
            fmt.replace(/-/g, '/'), // Replace - with /
            fmt.replace(/[\/-]/g, ''), // Remove separators
            fmt.replace(/[\/-]/g, ' '), // Replace with spaces
          ];
          return datesToCheck.some(dateStr => cleanText.includes(dateStr.toLowerCase()));
        });
      }

      console.log('\n========== VERIFICATION RESULTS ==========');
      console.log('Looking for in document:');
      console.log('  First Name:', firstName, '→', matchesFirstName ? '✓ FOUND' : '✗ NOT FOUND');
      console.log('  Middle Name:', middleName || '(not provided)', '→', matchesMiddleName ? '✓ FOUND/OPTIONAL' : '✗ NOT FOUND');
      console.log('  Last Name:', lastName, '→', matchesLastName ? '✓ FOUND' : '✗ NOT FOUND');
      console.log('  Date of Birth:', dateOfBirth || '(not provided)', '→', matchesDOB ? '✓ FOUND/OPTIONAL' : '✗ NOT FOUND');
      console.log('\nOverall Verification:', (matchesFirstName && matchesLastName) ? '✓ PASSED' : '✗ FAILED');
      console.log('==========================================\n');

      // If no text was extracted, it might be an image-based PDF
      if (fullText.trim() === '') {
        setVerificationStatus('fail');
        setVerificationError('This appears to be an image-based PDF or the PDF contains no readable text. Please upload a text-based PDF document.');
        return false;
      }

      // Check if at least first name and last name match
      if (matchesFirstName && matchesLastName) {
        setVerificationStatus('success');
        setVerificationError('');
        return true;
      } else {
        setVerificationStatus('fail');
        let errorDetails = 'Document verification failed: ';
        const failedChecks = [];
        
        if (!matchesFirstName) failedChecks.push(`First name "${firstName}" not found`);
        if (!matchesLastName) failedChecks.push(`Last name "${lastName}" not found`);
        if (!matchesDOB && dateOfBirth) failedChecks.push('Date of birth not found');
        
        errorDetails += failedChecks.join(', ');
        errorDetails += '. Please ensure your document contains the exact information you entered, or check for spelling differences.';
        
        setVerificationError(errorDetails);
        return false;
      }
    } catch (error) {
      console.error("PDF Processing Error:", error);
      setVerificationStatus('fail');
      if (error.name === 'InvalidPDFException') {
        setVerificationError('The uploaded file appears to be corrupted or is not a valid PDF. Please try uploading a different file.');
      } else {
        setVerificationError(`Failed to process PDF: ${error.message}. Please ensure it is a valid document.`);
      }
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, identificationImage: 'PDF size must be less than 10MB' }));
        return;
      }
      
      // Clear any previous errors
      if (errors.identificationImage) {
        setErrors(prev => ({ ...prev, identificationImage: '' }));
      }
      
      // For preview
      setImagePreview(URL.createObjectURL(file));
      
      // Update form data with the file
      setFormData(prev => ({
        ...prev,
        identificationImage: file,
      }));
      
      // Get the current form values for OCR verification
      const currentFormValues = getValues();
      
      // Run OCR verification with current form data
      await verifyDocumentWithOCR(file, { ...formData, ...currentFormValues });
      
      // Upload to Cloudinary (if needed) - do this after OCR to avoid blocking
      try {
        const imageUrl = await uploadToCloudinary(file, 'identification');
        setFormData(prev => ({
          ...prev,
          identificationImageUrl: imageUrl
        }));
      } catch (error) {
        console.warn('Cloudinary upload failed:', error);
        // Don't block the process if Cloudinary fails
      }
    }
  };

  const handleNext = async () => {
    setVerificationError('');
    setShowNoImageAlert(false);
    const result = await trigger();
    if (!result) {
      return;
    }
    // Check if image is uploaded
    const fileList = watch('identificationImage');
    const file = fileList && fileList[0] ? fileList[0] : formData.identificationImage;
    if (!file) {
      setShowNoImageAlert(true);
      return;
    }
    // If already verified, proceed
    if (verificationStatus === 'success') {
      // Always go to step 3 (Signature & Notarization)
      router.push('/form-step3');
      return;
    }
    // If not verified, run verification
    setIsUploading(true);
    // Use getValues() for latest form data
    const values = getValues();
    const verified = await verifyDocumentWithOCR(file, values);
    setIsUploading(false);
    if (verified) {
      // Always go to step 3 (Signature & Notarization)
      router.push('/form-step3');
    } else {
      setVerificationError('Verification failed. Please ensure your document matches your input.');
    }
  };

  const handleBack = (e) => {
         e.preventDefault();
       router.push('/form-step1'); // Go back to document selection (which is now step 1)
       };

  const readURL = (event, previewId) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewImg = document.getElementById(previewId);
        if (previewImg) {
          previewImg.src = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const inputStyle = {
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "16px",
    width: "100%",
    color: "#333333",
    transition: "border-color 0.2s ease",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: "8px",
  };

  const errorStyle = {
    color: "#E53E3E",
    fontSize: "14px",
    marginTop: "4px",
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1" style={{ marginRight: '320px' }}>
        <div className=" mt-4 ml-4">
          <Logo variant="dark" size="default" />
        </div>
        <div className="container ">
          <div className="row justify-content-center">
            <div className="col-lg-10 ">
              <div className="form-card bg-white p-4 rounded-3">
                {/* Logo */}

                {/* Form Header */}
                <div className="text-center mb-5">
                  <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>{t("form2_heading_title")}</h2>
                  <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>{t("form2_heading_subtitle")}</p>
                </div>

                {/* Form Content */}
                <div className="form-content">
                  {/* Name Fields Row */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <div className="form-group">
                        <label style={labelStyle}>{t("form2_first_name")}</label>
                        <input
                          style={inputStyle}
                          type="text"
                          {...register("firstName", { 
                            required: t("form2_first_name_required"),
                            onChange: handleInputChange 
                          })}
                        />
                        {errors.firstName && (
                          <p style={errorStyle}>{errors.firstName.message}</p>
                        )}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="form-group">
                        <label style={labelStyle}>{t("form2_middle_name")}</label>
                        <input
                          style={inputStyle}
                          type="text"
                          {...register("middleName", {
                            onChange: handleInputChange 
                          })}
                        />
                        {errors.middleName && (
                          <p style={errorStyle}>{errors.middleName.message}</p>
                        )}
                      </div>
                    </Col>
                  </Row>

                  {/* Last Name Field */}
                  <div className="form-group mb-4">
                    <label style={labelStyle}>{t("form2_last_name")}</label>
                    <input
                      style={inputStyle}
                      type="text"
                      {...register("lastName", { 
                        required: t("form2_last_name_required"),
                        onChange: handleInputChange 
                      })}
                    />
                    {errors.lastName && (
                      <p style={errorStyle}>{errors.lastName.message}</p>
                    )}
                  </div>

                  {/* Date of Birth Field */}
                  <div className="form-group mb-4">
                    <label style={labelStyle}>{t("form2_date_of_birth")}</label>
                    <input
                      style={inputStyle}
                      type="date"
                      {...register("dateOfBirth", { 
                        required: t("form2_date_of_birth_required"),
                        onChange: handleInputChange 
                      })}
                    />
                    {errors.dateOfBirth && (
                      <p style={errorStyle}>{errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  {/* Country of Residence Field */}
                  <div className="form-group mb-4">
                    <label style={labelStyle}>{t("form2_country_of_residence")}</label>
                    <Controller
                      name="countryOfResidence"
                      control={control}
                      rules={{ required: t("form2_country_of_residence_required") }}
                      render={({ field, fieldState }) => (
                        <>
                          <CountrySelect 
                            {...field} 
                            onChange={(value) => {
                              field.onChange(value);
                              setFormData(prev => ({
                                ...prev,
                                countryOfResidence: value
                              }));
                            }}
                          />
                          {fieldState.error?.message && (
                            <p className="text-danger">{fieldState.error.message}</p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  {/* Email Field */}
                  <div className="form-group mb-4">
                    <label style={labelStyle}>{t("form2_email_address")}</label>
                    <input
                      style={inputStyle}
                      type="email"
                      {...register("email", { 
                        required: t("form2_email_required"),
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: t("form2_invalid_email")
                        },
                        onChange: handleInputChange 
                      })}
                    />
                    {errors.email && (
                      <p style={errorStyle}>{errors.email.message}</p>
                    )}
                  </div>

                  {/* Identification Type Field */}
                  <div className="form-group mb-4">
                    <label style={labelStyle}>{t("form2_identification_type_label")}</label>
                    <div style={{ width: "100%", position: "relative" }}>
                      <Controller
                        name="identificationType"
                        control={control}
                        rules={{ required: t("form2_identification_type_required") }}
                        render={({ field, fieldState }) => (
                          <div style={{ position: "relative" }}>
                            <div
                              onClick={() => setIsOpen(!isOpen)}
                              style={{
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#fff",
                                height: "60px",
                                padding: "10px 20px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                color: "#333333",
                              }}
                            >
                              <span>
                                {t(
                                  identificationOptions.find(
                                    (opt) => opt.value === field.value
                                  )?.label || "form2_select_identification_type"
                                )}
                              </span>
                              <i
                                className={`fa fa-chevron-down ${
                                  isOpen ? "rotate-icon" : ""
                                }`}
                                style={{ transition: "transform 0.3s ease" }}
                              />
                            </div>
                            {isOpen && (
                              <div
                                style={{
                                  border: "1px solid #E2E8F0",
                                  position: "absolute",
                                  backgroundColor: "#fff",
                                  width: "100%",
                                  zIndex: 10,
                                }}
                              >
                                {identificationOptions.map((option) => (
                                  <div
                                    key={option.value}
                                    onClick={() => {
                                      field.onChange(option.value);
                                      setFormData(prev => ({
                                        ...prev,
                                        identificationType: option.value
                                      }));
                                      setIsOpen(false);
                                      trigger("identificationType");
                                    }}
                                    style={{
                                      padding: "10px 20px",
                                      cursor: "pointer",
                                      backgroundColor:
                                        field.value === option.value
                                          ? "#ddeef9"
                                          : "#fff",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = "#cce0f5";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        field.value === option.value
                                          ? "#333333"
                                          : "#fff";
                                    }}
                                  >
                                    {t(option.label)}
                                  </div>
                                ))}
                              </div>
                            )}
                            {fieldState.error?.message && (
                              <p className="text-danger">{fieldState.error.message}</p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  {/* Date of Issue and License ID Fields */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <div className="form-group">
                        <label style={labelStyle}>{t("form2_date_of_issue")}</label>
                        <div style={{ position: "relative" }}>
                          <input
                            style={{
                              ...inputStyle,
                              paddingRight: "15px",
                            }}
                            type="date"
                            {...register("dateOfIssue", { 
                              required: t("form2_date_of_issue_required"),
                              onChange: handleInputChange 
                            })}
                            className="custom-date-input"
                          />
                          
                        </div>
                        {errors.dateOfIssue && (
                          <p style={errorStyle}>{errors.dateOfIssue.message}</p>
                        )}
                      </div>
                    </Col>
                    
                    <Col md={6}>
                      <div className="form-group">
                        <label style={labelStyle}>{t("form2_license_id")}</label>
                        <input
                          style={inputStyle}
                          type="text"
                          {...register("licenseIdNumber", { 
                            required: t("form2_license_id_required"),
                            onChange: handleInputChange 
                          })}
                        />
                        {errors.licenseIdNumber && (
                          <p style={errorStyle}>{errors.licenseIdNumber.message}</p>
                        )}
                      </div>
                    </Col>
                  </Row>

                  {/* Jurisdiction Field */}
                  <div className="form-group mb-4">
                    <label style={labelStyle}>{t("form2_jurisdiction")}</label>
                    <Controller
                      name="jurisdictionOfDocumentUse"
                      control={control}
                      rules={{ required: t("form2_jurisdiction_required") }}
                      render={({ field, fieldState }) => (
                        <>
                          <CountrySelect 
                            {...field} 
                            options={jurisdictionCountries}
                            onChange={(value) => {
                              field.onChange(value);
                              setFormData(prev => ({
                                ...prev,
                                jurisdictionOfDocumentUse: value
                              }));
                            }}
                          />
                          {fieldState.error?.message && (
                            <p className="text-danger">{fieldState.error.message}</p>
                          )}
                          <p className="my-4">{t("form2_jurisdiction_note")}</p>
                        </>
                      )}
                    />
                  </div>

                   {/* PDF Upload */}
                <div className="form-group mb-4">
                  <label style={labelStyle}>
                    Upload PDF Document <span style={errorStyle}>*Document must be in PDF format</span>
                  </label>
                  
                  <div
                    onClick={() => document.getElementById('identification-image').click()}
                    style={{
                      border: '2px dashed #E2E8F0',
                      borderRadius: '8px',
                      padding: '20px 16px',
                      cursor: 'pointer',
                      backgroundColor: '#FAFAFA',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      minHeight: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#274171';
                      e.currentTarget.style.backgroundColor = '#F7FAFC';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.backgroundColor = '#FAFAFA';
                    }}
                  >
                    <Upload size={20} style={{ color: '#274171', flexShrink: 0 }} />
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#2D3748' }}>
                        Click to upload PDF document
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#718096', marginTop: '2px' }}>
                        Max 10MB
                      </p>
                    </div>
                    
                    <input
                      id="identification-image"
                      type="file"
                      accept="application/pdf,.pdf"
                      {...register("identificationImage", {
                        required: t("form2_please_upload_identification_image"),
                        validate: {
                          fileSize: fileList => !fileList[0] || fileList[0].size <= 10 * 1024 * 1024 || "PDF size must be less than 10MB",
                          fileType: fileList => !fileList[0] || fileList[0].type === 'application/pdf' || "Please upload a valid PDF file"
                        }
                      })}
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                  
                  {/* Show uploaded file name */}
                  {watch("identificationImage") && watch("identificationImage")[0] && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <i className="fa fa-file-pdf-o" style={{ color: '#16A34A' }}></i>
                      <span style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>
                        {watch("identificationImage")[0].name}
                      </span>
                      <span style={{ fontSize: '12px', color: '#15803D' }}>
                        ({Math.round(watch("identificationImage")[0].size / 1024)} KB)
                      </span>
                    </div>
                  )}
                  
                  {errors.identificationImage && (
                    <p style={errorStyle}>{errors.identificationImage}</p>
                  )}
                </div>
                  <div style={{ 
                    marginBottom: '80px', // Increased bottom margin to make room for buttons
                    minHeight: '10px' // Ensure minimum height for alerts
                  }}>
                    {/* Verification Alerts */}
                    {showNoImageAlert && (
                      <Alert type="warning" message="Please upload your identification document and verify it before proceeding." />
                    )}
                    
                    {isUploading && (
                      <Alert type="info" message="Verifying your document, please wait..." />
                    )}
                    
                    {verificationStatus === 'success' && (
                      <Alert type="success" message="Verification successful! Your document matches your input." />
                    )}
                    
                    {verificationError && (
                      <Alert type="error" message={verificationError} />
                    )}
                    
                    {verificationStatus === 'fail' && !verificationError && (
                      <Alert 
                        type="error" 
                        message="Verification failed. The information on your document does not match your input."
                      >
                        <details style={{ marginTop: '8px' }}>
                          <summary style={{ cursor: 'pointer', fontWeight: '500' }}>Show OCR result</summary>
                          <pre style={{ 
                            whiteSpace: 'pre-wrap', 
                            fontSize: '12px', 
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: '#F8F9FA',
                            borderRadius: '4px',
                            border: '1px solid #E9ECEF'
                          }}>
                            {ocrResult}
                          </pre>
                        </details>
                      </Alert>
                    )}
                  </div>
                </div>
                {/* Upload Image Field ends*/}

                {/* Form Actions - Fixed positioning to prevent overlap */}
                <div className="actions" style={{ 
                  position: 'relative',
                  marginTop: '10px',
                  marginLeft: '80px',
                  paddingTop: '10px',
                  zIndex: 10
                }}>
                  <div className="d-flex justify-content-between align-items-center" style={{ maxWidth: '100%' }}>
                    
                      <span
                        className="btn"
                        onClick={handleBack}
                        style={{ 
                          backgroundColor: "#274171",
                          color: 'white',
                          padding: '10px 30px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '4px',
                          border: 'none',
                          fontSize: '16px',
                          fontWeight: '400',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1e3a5f';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#274171';
                        }}
                      >
                        <i className="fa fa-arrow-left"></i> Back
                      </span>
                    
                    <span
                      className="btn"
                      style={{ 
                        backgroundColor: "#274171",
                        color: 'white',
                        padding: '10px 30px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                      onClick={handleNext}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1e3a5f';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#274171';
                      }}
                    >
                      Next <i className="fa fa-arrow-right"></i>
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{
        width: '300px', 
        position: 'fixed', 
        right: 0, 
        top: 0, 
        height: '100vh',
        borderLeft: '1px solid rgba(0,0,0,0.1)',
        backgroundColor: '#091534'
      }}>
        <FormProgressSidebar currentStep={2} />
      </div>
    </div>
  );
};

export default Form2step1;
