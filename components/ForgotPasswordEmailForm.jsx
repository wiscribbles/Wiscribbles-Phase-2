"use client";
import { Button, FormGroup, FormLabel, FormControl } from "react-bootstrap";

// components

import { Controller } from "react-hook-form";
import Feedback from "react-bootstrap/esm/Feedback";

import { useTranslations } from "next-intl";
import useEmailForgotPassword from "@/hooks/useEmailForgotPassword";

const ForgotPasswordEmailForm = () => {
  const t = useTranslations();

  const { forgotPassword, control } = useEmailForgotPassword();
  return (
    <>
      <form onSubmit={forgotPassword}>
        <div className="my-4">
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <FormGroup>
                <FormLabel htmlFor="email">{t("email_label")}</FormLabel>
                <FormControl
                  size="sm"
                  style={{ padding: "10px" }}
                  id="email"
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

        <div className="text-center d-grid">
          <Button
            style={{
              backgroundColor: "#0C1134",
            }}
            type="submit"
          >
            {t("send_verification_link")}
          </Button>
        </div>
      </form>
    </>
  );
};
export default ForgotPasswordEmailForm;
