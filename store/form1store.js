import { create } from "zustand";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

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

const useForm1store = create((set, get) => ({
  methods: null,
  setMethods: (methods) => set({ methods }), // Setter for methods

  // Function to create the combined schema
  createSchema: (t) => {
    const currentYY = new Date().getFullYear() % 100;
    const currentMM = new Date().getMonth() + 1; // JavaScript months are 0-indexed
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
            .max(12, t("form_error_month_range"))
            .test(
              "expiry-date-validation",
              t("form_error_card_expired"),
              function (value) {
                const { expiryYear } = this.parent;

                // Skip validation if no year yet
                if (!expiryYear) return true;

                // If the expiry year is the current year, check if the month has passed
                if (expiryYear === currentYY && value < currentMM) {
                  return false;
                }

                return true;
              }
            ),
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
  },

  getStepFields: (step) => {
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
  },
  // Validate only the fields for the current step
  getValidateStep: async (step) => {
    const validateStep = async () => {
      const stepFields = get().getStepFields(step);
      const currentValues = get().methods.getValues();

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
      // Special handling for step 3 - conditionally validate email field
      if (step === 3 && currentValues.method === "download") {
        // When download is selected, exclude email field from validation
        fieldNames = fieldNames.filter((field) => field !== "emailContact");
      }

      // Trigger validation only for these fields
      const result = await get().methods.trigger(fieldNames);
      if (result) {
        // Return the validated fields
        const values = get().methods.getValues();
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
    return validateStep;
  },
}));

export default useForm1store;
