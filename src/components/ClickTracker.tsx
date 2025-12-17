"use client";

interface ClickTrackerProps {
  dentistId: string;
  eventType: "call_click" | "website_click";
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export default function ClickTracker({
  dentistId,
  eventType,
  children,
  className,
  href,
}: ClickTrackerProps) {
  const handleClick = () => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dentistId,
        type: eventType,
      }),
    }).catch(() => {
      // Silent fail
    });
  };

  if (href) {
    return (
      <a href={href} onClick={handleClick} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <div onClick={handleClick} className={className} style={{ cursor: "pointer" }}>
      {children}
    </div>
  );
}

