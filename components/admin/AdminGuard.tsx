"use client";
// src/components/admin/AdminGuard.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== "ADMIN") {
      router.replace("/");
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, role]);

  if (checking) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-encre-muted" />
      </div>
    );
  }

  return <>{children}</>;
}
