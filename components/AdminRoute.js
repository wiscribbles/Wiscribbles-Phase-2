// components/AdminRoute.js
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (user.role !== "admin") router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user) return <div>Loading...</div>;
  if (user.role !== "admin") return <div>Not authorized</div>;
  return <>{children}</>;
}
