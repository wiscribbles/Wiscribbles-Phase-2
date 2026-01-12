"use client";
import {
  Button, FormGroup, FormLabel, FormControl, FormCheck, Form, Row, Col,
} from "react-bootstrap";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

// components
import { Controller, set, useForm } from "react-hook-form";
import Feedback from "react-bootstrap/esm/Feedback";
import { forwardRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { storeUserData, auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import CustomPhoneInput from "./CustomPhoneInput";
import Select from 'react-select';

const CustomCheckbox = forwardRef(
  ({ label, name, onChange, onBlur, checked }, ref) => (
    <FormGroup controlId={name}>
      <FormCheck
        label={label}
        name={name}
        ref={ref}
        onChange={onChange}
        className="gap-2"
        onBlur={onBlur}
        checked={checked}
      />
    </FormGroup>
  )
);

// Payment Method Select Component
const PaymentMethodSelect = ({ value, onChange, onBlur, isInvalid }) => {
  const paymentOptions = [
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'PayPal', label: 'PayPal' },
    { value: 'CashApp', label: 'CashApp' }
  ];

  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: "38px",
      border: isInvalid ? "2px solid #dc3545" : "1px solid #ced4da",
      borderRadius: "0.375rem",
      fontSize: "14px",
      boxShadow: "none",
      "&:hover": {
        border: isInvalid ? "2px solid #dc3545" : "1px solid #86b7fe"
      }
    }),
    option: (base, state) => ({
      ...base,
      padding: "8px 12px",
      backgroundColor: state.isFocused ? "#f8f9fa" : "white",
      color: "#333",
      "&:hover": {
        backgroundColor: "#f8f9fa"
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: "#333"
    }),
    placeholder: (base) => ({
      ...base,
      color: "#6c757d"
    })
  };

  const selectedOption = paymentOptions.find(option => option.value === value);

  return (
    <Select
      options={paymentOptions}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? selected.value : '')}
      onBlur={onBlur}
      styles={customStyles}
      placeholder="Select Payment Method"
      isClearable={false}
      isSearchable={false}
    />
  );
};

// Caribbean Jurisdiction Select Component with Flags
const JurisdictionSelect = ({ value, onChange, onBlur, isInvalid }) => {
  const jurisdictionOptions = [
    { value: 'Barbados', label: 'Barbados', code: 'BB' },
    { value: 'Guyana', label: 'Guyana', code: 'GY' },
    { value: 'Jamaica', label: 'Jamaica', code: 'JM' },
    { value: 'Trinidad & Tobago', label: 'Trinidad & Tobago', code: 'TT' }
  ];

  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: "38px",
      border: isInvalid ? "2px solid #dc3545" : "1px solid #ced4da",
      borderRadius: "0.375rem",
      fontSize: "14px",
      boxShadow: "none",
      "&:hover": {
        border: isInvalid ? "2px solid #dc3545" : "1px solid #86b7fe"
      }
    }),
    option: (base, state) => ({
      ...base,
      display: "flex",
      alignItems: "center",
      padding: "8px 12px",
      backgroundColor: state.isFocused ? "#f8f9fa" : "white",
      color: "#333",
      "&:hover": {
        backgroundColor: "#f8f9fa"
      }
    }),
    singleValue: (base) => ({
      ...base,
      display: "flex",
      alignItems: "center"
    }),
    placeholder: (base) => ({
      ...base,
      color: "#6c757d"
    })
  };

  const formatOptionLabel = ({ label, code }) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <img
        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
        alt={`Flag of ${label}`}
        style={{ 
          width: "20px", 
          height: "15px", 
          marginRight: "10px",
          objectFit: "cover"
        }}
        onError={(e) => {
          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='15'%3E%3Crect width='20' height='15' fill='%23ddd'/%3E%3C/svg%3E";
        }}
      />
      <span>{label}</span>
    </div>
  );

  const selectedOption = jurisdictionOptions.find(option => option.value === value);

  return (
    <Select
      options={jurisdictionOptions}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? selected.value : '')}
      onBlur={onBlur}
      styles={customStyles}
      formatOptionLabel={formatOptionLabel}
      placeholder="Select Jurisdiction"
      isClearable={false}
      isSearchable={false}
    />
  );
};

