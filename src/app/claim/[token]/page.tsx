"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ClaimCompletePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [dentistName, setDentistName] = useState("");

  useEffect(() => {
    // Verify token is valid
    if (token) {
      fetch(`/api/claim/verify?token=${token}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid && data.dentist) {
            setDentistName(data.dentist.name);
            setStatus("idle");
          } else {
            setStatus("error");
            setErrorMessage("Invalid or expired claim token.");
          }
        })
        .catch(() => {
          setStatus("error");
          setErrorMessage("Failed to verify token.");
        });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setStatus("error");
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/claim/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete claim");
      }

      setStatus("success");
      setTimeout(() => {
        router.push("/dentist/dashboard");
      }, 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Verifying claim token...</div>
      </div>
    );
  }

  if (status === "error" && !dentistName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm">
          <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">{errorMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Claim</h2>
          <p className="mt-2 text-sm text-gray-600">
            Set a password to claim your profile: <strong>{dentistName}</strong>
          </p>
        </div>

        {status === "success" ? (
          <div className="p-3 bg-green-50 text-green-800 rounded-md text-sm">
            Profile claimed successfully! Redirecting to dashboard...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                id="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                required
                minLength={8}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {status === "error" && (
              <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">{errorMessage}</div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Claiming..." : "Claim Profile"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

