"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VehicleDocumentsRedirect() {
  const router = useRouter();
  useEffect(() => { router.push("/dashboard/vehicles"); }, [router]);
  return <div className="p-8 text-center">Redirecting...</div>;
}
