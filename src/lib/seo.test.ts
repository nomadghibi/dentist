import { describe, it, expect } from "vitest";
import {
  buildCanonical,
  buildCityHubMetadata,
  buildServicePageMetadata,
  buildDentistProfileMetadata,
  buildDentistJsonLd,
} from "./seo";

describe("buildCanonical", () => {
  it("should build canonical URL with base URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    const canonical = buildCanonical("/fl/palm-bay/dentists");
    expect(canonical).toBe("https://example.com/fl/palm-bay/dentists");
  });

  it("should use default URL if env not set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const canonical = buildCanonical("/test");
    expect(canonical).toBe("https://dentistfinder.com/test");
  });
});

describe("buildCityHubMetadata", () => {
  it("should generate correct metadata", () => {
    const metadata = buildCityHubMetadata("Palm Bay", "palm-bay");
    expect(metadata.title).toContain("Palm Bay");
    expect(metadata.description).toContain("Palm Bay");
  });
});

describe("buildServicePageMetadata", () => {
  it("should generate correct service metadata", () => {
    const metadata = buildServicePageMetadata(
      "Palm Bay",
      "palm-bay",
      "Emergency Dentist",
      "emergency-dentist"
    );
    expect(metadata.title).toContain("Emergency Dentist");
    expect(metadata.title).toContain("Palm Bay");
  });
});

describe("buildDentistProfileMetadata", () => {
  it("should generate correct profile metadata", () => {
    const metadata = buildDentistProfileMetadata(
      "Dr. Smith",
      "Palm Bay",
      "palm-bay",
      "dr-smith"
    );
    expect(metadata.title).toContain("Dr. Smith");
    expect(metadata.title).toContain("Palm Bay");
  });
});

describe("buildDentistJsonLd", () => {
  it("should generate valid JSON-LD", () => {
    const jsonLd = buildDentistJsonLd({
      name: "Dr. Smith",
      address: "123 Main St",
      phone: "555-1234",
      website: "https://example.com",
      cityName: "Palm Bay",
      state: "FL",
      lat: "28.0",
      lng: "-80.0",
    });

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("Dentist");
    expect(jsonLd.name).toBe("Dr. Smith");
    expect(jsonLd.geo).toBeDefined();
  });

  it("should handle missing optional fields", () => {
    const jsonLd = buildDentistJsonLd({
      name: "Dr. Smith",
      cityName: "Palm Bay",
      state: "FL",
    });

    expect(jsonLd.name).toBe("Dr. Smith");
    expect(jsonLd.telephone).toBeUndefined();
    expect(jsonLd.url).toBeUndefined();
  });
});

