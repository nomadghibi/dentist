"use client";

import { useState } from "react";

interface VerifyButtonProps {
  dentistId: string;
  currentStatus: "unverified" | "pending" | "verified";
}

export default function VerifyButton({ dentistId, currentStatus }: VerifyButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleVerify = async (verified: boolean) => {
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dentistId,
          verified,
          verificationSource: "manual",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update verification");
      }

      setStatus("success");
      window.location.reload();
    } catch (error) {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {currentStatus !== "verified" ? (
        <button
          onClick={() => handleVerify(true)}
          disabled={isSubmitting}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? "Verifying..." : "Verify Dentist"}
        </button>
      ) : (
        <button
          onClick={() => handleVerify(false)}
          disabled={isSubmitting}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {isSubmitting ? "Unverifying..." : "Unverify Dentist"}
        </button>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">Failed to update verification status.</p>
      )}
    </div>
  );
}

