import { useAuthStore } from "@/store/authStore";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";

const useMobileNumberSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const loginFormSchema = yup.object({
    phone: yup
      .string()
      .required("Phone number is required")
      .matches(/^\+?[1-9]\d{1,14}$/, "Phone number is not valid"),
    password: yup.string().required("Please enter your password"),
    keepMeLoggedIn: yup.bool().oneOf([true, false], "Invalid choice"),
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
      password: "",
      keepMeLoggedIn: false,
    },
  });

  const { signInWithPhone, confirmationResult } = useAuthStore();

  const login = handleSubmit(async (values) => {
    try {
      setLoading(true);
      
      if (!showVerificationInput) {
        // First step: Send verification code
        const { data } = await signInWithPhone(values.phone, values.password);
        if (data.success) {
          setShowVerificationInput(true);
          toast.success("Verification code sent to your phone");
        }
      } else {
        // Second step: Verify the code
        if (!confirmationResult) {
          throw new Error("No confirmation result found. Please try again.");
        }
        
        const result = await confirmationResult.confirm(verificationCode);
        if (result.user) {
          toast.success("Successfully signed in!");
          // Handle successful sign in (e.g., redirect to dashboard)
        }
      }
    } catch (e) {
      console.error("Error signing in:", e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  });

  return {
    loading,
    login,
    control,
    errors,
    showVerificationInput,
    setShowVerificationInput,
    verificationCode,
    setVerificationCode,
  };
};

export default useMobileNumberSignIn;
