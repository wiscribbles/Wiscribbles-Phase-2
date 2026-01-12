import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
const useMobileNumberForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const loginFormSchema = yup.object({
    phone: yup
      .string()
      .required("Phone number is required")
      .matches(/^\+?[1-9]\d{1,14}$/, "Phone number is not valid"),
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginFormSchema),
    mode: "onBlur",
    defaultValues: {
      phone: "",
    },
  });

  const forgotPassword = handleSubmit(async (values) => {
    try {
      /// implement forgot password
      console.log(values);
    } catch (e) {
      if (e.response?.data?.error) {
        control.setError("phone", {
          type: "custom",
          message: e.response?.data?.error,
        });
      }
    } finally {
      setLoading(false);
    }
  });
  return {
    loading,
    forgotPassword,
    control,
    errors,
  };
};
export default useMobileNumberForgotPassword;
