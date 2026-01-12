"use client";
import { LayoutProvider } from "@/context/useLayoutContext";
import VerticalLayout from "@/layout/VerticalLayout";
import React from "react";

import "../../../public/assets/scss/Default.scss";
import "../../../public/assets/scss/Icons.scss";

function layout({ children }) {
  return (
    <LayoutProvider>
      <VerticalLayout>{children}</VerticalLayout>
    </LayoutProvider>
  );
}

export default layout;
