// "use client";
// import {
//   Button, FormGroup, FormLabel, FormControl, FormCheck, Form, Row, Col,
// } from "react-bootstrap";

// // components
// import { Controller, set, useForm } from "react-hook-form";
// import Feedback from "react-bootstrap/esm/Feedback";
// import { forwardRef, useState } from "react";
// import { FiEye, FiEyeOff } from "react-icons/fi";
// import { useTranslations } from "next-intl";
// import Link from "next/link";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as yup from "yup";
// import { useAuthStore } from "@/store/authStore";
// import CustomPhoneInput from "./CustomPhoneInput";
// import { useRouter } from 'next/navigation';
// import { storeUserData } from '../firebase';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { auth } from "/firebase.js"

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

// const SignUpForm = () => {
//   const t = useTranslations("sign-up");
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [identificationFile, setIdentificationFile] = useState(null);
//   const [notaryCertificateFile, setNotaryCertificateFile] = useState(null);
//   const signUp = useAuthStore((s) => s.signUp); // your existing wrapper
//   const [submitting, setSubmitting] = useState(false);
//   const router = useRouter();

//   // Define validation schema
//   const schema = yup.object({
//     signUpAs: yup.string().required(t("validation.signUpAs.required")),
//     email: yup
//       .string()
//       .email(t("validation.email.invalid"))
//       .required(t("validation.email.required")),
//     phone: yup.string().required(t("validation.phone.required")),
//     password: yup
//       .string()
//       .min(8, t("validation.password.min"))
//       .required(t("validation.password.required")),
//     confirmPassword: yup
//       .string()
//       .oneOf([yup.ref("password"), null], t("validation.confirmPassword.oneOf"))
//       .required(t("validation.confirmPassword.required")),
//     termsAgreed: yup
//       .boolean()
//       .oneOf([true], t("validation.termsAgreed.oneOf"))
//       .required(t("validation.termsAgreed.required")),
//     payment_method: yup
//       .string()
//       .oneOf(
//         ["Credit Card", "PayPal", "CashApp"],
//         t("validation.payment_method.oneOf")
//       )
//       .required(t("validation.payment_method.required")),
//     card_number: yup.string().required(t("validation.card_number.required")),
//     name: yup.string().required(t("validation.name.required")),
//     expiry_date: yup.date().required(t("validation.expiry_date.required")),
//     CVV: yup.string().length(3, t("validation.CVV.length")),
//     identification: yup.mixed().notRequired(),
//     notary_certificate: yup.mixed().notRequired(),
//   });

//   // Initialize form with validation
//   const {
//     handleSubmit,
//     control,
//     register,
//     watch,
//     setValue,
//     setError,
//     formState: { errors },
//   } = useForm({
//     resolver: yupResolver(schema),
//     mode: "onChange",
//     defaultValues: {
//       signUpAs: "Notary",
//       termsAgreed: false,
//       payment_method: "Credit Card",
//       card_number: "123",
//       name: "",
//       expiry_date: new Date(),
//       CVV: "123",
//       identification: null,
//       notary_certificate: null,
//     },
//   });

//   const readURL = (event, id) => {
//     const selectedFile = event.target.files[0];
//     if (selectedFile) {
//       // Perform actions with the selected file
//       // Create a FileReader to read the file
//       const reader = new FileReader();

//       // Define the onload event for the reader
//       reader.onload = () => {
//         // Set the result as the source URL
//         if (id === "identification") setIdentificationFile(selectedFile);
//         else if (id === "notary_certificate")
//           setNotaryCertificateFile(selectedFile);
//         document.getElementById(id).setAttribute("src", reader.result);
//       };

//       // Read the file as a data URL
//       reader.readAsDataURL(selectedFile);
//     }
//   };

//   const uploadFileToCloudinary = async (file, folder = '') => {
//     if (!file) return null;

//     try {
//       const formData = new FormData();
//       formData.append('file', file);
//       formData.append('upload_preset', 'WiScribbles');
//       formData.append('cloud_name', 'dgyv432jt');

