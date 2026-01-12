// app/ClientProviders.js
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function ClientProviders({ children }) {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return <>{children}</>;
}
