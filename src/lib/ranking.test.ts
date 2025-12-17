import { describe, it, expect } from "vitest";
import {
  computeCompletenessScore,
  organicScore,
  sortDentists,
  injectFeatured,
  type Dentist,
} from "./ranking";

const createMockDentist = (overrides: Partial<Dentist> = {}): Dentist => ({
  id: "1",
  npi: "1234567890",
  slug: "test-dentist",
  name: "Test Dentist",
  citySlug: "palm-bay",
  cityName: "Palm Bay",
  state: "FL",
  address: null,
  phone: null,
  website: null,
  taxonomy: null,
  lat: null,
  lng: null,
  servicesFlags: null,
  insurances: null,
  languages: null,
  hours: null,
  completenessScore: 0,
  verifiedStatus: "unverified",
  verifiedAt: null,
  verifiedByAdminId: null,
  verificationSource: null,
  updatedAt: new Date(),
  createdAt: new Date(),
  ...overrides,
});

describe("computeCompletenessScore", () => {
  it("should return 0 for empty dentist", () => {
    const dentist = createMockDentist();
    expect(computeCompletenessScore(dentist)).toBe(0);
  });

  it("should score basic info correctly", () => {
    const dentist = createMockDentist({
      name: "Dr. Smith",
      address: "123 Main St",
      phone: "555-1234",
    });
    const score = computeCompletenessScore(dentist);
    expect(score).toBe(30);
  });

  it("should score verified status", () => {
    const dentist = createMockDentist({
      verifiedStatus: "verified",
    });
    const score = computeCompletenessScore(dentist);
    expect(score).toBe(10);
  });

  it("should cap at 100", () => {
    const dentist = createMockDentist({
      name: "Dr. Smith",
      address: "123 Main St",
      phone: "555-1234",
      website: "https://example.com",
      hours: { monday: { open: "9:00", close: "17:00" } },
      servicesFlags: { emergency: true, pediatric: true },
      insurances: ["Aetna", "Blue Cross"],
      languages: ["English", "Spanish"],
      verifiedStatus: "verified",
    });
    const score = computeCompletenessScore(dentist);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("organicScore", () => {
  it("should prioritize verified dentists", () => {
    const verified = createMockDentist({ verifiedStatus: "verified", completenessScore: 50 });
    const unverified = createMockDentist({ verifiedStatus: "unverified", completenessScore: 50 });

    const verifiedScore = organicScore(verified);
    const unverifiedScore = organicScore(unverified);

    expect(verifiedScore).toBeGreaterThan(unverifiedScore);
  });

  it("should add service match bonus", () => {
    const withService = createMockDentist({
      servicesFlags: { emergency: true },
      completenessScore: 50,
    });
    const withoutService = createMockDentist({
      servicesFlags: {},
      completenessScore: 50,
    });

    const withScore = organicScore(withService, { service: "emergency-dentist" });
    const withoutScore = organicScore(withoutService, { service: "emergency-dentist" });

    expect(withScore).toBeGreaterThan(withoutScore);
  });
});

describe("sortDentists", () => {
  it("should sort by organic score descending", () => {
    const highScore = createMockDentist({ completenessScore: 80, verifiedStatus: "verified" });
    const lowScore = createMockDentist({ completenessScore: 30, verifiedStatus: "unverified" });

    const sorted = sortDentists([lowScore, highScore]);
    expect(sorted[0].id).toBe(highScore.id);
  });

  it("should use tie-breakers correctly", () => {
    const verified = createMockDentist({
      completenessScore: 50,
      verifiedStatus: "verified",
      name: "B Dentist",
    });
    const unverified = createMockDentist({
      completenessScore: 50,
      verifiedStatus: "unverified",
      name: "A Dentist",
    });

    const sorted = sortDentists([unverified, verified]);
    expect(sorted[0].id).toBe(verified.id); // Verified first
  });
});

describe("injectFeatured", () => {
  it("should inject featured at specified positions", () => {
    const organic1 = createMockDentist({ id: "1", name: "Organic 1" });
    const organic2 = createMockDentist({ id: "2", name: "Organic 2" });
    const organic3 = createMockDentist({ id: "3", name: "Organic 3" });
    const featured = createMockDentist({ id: "4", name: "Featured" });

    const result = injectFeatured(
      [organic1, organic2, organic3],
      [featured],
      { maxFeatured: 1, positions: [1] }
    );

    expect(result[0].id).toBe("4");
    expect(result[0].isSponsored).toBe(true);
  });

  it("should not exceed maxFeatured", () => {
    const organic = createMockDentist({ id: "1" });
    const featured1 = createMockDentist({ id: "2" });
    const featured2 = createMockDentist({ id: "3" });

    const result = injectFeatured(
      [organic],
      [featured1, featured2],
      { maxFeatured: 1, positions: [1, 2] }
    );

    const featuredCount = result.filter((d) => d.isSponsored).length;
    expect(featuredCount).toBe(1);
  });

  it("should mark featured as sponsored", () => {
    const featured = createMockDentist({ id: "1" });
    const result = injectFeatured([], [featured], { maxFeatured: 1, positions: [1] });

    expect(result[0].isSponsored).toBe(true);
  });
});