//       // Optional: Add folder structure
//       if (folder) {
//         formData.append('folder', folder);
//       }

//       const response = await fetch(
//         `https://api.cloudinary.com/v1_1/dgyv432jt/image/upload`,
//         {
//           method: 'POST',
//           body: formData,
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`Upload failed: ${response.statusText}`);
//       }

//       const data = await response.json();
//       return data.secure_url; // Returns the Cloudinary URL

//     } catch (error) {
//       console.error('Cloudinary upload error:', error);
//       throw error;
//     }
//   };

//   // Replace uploadFileToSupabase with uploadFileToFirebase
//   // const uploadFileToFirebase = async (file, path) => {
//   //   if (!file) return null;

//   //   try {
//   //     const fileExt = file.name.split('.').pop();
//   //     const fileName = `${Date.now()}.${fileExt}`;
//   //     const filePath = `${path}/${fileName}`;

//   //     // Create a reference to the file location in Firebase Storage
//   //     const storageRef = ref(storage, filePath);

//   //     // Upload the file
//   //     await uploadBytes(storageRef, file);

//   //     // Get the download URL
//   //     const downloadURL = await getDownloadURL(storageRef);
//   //     return downloadURL;
//   //   } catch (error) {
//   //     console.error('Error in file upload:', error);
//   //     throw error;
//   //   }
//   // };

//   const onSubmit = async (data) => {
//     try {
//       console.log("Form data:", data);
//       let hasError = false;

//       if (!identificationFile) {
//         setError("identification", {
//           type: "manual",
//           message: t("validation.identification.required"),
//         });
//         hasError = true;
//       }

//       if (!notaryCertificateFile) {
//         setError("notary_certificate", {
//           type: "manual",
//           message: t("validation.notary_certificate.required"),
//         });
//         hasError = true;
//       }

//       if (hasError) return;

//       setSubmitting(true);

//       // Create user in Firebase Authentication
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         data.email,
//         data.password
//       );

//       if (!userCredential.user) {
//         throw new Error('Failed to create user');
//       }

//       // Upload files to Firebase Storage
//       // Replace this section in your onSubmit function:

//       // Upload files to Cloudinary instead of Firebase Storage
//       const identificationFileUrl = await uploadFileToCloudinary(
//         identificationFile,
//         `users/${userCredential.user.uid}/identification`
//       );

//       const certificateFileUrl = await uploadFileToCloudinary(
//         notaryCertificateFile,
//         `users/${userCredential.user.uid}/certificates`
//       );

//       // Rest of your userData object remains the same
//       const userData = {
//         uid: userCredential.user.uid,
//         signUpAs: data.signUpAs,
//         email: data.email,
//         phone: data.phone,
//         name: data.name,
//         payment_method: data.payment_method,
//         card_number: data.card_number,
//         expiry_date: data.expiry_date,
//         identificationUrl: identificationFileUrl, // Now Cloudinary URL
//         certificateUrl: certificateFileUrl,       // Now Cloudinary URL
//         createdAt: new Date().toISOString(),
//         status: "pending"
//       };

//       // Store user data in Firebase
//       await storeUserData(userData);

//       console.log("User signed up and data stored successfully!");
//       router.push('/auth/signin');

//     } catch (error) {
//       console.error('Signup error:', error);
//       // Handle specific Firebase auth errors here
//       if (error.code === 'auth/email-already-in-use') {
//         setError("email", {
//           type: "manual",
//           message: "Email already in use"
//         });
//       } else {
//         // Handle other errors
//         setError("email", {
//           type: "manual",
//           message: error.message || "An error occurred during signup"
//         });
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Example usage in any component
//   const checkUserData = async () => {
//     const user = auth.currentUser;
//     if (user) {
//       const { success, data } = await getUserData(user.uid);
//       if (success) {
//         // Check user category
//         switch (data.signUpAs) {
//           case 'Notary':
//             // Handle Notary specific logic
//             break;
//           case 'Attorney':
//             // Handle Attorney specific logic
//             break;
//           case 'Business':
//             // Handle Business specific logic
//             break;
//           case 'Real Estate Agent':
//             // Handle Real Estate Agent specific logic
//             break;
//         }
//       }
//     }
//   };

