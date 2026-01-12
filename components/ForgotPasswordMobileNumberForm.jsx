"use client";
import { Button } from "react-bootstrap";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";

// components

import { Controller } from "react-hook-form";
import { forwardRef } from "react";
import { useTranslations } from "next-intl";
import useMobileNumberForgotPassword from "@/hooks/useMobileNumberForgotPassword";

const CustomPhoneInput = forwardRef(({ value, onChange, onBlur }, ref) => (
  <PhoneInput
    country={"us"}
    inputStyle={{ width: "100%", padding: "10px" }}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    inputProps={{
      ref: ref, // Forward the ref to the input element
    }}
  />
));

const ForgotPasswordMobileNumberForm = () => {
  const t = useTranslations();

  const { forgotPassword, control, errors } = useMobileNumberForgotPassword();
  return (
    <>
      <form onSubmit={forgotPassword}>
        <div className="my-4">
          <label htmlFor="phone">{t("phone_label")}</label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => <CustomPhoneInput {...field} />}
          />
          {errors.phone?.message && (
            <p className="text-danger">{errors.phone?.message}</p>
          )}
        </div>

        <div className="text-center d-grid">
          <Button
            style={{
              backgroundColor: "#0C1134",
            }}
            type="submit"
          >
            {t("send_verification_message")}
          </Button>
        </div>
      </form>
    </>
  );
};
export default ForgotPasswordMobileNumberForm;