const SignUpForm = () => {
  const t = useTranslations("sign-up");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [identificationFile, setIdentificationFile] = useState(null);
  const [notaryCertificateFile, setNotaryCertificateFile] = useState(null);
  const signUp = useAuthStore((s) => s.signUp); // your existing wrapper
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [cardType, setCardType] = useState("");
  const user = useAuthStore((s) => s.user); // or use your auth context/hook

  useEffect(() => {
    if (user) {
      router.replace("/dashboard"); // or your home page
    }
  }, [user, router]);

  // Define validation schema
  const schema = yup.object({
    signUpAs: yup.string().required(t("validation.signUpAs.required")),
    email: yup
      .string()
      .email(t("validation.email.invalid"))
      .required(t("validation.email.required")),
    phone: yup.string().required(t("validation.phone.required")),
    dateOfBirth: yup
      .date()
      .when('signUpAs', {
        is: 'Notary',
        then: (schema) => schema
          .max(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), "You must be at least 18 years old")
          .required("Date of birth is required"),
        otherwise: (schema) => schema.notRequired()
      }),
    jurisdictionOfPractice: yup
      .string()
      .when('signUpAs', {
        is: 'Notary',
        then: (schema) => schema.required("Jurisdiction of practice is required"),
        otherwise: (schema) => schema.notRequired()
      }),
    password: yup
      .string()
      .min(8, t("validation.password.min"))
      .required(t("validation.password.required")),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password"), null], t("validation.confirmPassword.oneOf"))
      .required(t("validation.confirmPassword.required")),
    termsAgreed: yup
      .boolean()
      .oneOf([true], t("validation.termsAgreed.oneOf"))
      .required(t("validation.termsAgreed.required")),
    notaryTermsAgreed: yup
      .boolean()
      .when('signUpAs', {
        is: 'Notary',
        then: (schema) => schema
          .oneOf([true], "You must agree to the notary terms and conditions")
          .required("Notary terms agreement is required"),
        otherwise: (schema) => schema.notRequired()
      }),
    attorneyTermsAgreed: yup
      .boolean()
      .when('signUpAs', {
        is: 'Attorney',
        then: (schema) => schema
          .oneOf([true], "You must agree to the attorney terms and conditions")
          .required("Attorney terms agreement is required"),
        otherwise: (schema) => schema.notRequired()
      }),
    payment_method: yup
      .string()
      .oneOf(
        ["Credit Card", "PayPal", "CashApp"],
        t("validation.payment_method.oneOf")
      )
      .required(t("validation.payment_method.required")),
    card_number: yup
      .string()
      .when("payment_method", {
        is: "Credit Card",
        then: (schema) => schema.required("Card number is required")
          .matches(/^[0-9]{16}$/, "Card number must be exactly 16 digits"),
        otherwise: (schema) => schema.notRequired()
      }),
    name: yup.string().required(t("validation.name.required")),
    expiry_date: yup
      .date()
      .when("payment_method", {
        is: "Credit Card",
        then: (schema) => schema.required("Expiry date is required")
          .min(new Date(), "Expiry date cannot be in the past"),
        otherwise: (schema) => schema.notRequired()
      }),
    CVV: yup.string().when("payment_method", {
      is: "Credit Card",
      then: (schema) => schema.length(3, t("validation.CVV.length")),
      otherwise: (schema) => schema.notRequired()
    }),
    identification: yup.mixed().notRequired(),
    notary_certificate: yup.mixed().notRequired(),
  });

  // Initialize form with validation
  const {
    handleSubmit,
    control,
    register,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      signUpAs: searchParams.get('signUpAs') || "Notary",
      termsAgreed: false,
      notaryTermsAgreed: false,
      attorneyTermsAgreed: false,
      payment_method: "Credit Card",
      card_number: "",
      name: "",
      dateOfBirth: "",
      jurisdictionOfPractice: "",
      expiry_date: new Date(),
      CVV: "",
      identification: null,
      notary_certificate: null,
    },
  });

  const signUpAs = watch("signUpAs");

  const readURL = (event, id) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (id === "identification") {
        setIdentificationFile(selectedFile);
        clearErrors("identification");
      } else if (id === "notary_certificate") {
        setNotaryCertificateFile(selectedFile);
        clearErrors("notary_certificate");
      }
      // Create a FileReader to read the file
      const reader = new FileReader();

      // Define the onload event for the reader
      reader.onload = () => {
        // Set the result as the source URL
        document.getElementById(id).setAttribute("src", reader.result);
      };

      // Read the file as a data URL
      reader.readAsDataURL(selectedFile);
    }
  };

  useEffect(() => {
    if (signUpAs !== "Notary") {
      setNotaryCertificateFile(null);
      setValue("notary_certificate", null);
      clearErrors("notary_certificate");
      const certificatePreview = document.getElementById("notary_certificate");
      if (certificatePreview) {
        certificatePreview.setAttribute("src", "/assets/v3/img/pf1.png");
      }
    }
  }, [signUpAs, clearErrors, setValue]);

  // Replace uploadFileToSupabase with uploadFileToFirebase
  // REPLACE the entire uploadFileToFirebase function with this:
