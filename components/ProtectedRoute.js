// components/ProtectedRoute.js
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";


export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  const router            = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return <div>Loading...</div>;
  return <>{children}</>;
}