//   return (
//     <>
//       <form onSubmit={handleSubmit(onSubmit)}>
//         <div className="my-3">
//           <Controller
//             name="signUpAs"
//             control={control}
//             render={({ field, fieldState }) => (
//               <FormGroup style={{ position: "relative", zIndex: 10 }}>
//                 <FormLabel htmlFor="signUpAs">Sign Up As</FormLabel>
//                 <FormControl
//                   as="select"
//                   id="signUpAs"
//                   {...field}
//                   isInvalid={Boolean(fieldState.error?.message)}
//                   // Optionally add styling here if needed
//                   style={{
//                     padding: "8px 10px",
//                     position: "relative",
//                     zIndex: 10,
//                   }}
//                 >
//                   <option value="Notary">{t("options.Notary")}</option>
//                   <option value="Attorney">{t("options.Attorney")}</option>
//                   <option value="Business">{t("options.Business")}</option>
//                   <option value="Real Estate Agent">
//                     {t("options.Real_Estate_Agent")}
//                   </option>
//                 </FormControl>
//                 {fieldState.error?.message && (
//                   <Feedback type="invalid" className="text-danger">
//                     {fieldState.error?.message}
//                   </Feedback>
//                 )}
//               </FormGroup>
//             )}
//           />
//         </div>

//         <div className="mb-3">
//           <Controller
//             name="email"
//             control={control}
//             render={({ field, fieldState }) => (
//               <FormGroup>
//                 <FormLabel htmlFor="email">{t("email")}</FormLabel>
//                 <FormControl
//                   size="sm"
//                   style={{ padding: "10px" }}
//                   id="email"
//                   type="email"
//                   placeholder="example@example.com"
//                   {...field}
//                   isInvalid={Boolean(fieldState.error?.message)}
//                 />
//                 {fieldState.error?.message && (
//                   <Feedback type="invalid" className="text-danger">
//                     {fieldState.error?.message}
//                   </Feedback>
//                 )}
//               </FormGroup>
//             )}
//           />
//         </div>

//         <div className="mb-3">
//           <FormLabel htmlFor="phone">{t("mobile_number")}</FormLabel>
//           <Controller
//             name="phone"
//             control={control}
//             render={({ field, fieldState }) => (
//               <>
//                 <CustomPhoneInput {...field} />
//                 {fieldState.error?.message && (
//                   <p className="text-danger">{fieldState.error?.message}</p>
//                 )}
//               </>
//             )}
//           />
//         </div>

//         <div className="mb-3">
//           <Controller
//             name="password"
//             control={control}
//             render={({ field, fieldState }) => (
//               <FormGroup>
//                 <FormLabel htmlFor="password">{t("password")}</FormLabel>

//                 <div className="position-relative">
//                   <FormControl
//                     size="sm"
//                     style={{ padding: "10px" }}
//                     id="password"
//                     type={showPassword ? "text" : "password"}
//                     {...field}
//                     isInvalid={Boolean(fieldState.error?.message)}
//                   />
//                   {fieldState.error?.message && (
//                     <Feedback type="invalid" className="text-danger">
//                       {fieldState.error?.message}
//                     </Feedback>
//                   )}
//                   <span
//                     className="d-flex position-absolute top-50 end-0 translate-middle-y p-0 pe-2 me-2"
//                     onClick={() => setShowPassword(!showPassword)}
//                   >
//                     {!fieldState.error &&
//                       (showPassword ? (
//                         <FiEye
//                           height={18}
//                           width={18}
//                           className="cursor-pointer"
//                         />
//                       ) : (
//                         <FiEyeOff
//                           height={18}
//                           width={18}
//                           className="cursor-pointer"
//                         />
//                       ))}
//                   </span>
//                 </div>
//               </FormGroup>
//             )}
//           />
//         </div>

