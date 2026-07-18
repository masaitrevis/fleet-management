"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DriverDocumentsRedirect() {
  const router = useRouter();
  useEffect(() => { router.push("/dashboard/drivers"); }, [router]);
  return <div className="p-8 text-center">Redirecting...</div>;
}
