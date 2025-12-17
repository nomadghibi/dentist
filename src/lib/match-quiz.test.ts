import { describe, it, expect } from "vitest";
import { matchDentists } from "./match-quiz";
import type { MatchQuizAnswers } from "./validators/match";

describe("Match Quiz", () => {
  const mockDentists = [
    {
      id: "1",
      name: "Emergency Dental",
      slug: "emergency-dental",
      citySlug: "palm-bay",
      cityName: "Palm Bay",
      state: "FL",
      address: "123 Main St",
      phone: "321-555-0100",
      servicesFlags: { emergency: true },
      availabilityFlags: { emergency_today: true, same_week: true },
      acceptingNewPatients: true,
      verifiedStatus: "verified" as const,
      badges: {},
      insurances: ["Blue Cross"],
      languages: ["English"],
      completenessScore: 80,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      name: "Pediatric Dental",
      slug: "pediatric-dental",
      citySlug: "palm-bay",
      cityName: "Palm Bay",
      state: "FL",
      address: "456 Oak Ave",
      phone: "321-555-0200",
      servicesFlags: { pediatric: true },
      availabilityFlags: { weekend: true },
      acceptingNewPatients: true,
      verifiedStatus: "verified" as const,
      badges: { pediatric_friendly: true },
      insurances: ["Delta Dental"],
      languages: ["English", "Spanish"],
      completenessScore: 75,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("matches emergency dentists for emergency requests", () => {
    const answers: MatchQuizAnswers = {
      city: "palm-bay",
      urgency: "emergency",
      adult_or_child: "adult",
      anxiety_level: "none",
      weekend_need: false,
    };

    const results = matchDentists(mockDentists, answers);
    expect(results.length).toBeGreaterThan(0);
    const emergencyMatch = results.find((r) => r.dentist.id === "1");
    expect(emergencyMatch).toBeDefined();
    expect(emergencyMatch?.reasons.some((r) => r.code === "emergency_service")).toBe(true);
  });

  it("matches pediatric dentists for child requests", () => {
    const answers: MatchQuizAnswers = {
      city: "palm-bay",
      urgency: "flexible",
      adult_or_child: "child",
      anxiety_level: "none",
      weekend_need: false,
    };

    const results = matchDentists(mockDentists, answers);
    expect(results.length).toBeGreaterThan(0);
    const pediatricMatch = results.find((r) => r.dentist.id === "2");
    expect(pediatricMatch).toBeDefined();
    expect(pediatricMatch?.reasons.some((r) => r.code === "pediatric_service")).toBe(true);
  });

  it("matches weekend-available dentists for weekend requests", () => {
    const answers: MatchQuizAnswers = {
      city: "palm-bay",
      urgency: "flexible",
      adult_or_child: "adult",
      anxiety_level: "none",
      weekend_need: true,
    };

    const results = matchDentists(mockDentists, answers);
    const weekendMatch = results.find((r) => r.dentist.id === "2");
    expect(weekendMatch?.reasons.some((r) => r.code === "weekend_available")).toBe(true);
  });

  it("returns top 3 matches", () => {
    const answers: MatchQuizAnswers = {
      city: "palm-bay",
      urgency: "flexible",
      adult_or_child: "adult",
      anxiety_level: "none",
      weekend_need: false,
    };

    const results = matchDentists(mockDentists, answers);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("sorts matches by score descending", () => {
    const answers: MatchQuizAnswers = {
      city: "palm-bay",
      urgency: "emergency",
      adult_or_child: "adult",
      anxiety_level: "none",
      weekend_need: false,
    };

    const results = matchDentists(mockDentists, answers);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});

