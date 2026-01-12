// "use client";
// import {
//   Button,
//   FormGroup,
//   FormLabel,
//   FormControl,
//   FormCheck,
// } from "react-bootstrap";

// import { Controller } from "react-hook-form";
// import { forwardRef, useState } from "react";
// import { FiEye, FiEyeOff } from "react-icons/fi";

// import { useTranslations } from "next-intl";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { auth, getUserData } from "../firebase.js";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import Feedback from "react-bootstrap/esm/Feedback.js";

// const CustomCheckbox = forwardRef(
//   ({ label, name, onChange, onBlur, checked }, ref) => (
//     <FormGroup controlId={name}>
//       <FormCheck
//         label={label}
//         name={name}
//         ref={ref}
//         onChange={onChange}
//         className="gap-2"
//         onBlur={onBlur}
//         checked={checked}
//       />
//     </FormGroup>
//   )
// );

// const SignInEmailForm = () => {
//   const t = useTranslations();
//   const router = useRouter();
//   const {
//     control,
//     handleSubmit,
//     setError,
//     formState: { errors },
//   } = useForm();

//   const [showPassword, setShowPassword] = useState(false);
//   const [serverError, setServerError] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const onSubmit = async (data) => {
//     setServerError(null);
//     setIsSubmitting(true);

//     try {
//       // Sign in with Firebase
//       const userCredential = await signInWithEmailAndPassword(
//         auth,
//         data.email,
//         data.password
//       );

//       if (userCredential.user) {
//         // Get user data from Firestore
//         const { success, data: userData } = await getUserData(userCredential.user.uid);
        
//         if (success) {
//           console.log("User signed in successfully:", userData);
//           router.push("/dashboard");
//         } else {
//           setServerError("Failed to retrieve user data. Please try again.");
//         }
//       }
//     } catch (error) {
//       console.error("Login error:", error);
      
//       // Handle specific Firebase auth errors
//       if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
//         setServerError("Invalid email or password. Please try again.");
//       } else if (error.code === 'auth/too-many-requests') {
//         setServerError("Too many failed login attempts. Please try again later.");
//       } else if (error.code === 'auth/invalid-credential') {
//         setServerError("Invalid credentials. Please try again.");
//       } else {
//         setServerError("An error occurred during sign in. Please try again.");
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <>
//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="my-4">
//           <Controller
//             name="email"
//             control={control}
//             rules={{
//               required: t("validation.email_required"),
//               pattern: {
//                 value:
//                   /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
//                 message: t("validation.email_invalid"),
//               },
//             }}
//             render={({ field, fieldState }) => (
//               <FormGroup {...field} value={field.value}>
//                 <FormLabel htmlFor="email">{t("email_label")}</FormLabel>
//                 <FormControl
//                   size="sm"
//                   style={{ padding: "10px" }}
//                   id="email"
//                   {...field}
//                   isInvalid={Boolean(fieldState.error)}
//                   disabled={isSubmitting}
//                 />
//                 {fieldState.error && (
//                   <Feedback type="invalid" className="text-danger">
//                     {fieldState.error.message}
//                   </Feedback>
//                 )}
//               </FormGroup>
//             )}
//           />
//         </div>

//         <div className="mb-3">
//           <Controller
//             name="password"
//             control={control}
//             rules={{ required: t("validation.password_required") }}
//             render={({ field, fieldState }) => (
//               <FormGroup>
//                 <FormLabel htmlFor="password">{t("password_label")}</FormLabel>

//                 <div className="position-relative">
//                   <FormControl
//                     size="sm"
//                     style={{ padding: "10px" }}
//                     id="password"
//                     type={showPassword ? "text" : "password"}
//                     {...field}
//                     isInvalid={Boolean(fieldState.error)}
//                     disabled={isSubmitting}
//                   />
//                   {fieldState.error && (
//                     <Feedback type="invalid" className="text-danger">
//                       {fieldState.error.message}
//                     </Feedback>
//                   )}
//                   <span
//                     className="d-flex position-absolute top-50 end-0 translate-middle-y p-0 pe-2 me-2"
//                     onClick={() => setShowPassword(!showPassword)}
//                     style={{ cursor: "pointer" }}
//                   >
//                     {showPassword ? (
//                       <FiEye height={18} width={18} />
//                     ) : (
//                       <FiEyeOff height={18} width={18} />
//                     )}
//                   </span>
//                 </div>
//               </FormGroup>
//             )}
//           />
//         </div>

//         <div className="mb-3">
//           <Controller
//             name="keepMeLoggedIn"
//             control={control}
//             render={({ field }) => (
//               <CustomCheckbox {...field} label={t("keep_me_logged_in")} />
//             )}
//           />
//         </div>

//         {serverError && (
//           <div className="mb-3 text-danger text-center">{serverError}</div>
//         )}

//         <div className="text-center d-grid">
//           <Button
//             style={{
//               backgroundColor: "#0C1134",
//             }}
//             type="submit"
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? t("signing_in") : t("sign_in_heading")}
//           </Button>
//         </div>
//       </form>
//     </>
//   );
// };

// export default SignInEmailForm;
