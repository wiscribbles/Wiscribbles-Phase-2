import { forwardRef } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";
import "../public/assets/v3/scss/style.scss";
const CustomPhoneInput = forwardRef(({ value, onChange, onBlur }, ref) => (
  <PhoneInput
    country={"us"}
    inputStyle={{
      width: "100%",
      height: "60px",
      paddingTop: "10px",
      paddingBottom: "10px",
      paddingRight: "5px",
      border: "2px solid #B4D4E4",
    }}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    inputProps={{
      ref: ref, // Forward the ref to the input element
    }}
  />
));

export default CustomPhoneInput;
