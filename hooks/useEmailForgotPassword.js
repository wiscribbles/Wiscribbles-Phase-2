import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
const useEmailForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const loginFormSchema = yup.object({
    email: yup
      .string()
      .email("Please enter a valid email")
      .required("Please enter your email"),
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "jonas_kahnwald@gmail.com",
    },
  });

  const forgotPassword = handleSubmit(async (values) => {
    try {
      /// implement forgot password
      console.log(values);
    } catch (e) {
      if (e.response?.data?.error) {
        control.setError("email", {
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
export default useEmailForgotPassword;
