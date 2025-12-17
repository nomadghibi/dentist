"use client";

import { useEffect } from "react";

interface ProfileViewTrackerProps {
  dentistId: string;
}

export default function ProfileViewTracker({ dentistId }: ProfileViewTrackerProps) {
  useEffect(() => {
    if (dentistId) {
      // Track profile view
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dentistId,
          type: "profile_view",
        }),
      }).catch(() => {
        // Silent fail - don't break page if tracking fails
      });
    }
  }, [dentistId]);

  return null; // This component doesn't render anything
}

