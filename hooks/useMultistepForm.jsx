import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslations } from "next-intl";

// Step-specific schema definitions
const stepOneSchema = {
  referenceNumber: true,
  day: true,
  month: true,
  year: true,
};

const stepTwoSchema = {
  paymentMethod: true,
  cardNumber: true,
  cardholderName: true,
  expiryMonth: true,
  expiryYear: true,
  cvv: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  country: true,
  province: true,
  zip: true,
  address: true,
  city: true,
};

const stepThreeSchema = {
  method: true,
  emailContact: true,
};

// Custom hook for multistep form
const useMultistepForm = (step, defaultValues = {}) => {
  const t = useTranslations();

  // Combined schema for all steps
  const createSchema = () => {
    const currentYY = new Date().getFullYear() % 100;

    return yup.object().shape({
      // Step One Schema
      referenceNumber: yup
        .string()
        .required(t("form_error_reference_number_required")),
      day: yup
        .number()
        .required(t("form_error_day_required"))
        .min(1, t("form_error_invalid_day"))
        .max(31, t("form_error_invalid_day")),
      month: yup
        .number()
        .required(t("form_error_month_required"))
        .min(1, t("form_error_invalid_month"))
        .max(12, t("form_error_invalid_month")),
      year: yup
        .number()
        .required(t("form_error_year_required"))
        .min(1900, t("form_error_invalid_year"))
        .max(new Date().getFullYear(), t("form_error_invalid_year")),

      // Step Two Schema
      paymentMethod: yup
        .string()
        .oneOf(["CreditCard", "PayPal"], t("form_error_select_payment_method"))
        .optional(),
      cardNumber: yup.string().when("paymentMethod", {
        is: "CreditCard",
        then: (schema) =>
          schema
            .required(t("form_error_card_number_required"))
            .matches(/^[0-9]{13,19}$/, t("form_error_card_number_format")),
        otherwise: (schema) => schema.notRequired(),
      }),
      cardholderName: yup.string().when("paymentMethod", {
        is: "CreditCard",
        then: (schema) =>
          schema.required(t("form_error_cardholder_name_required")),
        otherwise: (schema) => schema.notRequired(),
      }),
      expiryMonth: yup.number().when("paymentMethod", {
        is: "CreditCard",
        then: (schema) =>
          schema
            .typeError(t("form_error_expiry_month_required"))
            .required(t("form_error_expiry_month_required"))
            .min(1, t("form_error_month_range"))
            .max(12, t("form_error_month_range")),
        otherwise: (schema) => schema.notRequired(),
      }),
      expiryYear: yup.number().when("paymentMethod", {
        is: "CreditCard",
        then: (schema) =>
          schema
            .typeError(t("form_error_expiry_year_required"))
            .required(t("form_error_expiry_year_required"))
            .min(currentYY, t("form_error_card_expired")),
        otherwise: (schema) => schema.notRequired(),
      }),
      cvv: yup.string().when("paymentMethod", {
        is: "CreditCard",
        then: (schema) =>
          schema
            .required(t("form_error_cvv_required"))
            .matches(/^[0-9]{3,4}$/, t("form_error_cvv_format")),
        otherwise: (schema) => schema.notRequired(),
      }),
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      email: yup.string().email().required(),
      phone: yup.string().max(15).required(),
      country: yup.string().required(),
      province: yup.string().required(),
      zip: yup.string().required(),
      address: yup.string().required(),
      city: yup.string().required(),

      // Step Three Schema
      method: yup.string().oneOf(["download", "email"]).optional(),
      emailContact: yup
        .string()
        .email(t("form_error_invalid_email_contact"))
        .when("method", {
          is: "email",
          then: (schema) => schema.required(t("form_error_email_required")),
          otherwise: (schema) => schema.notRequired(),
        }),
    });
  };
  // Get the specific fields for the current step
  const getStepFields = () => {
    switch (step) {
      case 1:
        return stepOneSchema;
      case 2:
        return stepTwoSchema;
      case 3:
        return stepThreeSchema;
      default:
        return {};
    }
  };

  // Setup form with the combined schema
  const methods = useForm({
    resolver: yupResolver(createSchema()),
    mode: "onTouched",
    defaultValues: {
      // Default values for step 1
      day: new Date().getDate(),
      month: new Date().getMonth() + 1, // JavaScript months are 0-indexed
      year: new Date().getFullYear(),
      // Default values for step 2
      paymentMethod: "CreditCard",
      // Default values for step 3
      method: "download",
      // Spread any custom defaults passed in
      ...defaultValues,
    },
  });

  // Method to validate only the current step's fields
  const validateStep = async () => {
    const stepFields = getStepFields();
    const currentValues = methods.getValues();

    // Create an array of field names to validate based on conditions
    let fieldNames = Object.keys(stepFields);

    // Special handling for step 2 - conditionally validate credit card fields
    if (step === 2 && currentValues.paymentMethod === "PayPal") {
      // When PayPal is selected, exclude credit card fields from validation
      fieldNames = fieldNames.filter(
        (field) =>
          ![
            "cardNumber",
            "cardholderName",
            "expiryMonth",
            "expiryYear",
            "cvv",
          ].includes(field)
      );
    }
    console.log(fieldNames);
    // Special handling for step 3 - conditionally validate email field
    if (step === 3 && currentValues.method === "download") {
      // When download is selected, exclude email field from validation
      fieldNames = fieldNames.filter((field) => field !== "emailContact");
    }

    // Trigger validation only for these fields
    const result = await methods.trigger(fieldNames);
    if (result) {
      // Return the validated fields
      const values = methods.getValues();
      const stepValues = {};

      fieldNames.forEach((field) => {
        if (values[field] !== undefined) {
          stepValues[field] = values[field];
        }
      });

      return { isValid: true, data: stepValues };
    }

    return { isValid: false, data: null };
  };

  return {
    ...methods,
    validateStep,
  };
};

export default useMultistepForm;