const uploadFileToCloudinary = async (file, folder = '') => {
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'wiscribbles');
    formData.append('cloud_name', 'dgyv432jt');
    
    // Optional: Add folder structure
    if (folder) {
      formData.append('folder', folder);
    }

    // Determine the correct endpoint based on file type
    const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    const uploadEndpoint = isPDF 
      ? 'https://api.cloudinary.com/v1_1/dgyv432jt/raw/upload'
      : 'https://api.cloudinary.com/v1_1/dgyv432jt/image/upload';
    
    // Add resource_type for PDFs
    if (isPDF) {
      formData.append('resource_type', 'raw');
    }

    console.log(`Uploading ${isPDF ? 'PDF' : 'image'} to Cloudinary:`, file.name);

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Cloudinary upload successful:', data.secure_url);
    return data.secure_url; // Returns the Cloudinary URL
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      console.log("Form data:", data);
      let hasError = false;

      if (!identificationFile) {
        setError("identification", {
          type: "manual",
          message: t("validation.identification.required"),
        });
        hasError = true;
      } else {
        console.log("Identification file name:", identificationFile?.name);
      }

      if (data.signUpAs === "Notary") {
        if (!notaryCertificateFile) {
          setError("notary_certificate", {
            type: "manual",
            message: t("validation.notary_certificate.required"),
          });
          hasError = true;
        } else {
          console.log("Notary certificate file name:", notaryCertificateFile?.name);
        }
      } else {
        clearErrors("notary_certificate");
      }

      if (!data.email || !data.password || !data.name || !data.phone) {
        console.warn("Missing core fields", {
          email: !!data.email,
          password: !!data.password,
          name: !!data.name,
          phone: !!data.phone,
        });
      }

      if (hasError) {
        console.warn("Form submission blocked due to validation errors.");
        return;
      }

      if (hasError) return;

      setSubmitting(true);

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      if (!userCredential.user) {
        throw new Error('Failed to create user');
      }

      // Upload files to Firebase Storage
      const identificationFileUrl = await uploadFileToCloudinary(
        identificationFile,
        `users/${userCredential.user.uid}/identification`
      );
      
      const certificateFileUrl = data.signUpAs === "Notary"
        ? await uploadFileToCloudinary(
            notaryCertificateFile,
            `users/${userCredential.user.uid}/certificates`
          )
        : null;
      // Prepare user data with Firebase Storage URLs
      const getRoleFromSignUp = (value) => {
        switch (value) {
          case 'Notary':
            return 'notary';
          case 'Attorney':
            return 'attorney';
          case 'Business':
            return 'business';
          case 'Real Estate Agent':
            return 'real_estate_agent';
          default:
            return 'user';
        }
      };

      const determineInitialStatus = (value) => {
        if (value === 'Notary' || value === 'Attorney') {
          return 'pending_review';
        }
        return 'active';
      };

      const userData = {
        uid: userCredential.user.uid,
        signUpAs: data.signUpAs,
        role: getRoleFromSignUp(data.signUpAs),
        status: determineInitialStatus(data.signUpAs),
        email: data.email,
        phone: data.phone,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        jurisdictionOfPractice: data.jurisdictionOfPractice,
        payment_method: data.payment_method,
        card_number: data.card_number,
        expiry_date: data.expiry_date,
        identificationUrl: identificationFileUrl,
        certificateUrl: certificateFileUrl,
        termsAgreed: data.termsAgreed,
        notaryTermsAgreed: data.notaryTermsAgreed,
        attorneyTermsAgreed: data.attorneyTermsAgreed,
        approvedAt: null,
        rejectedAt: null,
        reviewerId: null,
        reviewNotes: '',
        createdAt: new Date().toISOString()
      };

      // Store user data in Firebase
      await storeUserData(userData);

      console.log("User signed up and data stored successfully!");
      router.push('/signIn');

    } catch (error) {
      console.error('Signup error:', error);
      // Handle specific Firebase auth errors here
      if (error.code === 'auth/email-already-in-use') {
        setError("email", {
          type: "manual",
          message: "Email already in use"
        });
      } else {
        // Handle other errors
        setError("email", {
          type: "manual",
          message: error.message || "An error occurred during signup"
        });
      }
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  // Example usage in any component
  const checkUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      const { success, data } = await getUserData(user.uid);
      if (success) {
        // Check user category
        switch (data.signUpAs) {
          case 'Notary':
            // Handle Notary specific logic
            break;
          case 'Attorney':
            // Handle Attorney specific logic
            break;
          case 'Business':
            // Handle Business specific logic
            break;
          case 'Real Estate Agent':
            // Handle Real Estate Agent specific logic
            break;
        }
      }
    }
  };

  function getCardType(number) {
    if (/^4/.test(number)) return "Visa";
    if (/^5[1-5]/.test(number) || /^2(2[2-9][1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[01][0-9]|720)/.test(number)) return "MasterCard";
    return "";
  }

  // Helper function to get country ISO codes for flag API
  function getCountryCode(countryName) {
    const countryMap = {
      'Barbados': 'BB',
      'Guyana': 'GY',
      'Jamaica': 'JM',
      'Trinidad & Tobago': 'TT'
    };
    return countryMap[countryName] || '';
  }

  return (
    <>
      <style jsx>{`
        .signup-form {
          width: 100%;
        }
        
        .signup-form .form-group {
          margin-bottom: 1rem;
        }
        
        .signup-form .form-label {
          font-weight: 500;
          color: #333;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        
        .signup-form .form-control {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        
        .signup-form .form-control:focus {
          border-color: #0C1134;
          box-shadow: 0 0 0 0.2rem rgba(12, 17, 52, 0.25);
        }
        
        .signup-form .form-control.is-invalid {
          border-color: #dc3545;
        }
        
        .signup-form .btn {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 6px;
          transition: all 0.15s ease-in-out;
        }
        
        .signup-form .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .signup-form .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .signup-form .row {
          margin-left: -0.5rem;
          margin-right: -0.5rem;
        }
        
        .signup-form .col,
        .signup-form .col-6 {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }
        
        .signup-form .wizard-photo-upload {
          border-radius: 8px;
          transition: border-color 0.15s ease-in-out;
        }
        
        .signup-form .wizard-photo-upload:hover {
          border-color: #0C1134;
        }
        
        .signup-form .text-danger {
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }
        
        /* Mobile specific styles */
        @media (max-width: 767px) {
          .signup-form .form-control {
            padding: 0.6rem;
            font-size: 16px; /* Prevent zoom on iOS */
          }
          
          .signup-form .btn {
            padding: 0.8rem;
            font-size: 1rem;
          }
          
          .signup-form .row {
            margin-left: -0.25rem;
            margin-right: -0.25rem;
          }
          
          .signup-form .col,
          .signup-form .col-6 {
            padding-left: 0.25rem;
            padding-right: 0.25rem;
            margin-bottom: 1rem;
          }
          
          .signup-form .col-6 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          
          .signup-form .wizard-photo-upload {
            margin-bottom: 1rem;
          }
          
          .signup-form .form-label {
            font-size: 0.85rem;
          }
        }
        
        /* Extra small mobile */
        @media (max-width: 480px) {
          .signup-form .form-control {
            padding: 0.5rem;
          }
          
          .signup-form .btn {
            padding: 0.7rem;
          }
          
          .signup-form .form-label {
            font-size: 0.8rem;
          }
        }
        
        /* Tablet styles */
        @media (min-width: 768px) and (max-width: 1023px) {
          .signup-form .form-control {
            padding: 0.7rem;
          }
          
          .signup-form .btn {
            padding: 0.8rem;
          }
        }
        
        /* Large desktop */
        @media (min-width: 1200px) {
          .signup-form .form-control {
            padding: 0.8rem;
          }
          
          .signup-form .btn {
            padding: 0.9rem;
          }
        }
      `}</style>
      
      <form onSubmit={handleSubmit(onSubmit)} className="signup-form">
        <div className="my-3">
          <Controller
            name="signUpAs"
            control={control}
            render={({ field, fieldState }) => (
              <FormGroup style={{ position: "relative", zIndex: 10 }}>
                <FormLabel htmlFor="signUpAs">Sign Up As</FormLabel>
                <FormControl
                  as="select"
                  id="signUpAs"
                  {...field}
                  isInvalid={Boolean(fieldState.error?.message)}
                  style={{
                    padding: "8px 10px",
                    cursor: "pointer",
                    appearance: "none",
                    paddingRight: "30px",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <option value="Notary">{t("options.Notary")}</option>
                  <option value="Attorney">{t("options.Attorney")}</option>
                  <option value="Business">{t("options.Business")}</option>
                  <option value="Real Estate Agent">
                    {t("options.Real_Estate_Agent")}
                  </option>
                  
                </FormControl>
                
                {fieldState.error?.message && (
                  <Feedback type="invalid" className="text-danger">
                    {fieldState.error?.message}
                  </Feedback>
                )}
              </FormGroup>
            )}
          />
        </div>

        <div className="mb-3">
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <FormGroup>
                <FormLabel htmlFor="email">{t("email")}</FormLabel>
                <FormControl
                  size="sm"
                  style={{ padding: "10px" }}
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  {...field}
                  isInvalid={Boolean(fieldState.error?.message)}
                />
                {fieldState.error?.message && (
                  <Feedback type="invalid" className="text-danger">
                    {fieldState.error?.message}
                  </Feedback>
                )}
              </FormGroup>
            )}
          />
        </div>

        <div className="mb-3">
          <FormLabel htmlFor="phone">{t("mobile_number")}</FormLabel>
          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <CustomPhoneInput {...field} />
                {fieldState.error?.message && (
                  <p className="text-danger">{fieldState.error?.message}</p>
                )}
              </>
            )}
          />
        </div>

        {/* Date of Birth Field - Only for Notary */}
        {watch("signUpAs") === "Notary" && (
          <div className="mb-3">
            <Controller
              name="dateOfBirth"
              control={control}
              render={({ field, fieldState }) => (
                <FormGroup>
                  <FormLabel htmlFor="dateOfBirth">Date of Birth</FormLabel>
                  <FormControl
                    size="sm"
                    style={{ padding: "10px" }}
                    id="dateOfBirth"
                    type="date"
                    {...field}
                    max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    isInvalid={Boolean(fieldState.error?.message)}
                  />
                  {fieldState.error?.message && (
                    <Feedback type="invalid" className="text-danger">
                      {fieldState.error?.message}
                    </Feedback>
                  )}
                </FormGroup>
              )}
            />
          </div>
        )}

        {/* Jurisdiction of Practice Field - Only for Notary, Caribbean Countries */}
        {watch("signUpAs") === "Notary" && (
          <div className="mb-3">
            <Controller
              name="jurisdictionOfPractice"
              control={control}
              render={({ field, fieldState }) => (
                <FormGroup>
                  <FormLabel htmlFor="jurisdictionOfPractice">Jurisdiction of Practice *</FormLabel>
                  <JurisdictionSelect
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={Boolean(fieldState.error?.message)}
                  />
                  {fieldState.error?.message && (
                    <Feedback type="invalid" className="text-danger">
                      {fieldState.error?.message}
                    </Feedback>
                  )}
                </FormGroup>
              )}
            />
          </div>
        )}

        <div className="mb-3">
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <FormGroup>
                <FormLabel htmlFor="password">{t("password")}</FormLabel>

                <div className="position-relative">
                  <FormControl
                    size="sm"
                    style={{ padding: "10px" }}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    
                    {...field}
                    isInvalid={Boolean(fieldState.error?.message)}
                  />
                  {fieldState.error?.message && (
                    <Feedback type="invalid" className="text-danger">
                      {fieldState.error?.message}
                    </Feedback>
                  )}
                  <span
                    className="d-flex position-absolute top-50 end-0 translate-middle-y p-0 pe-2 me-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {!fieldState.error &&
                      (showPassword ? (
                        <FiEye
                          height={18}
                          width={18}
                          className="cursor-pointer"
                        />
                      ) : (
                        <FiEyeOff
                          height={18}
                          width={18}
                          className="cursor-pointer"
                        />
                      ))}
                  </span>
                </div>
              </FormGroup>
            )}
          />
        </div>

        <div className="mb-3">
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field, fieldState }) => (
              <FormGroup>
                <FormLabel htmlFor="confirmPassword">
                  {t("confirm_password")}
                </FormLabel>

                <div className="position-relative">
                  <FormControl
                    size="sm"
                    style={{ padding: "10px" }}
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...field}
                    isInvalid={Boolean(fieldState.error?.message)}
                  />
                  {fieldState.error?.message && (
                    <Feedback type="invalid" className="text-danger">
                      {fieldState.error?.message}
                    </Feedback>
                  )}
                  <span
                    className="d-flex position-absolute top-50 end-0 translate-middle-y p-0 pe-2 me-2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {!fieldState.error &&
                      (showConfirmPassword ? (
                        <FiEye
                          height={18}
                          width={18}
                          className="cursor-pointer"
                        />
                      ) : (
                        <FiEyeOff
                          height={18}
                          width={18}
                          className="cursor-pointer"
                        />
                      ))}
                  </span>
                </div>
              </FormGroup>
            )}
          />
        </div>
        

        <div className="mb-3">
          <Controller
            name="payment_method"
            control={control}
            render={({ field, fieldState }) => (
              <FormGroup>
                <FormLabel htmlFor="payment_method">Payment Method</FormLabel>
                <PaymentMethodSelect
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={Boolean(fieldState.error?.message)}
                />
                {fieldState.error?.message && (
                  <Feedback type="invalid" className="text-danger">
                    {fieldState.error?.message}
                  </Feedback>
                )}
              </FormGroup>
            )}
          />
        </div>

        <Form.Group controlId="name" className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control type="text" placeholder="John Doe" {...register("name")} />
          {errors.name && (
            <Form.Text className="text-danger">{errors.name.message}</Form.Text>
          )}
        </Form.Group>

        {watch("payment_method") === "Credit Card" && (
          <>
            <Form.Group controlId="card_number" className="mb-3">
              <Form.Label>Card Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="1234 ****"
                maxLength={16}
                {...register("card_number")}
                onInput={e => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                  setCardType(getCardType(e.target.value));
                }}
              />
              {cardType && <div>Card Type: {cardType}</div>}
              {errors.card_number && (
                <Form.Text className="text-danger">
                  {errors.card_number.message}
                </Form.Text>
              )}
            </Form.Group>
            <Row className="mb-3">
              <Col>
                <Form.Group controlId="expiry_date">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    {...register("expiry_date")}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.expiry_date && (
                    <Form.Text className="text-danger">
                      {errors.expiry_date.message}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="CVV">
                  <Form.Label>CVV</Form.Label>
                  <Form.Control type="text" placeholder="***" {...register("CVV")} />
                  {errors.CVV && (
                    <Form.Text className="text-danger">
                      {errors.CVV.message}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </>
        )}

        {watch("payment_method") === "PayPal" && (
          <div className="mb-3 p-3" style={{ 
            backgroundColor: "#f8f9fa", 
            border: "1px solid #e9ecef", 
            borderRadius: "8px" 
          }}>
            <div className="d-flex align-items-center mb-2">
              <img 
                src="/assets/images/PayPal.png" 
                alt="PayPal" 
                style={{ width: "24px", height: "24px", marginRight: "8px" }}
              />
              <span style={{ fontWeight: "500" }}>PayPal Payment</span>
            </div>
            <p className="mb-0 text-muted small">
              You will be redirected to PayPal to complete your payment securely.
            </p>
          </div>
        )}

        {watch("payment_method") === "CashApp" && (
          <div className="mb-3 p-3" style={{ 
            backgroundColor: "#f8f9fa", 
            border: "1px solid #e9ecef", 
            borderRadius: "8px" 
          }}>
            <div className="d-flex align-items-center mb-2">
              <div style={{ 
                width: "24px", 
                height: "24px", 
                backgroundColor: "#00d632", 
                borderRadius: "4px", 
                marginRight: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "12px"
              }}>
                $
              </div>
              <span style={{ fontWeight: "500" }}>CashApp Payment</span>
            </div>
            <p className="mb-0 text-muted small">
              You will be redirected to CashApp to complete your payment.
            </p>
          </div>
        )}

      <Row className="mb-3">
        <Col xs={12} md={signUpAs === "Notary" ? 6 : 12}>
          <div
            style={{
              border: "1px solid black",
              maxWidth: "100%",
              height: "auto",
              display: "flex",
              flexDirection: "column",
              minHeight: "auto", // Remove fixed height to eliminate white space
            }}
            className="wizard-photo-upload position-relative p-2"
          >
            <div
              className="display-img text-center"
              style={{
                maxWidth: "100%",
                height: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px 0",
                marginBottom: "33px" // Small padding instead of minHeight
              }}
            >
              <img
                id="identification"
                src={"/assets/v3/img/pf1.png"}
                alt="your image"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                }}
              />
            </div>
            <label
              htmlFor="identification_image"
              className="text-center rounded"
              style={{
                fontSize: "10px",
                marginTop: "4px", // Reduced spacing
                cursor: "pointer",
                width: "85%", // Ensure full width for centering
                textAlign: "center", // Ensure text is centered
                display: "block", // Ensure block display for proper centering
              }}
            >
              Upload Identification
            </label>
            <input
              id="identification_image"
              {...register("identification")}
              onChange={(e) => readURL(e, "identification")}
              type="file"
              style={{ display: "none" }}
              accept=".pdf,.png,.jpg,.jpeg"
            />
          </div>
          {errors.identification && (
            <p className="text-danger">{errors.identification.message}</p>
          )}
        </Col>
        {signUpAs === "Notary" && (
          <Col xs={12} md={6}>
            <div
              style={{
                border: "1px solid black",
                maxWidth: "100%",
                height: "auto",
                display: "flex",
                flexDirection: "column",
                minHeight: "auto",
              }}
              className="wizard-photo-upload position-relative p-2"
            >
              <div
                className="display-img text-center"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px 0",
                  marginBottom: "33px"
                }}
              >
                <img
                  id="notary_certificate"
                  src={"/assets/v3/img/pf1.png"}
                  alt="Notary certificate preview"
                />
              </div>
              <label
                htmlFor="notary_certificate_image"
                className="text-center rounded"
                style={{
                  fontSize: "10px",
                  marginTop: "20px",
                  cursor: "pointer",
                  width: "85%",
                  textAlign: "center",
                  display: "block"
                }}
              >
                Upload Certificate of Notary
              </label>
              <input
                id="notary_certificate_image"
                {...register("notary_certificate")}
                onChange={(e) => readURL(e, "notary_certificate")}
                type="file"
                style={{ display: "none" }}
                accept=".pdf,.png,.jpg,.jpeg"
              />
            </div>
            {errors.notary_certificate && (
              <p className="text-danger">{errors.notary_certificate.message}</p>
            )}
          </Col>
        )}
      </Row>

        {/* Notary Terms and Conditions - Only for Notary Users */}
        {watch("signUpAs") === "Notary" && (
          <div className="mb-3">
            <Controller
              name="notaryTermsAgreed"
              control={control}
              render={({ field, fieldState }) => (
                <FormGroup>
                  <div className="d-flex align-items-start">
                    <FormCheck
                      id="notaryTermsAgreed"
                      isInvalid={Boolean(fieldState.error?.message)}
                      className="me-2 mt-1"
                      {...field}
                    />
                    <label htmlFor="notaryTermsAgreed" className="form-check-label small">
                    <span>
                      Have read, understood, and agreed to these terms and conditions.
                        <div className="mt-2 p-3 border rounded bg-light" style={{ fontSize: "11px", maxHeight: "200px", overflowY: "auto" }}>
                          <strong>AGREEMENT FOR NOTARY PUBLIC USERS</strong>
                          <br /><br />
                          <strong>1. Notary Certification and Authority</strong>
                          <br />
                          You hereby certify and warrant that:
                          <br />a) You are currently commissioned as a Notary Public in good standing in the state(s) you select on your profile.
                          <br />b) You will only perform notarizations for documents and signers located in jurisdictions where you are authorized to act and where Remote Online Notarization (RON) is legally permitted.
                          <br />c) You will immediately update your profile and cease performing notarizations if your commission expires, is suspended, or revoked.
                          <br /><br />
                          <strong>2. Compliance with Laws</strong>
                          <br />
                          You agree to strictly adhere to all laws, rules, and regulations governing notaries public and Remote Online Notarization (RON) in your commissioning state(s). This includes, but is not limited to:
                          <br />a) Performing dynamic knowledge-based authentication (KBA) and credential analysis for signer identity verification.
                          <br />b) Creating and maintaining a secure audio-visual recording of the entire notarial session.
                          <br />c) Making a complete and accurate entry in an electronic journal for every notarial act performed on this platform.
                          <br /><br />
                          <strong>3. Independent Contractor Status</strong>
                          <br />
                          You are an independent contractor. You are not an employee, agent, or partner of [Your Company Name]. You are solely responsible for your own taxes, insurance (including Errors &amp; Omissions insurance), and professional compliance.
                          <br /><br />
                          <strong>4. Recordkeeping</strong>
                          <br />
                          The platform will automatically generate and securely store the required RON journal entry and audio-visual recording for the minimum period mandated by your state's law. You acknowledge that these records are your legal property, and the platform stores them on your behalf as a custodian. You may access and download these records at any time.
                          <br /><br />
                          <strong>5. Indemnification</strong>
                          <br />
                          You agree to indemnify, defend, and hold harmless [Your Company Name] from any claims, damages, losses, or liabilities arising from your negligence, misconduct, or failure to comply with applicable notary laws.
                          <br /><br />
                          <strong>6. Fees and Payment</strong>
                          <br />
                          You will receive compensation for notarizations performed as outlined in the current fee schedule on the platform. [Your Company Name] will process customer payments and remit your share, minus any platform processing fees.
                        </div>
                      </span>
                    </label>
                  </div>
                  {fieldState.error?.message && (
                    <div className="text-danger small">
                      {fieldState.error.message}
                    </div>
                  )}
                </FormGroup>
              )}
            />
          </div>
        )}

        {/* Attorney Terms and Conditions - Only for Attorney Users */}
        {watch("signUpAs") === "Attorney" && (
          <div className="mb-3">
            <Controller
              name="attorneyTermsAgreed"
              control={control}
              render={({ field, fieldState }) => (
                <FormGroup>
                  <div className="d-flex align-items-start">
                    <FormCheck
                      id="attorneyTermsAgreed"
                      isInvalid={Boolean(fieldState.error?.message)}
                      className="me-2 mt-1"
                      {...field}
                    />
                    <label htmlFor="attorneyTermsAgreed" className="form-check-label small">
                      <span>
                        Have read, understood, and agreed to these terms and conditions.
                        <div className="mt-2 p-3 border rounded bg-light" style={{ fontSize: "11px", maxHeight: "200px", overflowY: "auto" }}>
                          <strong>AGREEMENT FOR ATTORNEY USERS</strong>
                          <br />This is a supplemental agreement for users who sign up as an Attorney. You must also agree to the Master Terms of Service.
                          <br /><br />
                          <strong>1. Professional License</strong>
                          <br />You warrant that you are a currently licensed attorney in good standing with the state bar(s) where you are admitted to practice.
                          <br /><br />
                          <strong>2. Attorney-Client Relationship</strong>
                          <br />You acknowledge that using this platform for a client's notarization does not create an attorney-client relationship between the client and [Your Company Name]. The notary performing the act is providing a ministerial service, not legal representation.
                          <br /><br />
                          <strong>3. Compliance with Professional Conduct Rules</strong>
                          <br />You agree that your use of the Service will comply with all applicable Rules of Professional Conduct for attorneys in your jurisdiction, including rules regarding technology, confidentiality, and the supervision of non-lawyer staff.
                          <br /><br />
                          <strong>4. Confidentiality and Data Security</strong>
                          <br />As an attorney, you have heightened duties of confidentiality. You are responsible for ensuring that your use of this platform aligns with your ethical obligations to protect client information.
                          <br /><br />
                          <strong>5. Legal Advice Disclaimer</strong>
                          <br />You acknowledge that the notaries on this platform are prohibited from providing legal advice. You, as the attorney, remain solely responsible for the legal content, advice, and implications of the documents being notarized for your clients.
                        </div>
                      </span>
                    </label>
                  </div>
                  {fieldState.error?.message && (
                    <div className="text-danger small">
                      {fieldState.error.message}
                    </div>
                  )}
                </FormGroup>
              )}
            />
          </div>
        )}

        {/* General Terms and Conditions */}
        <div className="mb-3">
          <Controller
            name="termsAgreed"
            control={control}
            render={({ field, fieldState }) => (
              <FormGroup>
                <div className="d-flex align-items-center">
                  <FormCheck
                    id="termsAgreed"
                    isInvalid={Boolean(fieldState.error?.message)}
                    className="me-2 d-flex align-items-center"
                    {...field}
                  />
                  <label htmlFor="termsAgreed" className="form-check-label">
                    <span>
                      {t("terms_agreement")}{" "}
                      <Link
                        href="/terms"
                        className="text-decoration-none"
                        style={{ color: "#0C1134" }}
                      >
                        {t("terms_conditions")}
                      </Link>{" "}
                      &{" "}
                      <Link
                        href="/privacy"
                        className="text-decoration-none"
                        style={{ color: "#0C1134" }}
                      >
                        {t("privacy_policy")}
                      </Link>
                    </span>
                  </label>
                </div>
                {fieldState.error?.message && (
                  <div className="text-danger small">
                    {fieldState.error.message}
                  </div>
                )}
              </FormGroup>
            )}
          />
        </div>
        {/* Embedded Master Terms of Service for quick reference */}
        <div className="mb-3">
          <details>
            <summary className="small" style={{ cursor: "pointer", color: "#0C1134" }}>
              View Master Terms of Service
            </summary>
            <div className="mt-2 p-3 border rounded bg-light" style={{ fontSize: "12px", maxHeight: "260px", overflowY: "auto", lineHeight: 1.6 }}>
              <strong>MASTER TERMS OF SERVICE (For All Users)</strong>
              <br />This agreement applies to everyone who uses the [Your Website Name] platform.
              <br /><br />
              <strong>1. Acceptance of Terms</strong>
              <br />By creating an account on [Your Website Name] (the "Site"), you agree to be bound by these Master Terms of Service, our Privacy Policy, and any applicable supplemental User Agreement.
              <br /><br />
              <strong>2. Eligibility</strong>
              <br />You must be at least 18 years of age and have the legal capacity to enter into a binding contract to use this Site.
              <br /><br />
              <strong>3. Account Registration and Security</strong>
              <br />You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
              <br /><br />
              <strong>4. Prohibited Conduct</strong>
              <br />You agree not to use the Site to:
              <br />a) Violate any applicable law or regulation.
              <br />b) Infringe upon the intellectual property rights of others.
              <br />c) Transmit any malicious code, viruses, or harmful content.
              <br />d) Engage in fraudulent, deceptive, or harmful practices.
              <br /><br />
              <strong>5. Intellectual Property</strong>
              <br />All content, features, and functionality on the Site, including software, text, and logos, are the exclusive property of [Your Company Name] and are protected by intellectual property laws.
              <br /><br />
              <strong>6. Service Modifications and Termination</strong>
              <br />We reserve the right to modify, suspend, or discontinue the Site (or any part of it) at any time. We may also suspend or terminate your account for any violation of these terms.
              <br /><br />
              <strong>7. Disclaimer of Warranties</strong>
              <br />The Site is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all warranties of any kind, whether express or implied.
              <br /><br />
              <strong>8. Limitation of Liability</strong>
              <br />To the fullest extent permitted by law, [Your Company Name] shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Site. Our total liability shall not exceed the total fees you have paid to us in the six (6) months prior to the event giving rise to the liability.
              <br /><br />
              <strong>9. Governing Law and Disputes</strong>
              <br />These Terms shall be governed by the laws of the State of [Your State]. Any disputes shall be resolved through binding arbitration in [Your City, State].
              <br /><br />
              <strong>10. Contact Information</strong>
              <br />Questions about these Master Terms can be sent to [Your Contact Email].
            </div>
          </details>
        </div>

        <div className="text-center d-grid">
          <Button
            style={{
              backgroundColor: "#0C1134",
              minHeight: "45px"
            }}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing Up...
              </span>
            ) : (
              t("sign_up_button")
            )}
          </Button>
        </div>
      </form>
    </>
  );
};
export default SignUpForm;