//         <div className="mb-3">
//           <Controller
//             name="confirmPassword"
//             control={control}
//             render={({ field, fieldState }) => (
//               <FormGroup>
//                 <FormLabel htmlFor="confirmPassword">
//                   {t("confirm_password")}
//                 </FormLabel>

//                 <div className="position-relative">
//                   <FormControl
//                     size="sm"
//                     style={{ padding: "10px" }}
//                     id="confirmPassword"
//                     type={showConfirmPassword ? "text" : "password"}
//                     {...field}
//                     isInvalid={Boolean(fieldState.error?.message)}
//                   />
//                   {fieldState.error?.message && (
//                     <Feedback type="invalid" className="text-danger">
//                       {fieldState.error?.message}
//                     </Feedback>
//                   )}
//                   <span
//                     className="d-flex position-absolute top-50 end-0 translate-middle-y p-0 pe-2 me-2"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   >
//                     {!fieldState.error &&
//                       (showConfirmPassword ? (
//                         <FiEye
//                           height={18}
//                           width={18}
//                           className="cursor-pointer"
//                         />
//                       ) : (
//                         <FiEyeOff
//                           height={18}
//                           width={18}
//                           className="cursor-pointer"
//                         />
//                       ))}
//                   </span>
//                 </div>
//               </FormGroup>
//             )}
//           />
//         </div>
//         <p>Payment Details</p>

//         <Form.Group controlId="payment_method" className="mb-3">
//           <Form.Label>Payment Method</Form.Label>

//           <Form.Control
//             as="select"
//             {...register("payment_method")}
//             style={{ cursor: "pointer" }}
//           >
//             <option>Credit Card</option>
//             <option>PayPal</option>
//             <option>CashApp</option>
//           </Form.Control>

//           {errors.payment_method && (
//             <Form.Text className="text-danger">
//               {errors.payment_method.message}
//             </Form.Text>
//           )}
//         </Form.Group>

//         <Form.Group controlId="name" className="mb-3">
//           <Form.Label>Name</Form.Label>
//           <Form.Control type="text" {...register("name")} />
//           {errors.name && (
//             <Form.Text className="text-danger">{errors.name.message}</Form.Text>
//           )}
//         </Form.Group>

//         {["Credit Card", "PayPal", "CashApp"].includes(
//           watch("payment_method")
//         ) && (
//             <>
//               {watch("payment_method") === "Credit Card" && (
//                 <>
//                   <Form.Group controlId="card_number" className="mb-3">
//                     <Form.Label>Card Number</Form.Label>
//                     <Form.Control type="text" {...register("card_number")} />
//                     {errors.card_number && (
//                       <Form.Text className="text-danger">
//                         {errors.card_number.message}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                   <Row className="mb-3">
//                     <Col>
//                       <Form.Group controlId="expiry_date">
//                         <Form.Label>Expiry Date</Form.Label>
//                         <Form.Control type="date" {...register("expiry_date")} />
//                         {errors.expiry_date && (
//                           <Form.Text className="text-danger">
//                             {errors.expiry_date.message}
//                           </Form.Text>
//                         )}
//                       </Form.Group>
//                     </Col>
//                     <Col>
//                       <Form.Group controlId="CVV">
//                         <Form.Label>CVV</Form.Label>
//                         <Form.Control type="text" {...register("CVV")} />
//                         {errors.CVV && (
//                           <Form.Text className="text-danger">
//                             {errors.CVV.message}
//                           </Form.Text>
//                         )}
//                       </Form.Group>
//                     </Col>
//                   </Row>
//                 </>
//               )}
//             </>
//           )}

