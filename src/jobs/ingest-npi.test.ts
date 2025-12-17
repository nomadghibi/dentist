import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeProvider } from "./ingest-npi";

// Mock fetch
global.fetch = vi.fn();

describe("normalizeProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should normalize organization name", () => {
    const provider = {
      NPI: "1234567890",
      organizationName: "Smith Dental",
      location: {
        city: "Palm Bay",
        state: "FL",
      },
      taxonomy: [],
    };

    const normalized = normalizeProvider(provider, "palm-bay");
    expect(normalized.name).toBe("Smith Dental");
    expect(normalized.citySlug).toBe("palm-bay");
    expect(normalized.cityName).toBe("Palm Bay");
  });

  it("should normalize individual name", () => {
    const provider = {
      NPI: "1234567890",
      firstName: "John",
      lastName: "Smith",
      location: {
        city: "Melbourne",
        state: "FL",
      },
      taxonomy: [],
    };

    const normalized = normalizeProvider(provider, "melbourne");
    expect(normalized.name).toBe("John Smith");
  });

  it("should generate slug with NPI suffix", () => {
    const provider = {
      NPI: "1234567890",
      organizationName: "Test Dental",
      location: {
        city: "Orlando",
        state: "FL",
      },
      taxonomy: [],
    };

    const normalized = normalizeProvider(provider, "orlando");
    expect(normalized.slug).toContain("test-dental");
    expect(normalized.slug).toContain("7890");
  });

  it("should extract services from taxonomy", () => {
    const provider = {
      NPI: "1234567890",
      organizationName: "Pediatric Dental",
      location: {
        city: "Palm Bay",
        state: "FL",
      },
      taxonomy: [
        {
          code: "1223P0221X",
          desc: "Pediatric Dentistry",
          primary: true,
        },
      ],
    };

    const normalized = normalizeProvider(provider, "palm-bay");
    expect(normalized.servicesFlags.pediatric).toBe(true);
  });

  it("should handle missing location data", () => {
    const provider = {
      NPI: "1234567890",
      organizationName: "Test",
      taxonomy: [],
    };

    const normalized = normalizeProvider(provider, "palm-bay");
    expect(normalized.address).toBeNull();
    expect(normalized.phone).toBeNull();
  });
});

