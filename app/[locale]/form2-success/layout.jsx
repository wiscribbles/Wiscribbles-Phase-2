"use client";
import "../../../public/assets/v1/css/animate.min.css"
import "../../../public/assets/v1/css/bootstrap-datepicker.css";
import "../../../public/assets/v1/css/bootstrap.min.css";
import "../../../public/assets/v1/css/fontawesome-all.css";

// v3
import "../../../public/assets/v3/scss/style.scss";

import { useEffect } from "react";

function FormLayout({ children }) {
  useEffect(() => {
    require("../../../public/assets/v1/js/jquery-3.3.1.min.js");
    require("../../../public/assets/v1/js/jquery.validate.min.js");
    require("../../../public/assets/v1/js/bootstrap-datepicker.min.js");
    // import("../../../public/assets/v1/js/main.js");

    // v3
    require("../../../public/assets/v3/js/main.js");
  }, []);

  return children;
}

export default FormLayout;
