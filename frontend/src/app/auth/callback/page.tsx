"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AuthCallback() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      localStorage.setItem("jwt_token", token);
      router.replace("/dashboard");
    } else {
      router.replace("/?error=1");
    }
  }, [params, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
