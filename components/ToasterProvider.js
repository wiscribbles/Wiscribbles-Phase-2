// components/ToasterProvider.js
"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        success: { duration: 3000 },
        error: { duration: 5000 },
      }}
    />
  );
}