//         <Row className="mb-3 flex-nowrap">
//           <Col className="col-6">
//             <div
//               style={{
//                 border: "1px solid black",
//                 maxWidth: "100%",
//                 height: "auto",
//               }}
//               className="wizard-photo-upload position-relative p-2"
//             >
//               <label
//                 htmlFor="identification_image"
//                 className="text-center rounded"
//                 style={{
//                   fontSize: "10px",
//                   position: identificationFile ? "relative" : "block",
//                 }}
//               >
//                 Upload Identification
//               </label>
//               <input
//                 id="identification_image"
//                 {...register("identification")}
//                 onChange={(e) => readURL(e, "identification")}
//                 type="file"
//                 style={{ display: "none" }}
//               />
//               <div
//                 className="display-img text-center"
//                 style={{
//                   maxWidth: "100%",
//                   height: "auto",
//                 }}
//               >
//                 <img
//                   id="identification"
//                   src={"/assets/v3/img/pf1.png"}
//                   alt="your image"
//                   style={{
//                     maxWidth: "100%",
//                     height: "auto",
//                   }}
//                 />
//               </div>
//             </div>
//             {errors.identification && (
//               <p className="text-danger">{errors.identification.message}</p>
//             )}
//           </Col>
//           <Col className="col-6">
//             <div
//               style={{
//                 border: "1px solid black",
//                 maxWidth: "100%",
//                 height: "auto",
//               }}
//               className="wizard-photo-upload position-relative p-2"
//             >
//               <label
//                 htmlFor="notary_certificate_image"
//                 className="text-center rounded"
//                 style={{
//                   fontSize: "10px",
//                   position: notaryCertificateFile ? "relative" : "block",
//                   marginRight: "10px",

//                 }}
//               >
//                 Upload Certificate of Notary
//               </label>
//               <input
//                 id="notary_certificate_image"
//                 {...register("notary_certificate")}
//                 onChange={(e) => readURL(e, "notary_certificate")}
//                 type="file"
//                 style={{ display: "none" }}
//               />
//               <div
//                 className="display-img text-center"
//                 style={{
//                   maxWidth: "100%",
//                   height: "auto",
//                 }}
//               >
//                 <img
//                   id="notary_certificate"
//                   src={"/assets/v3/img/pf1.png"}
//                   // className="img-fluid"
//                   alt="your image"
//                 />
//               </div>
//             </div>
//             {errors.notary_certificate && (
//               <p className="text-danger">{errors.notary_certificate.message}</p>
//             )}
//           </Col>
//         </Row>

//         <div className="mb-3">
//           <Controller
//             name="termsAgreed"
//             control={control}
//             render={({ field, fieldState }) => (
//               <FormGroup>
//                 <div className="d-flex align-items-center">
//                   <FormCheck
//                     id="termsAgreed"
//                     isInvalid={Boolean(fieldState.error?.message)}
//                     className="me-2 d-flex align-items-center"
//                     {...field}
//                   />
//                   <label htmlFor="termsAgreed" className="form-check-label">
//                     <span>
//                       {t("terms_agreement")}{" "}
//                       <Link
//                         href="/terms"
//                         className="text-decoration-none"
//                         style={{ color: "#0C1134" }}
//                       >
//                         {t("terms_conditions")}
//                       </Link>{" "}
//                       &{" "}
//                       <Link
//                         href="/privacy"
//                         className="text-decoration-none"
//                         style={{ color: "#0C1134" }}
//                       >
//                         {t("privacy_policy")}
//                       </Link>
//                     </span>
//                   </label>
//                 </div>
//                 {fieldState.error?.message && (
//                   <div className="text-danger small">
//                     {fieldState.error.message}
//                   </div>
//                 )}
//               </FormGroup>
//             )}
//           />
//         </div>

//         <div className="text-center d-grid">
//           <Button
//             style={{
//               backgroundColor: "#0C1134",
//             }}
//             type="submit"
//           >
//             {t("sign_up_button")}
//           </Button>
//         </div>
//       </form>
//     </>
//   );
// };
// export default SignUpForm;
