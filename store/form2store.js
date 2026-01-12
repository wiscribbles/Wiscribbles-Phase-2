import { create } from "zustand";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

// Step-specific schema definitions
const stepOneSchema = {
  firstName: true,
  middleName: true,
  lastName: true,
  dateOfBirth: true,
  countryOfResidence: true,
  email: true,
  identificationType: true,
  dateOfIssue: true,
  licenseIdNumber: true,
  jurisdictionOfDocumentUse: true,
  identificationImage: true,
};

const stepTwoSchema = {
  documentType: true,
};

const stepThreeSchema = {
  signatureMethod: true,
  signatureImage: true,
};

const stepFourSchema = {
  paymentMethod: true,
  cardNumber: true,
  cardholderName: true,
  expiryMonth: true,
  expiryYear: true,
  cvv: true,
  paymentFirstName: true,
  paymentLastName: true,
  paymentEmail: true,
  phone: true,
  country: true,
  province: true,
  zip: true,
  address: true,
  city: true,
};

const stepFiveSchema = {
  method: true,
  emailContact: true,
};

const useForm2store = create((set, get) => ({
  methods: null,
  setMethods: (methods) => set({ methods }), // Setter for methods

  // Function to create the combined schema
  createSchema: (t) => {
    const currentYY = new Date().getFullYear() % 100;
    const currentMM = new Date().getMonth() + 1; // JavaScript months are 0-indexed

    return yup.object().shape({
      // Step One
      firstName: yup
        .string()
        .trim()
        .required(t("form2_first_name_required"))
        .min(2, t("form2_first_name_min"))
        .max(50, t("form2_first_name_max")),

      middleName: yup
        .string()
        .trim()
        .required(t("form2_middle_name_required"))
        .max(50, t("form2_middle_name_max")),

      lastName: yup
        .string()
        .trim()
        .required(t("form2_last_name_required"))
        .min(2, t("form2_last_name_min"))
        .max(50, t("form2_last_name_max")),

      dateOfBirth: yup
        .date()
        .typeError(t("form2_invalid_dob"))
        .required(t("form2_dob_required"))
        .max(new Date(), t("form2_dob_max")),

      countryOfResidence: yup
        .string()
        .required(t("form2_country_required"))
        .min(2, t("form2_country_min")),

      email: yup
        .string()
        .required(t("form2_email_required"))
        .email(t("form2_email_invalid")),

      identificationType: yup
        .string()
        .required(t("form2_identification_type_required")),

      dateOfIssue: yup
        .date()
        .typeError(t("form2_invalid_date_of_issue"))
        .required(t("form2_date_of_issue_required"))
        .max(new Date(), t("form2_date_of_issue_max")),

      licenseIdNumber: yup
        .string()
        .required(t("form2_license_id_required"))
        .min(4, t("form2_license_id_min"))
        .max(50, t("form2_license_id_max")),

      jurisdictionOfDocumentUse: yup
        .string()
        .required(t("form2_jurisdiction_required")),

      identificationImage: yup
        .string()
        .required(t("form2_identification_image_required")),

      // Step Two
      documentType: yup.string().required(t("form2_document_type_required")),

      // Step Three
      signatureMethod: yup
        .string()
        .oneOf(["E-Sign", "Notary"])
        .required(t("form2_signature_method_required")),

      signatureImage: yup
        .string()
        .required(t("form2_signature_image_required")),

      // Step Four
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

      // Add a test that validates the combination of month and year
      // This should be added to your validation schema

      cvv: yup.string().when("paymentMethod", {
        is: "CreditCard",
        then: (schema) =>
          schema
            .required(t("form_error_cvv_required"))
            .matches(/^[0-9]{3,4}$/, t("form_error_cvv_format")),
        otherwise: (schema) => schema.notRequired(),
      }),

      paymentFirstName: yup
        .string()
        .required(t("form2_payment_first_name_required")),

      payemntLastName: yup
        .string()
        .required(t("form2_payment_last_name_required")),

      paymentEmail: yup
        .string()
        .email(t("form2_payment_email_invalid"))
        .required(t("form2_payment_email_required")),

      phone: yup
        .string()
        .max(15, t("form2_phone_max"))
        .required(t("form2_phone_required")),

      country: yup.string().required(t("form2_country_field_required")),

      province: yup.string().required(t("form2_province_required")),

      zip: yup.string().required(t("form2_zip_required")),

      address: yup.string().required(t("form2_address_required")),

      city: yup.string().required(t("form2_city_required")),

      // Step Five
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
      case 4:
        return stepFourSchema;
      case 5:
        return stepFiveSchema;
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
      if (step === 4 && currentValues.paymentMethod === "PayPal") {
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
      if (step === 5 && currentValues.method === "download") {
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

export default useForm2store;
