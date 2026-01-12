import { useAuthStore } from "@/store/authStore";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as yup from "yup";
const useEmailSignIn = () => {
  const [loading, setLoading] = useState(false);
  const loginFormSchema = yup.object({
    email: yup
      .string()
      .email("Please enter a valid email")
      .required("Please enter your email"),
    password: yup.string().required("Please enter your password"),
    keepMeLoggedIn: yup.bool().oneOf([true, false], "Invalid choice"),
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(loginFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "jonas_kahnwald@gmail.com",
      password: "",
      keepMeLoggedIn: false,
    },
  });
  const { signInWithEmail } = useAuthStore();

  const login = handleSubmit(async (values) => {
    try {
      const { data } = await signInWithEmail(values.email, values.password);

      console.log("signed in", data);
    } catch (e) {
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
  };
};
export default useEmailSignIn;
