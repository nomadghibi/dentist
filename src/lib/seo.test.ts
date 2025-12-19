import { describe, it, expect } from "vitest";
import {
  buildCanonical,
  buildCityHubMetadata,
  buildServicePageMetadata,
  buildDentistProfileMetadata,
  buildDentistJsonLd,
  buildFaqJsonLd,
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
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
    expect(jsonLd["@type"]).toContain("Dentist");
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

describe("structured data helpers", () => {
  it("builds FAQ JSON-LD", () => {
    const faq = buildFaqJsonLd([
      { question: "How do I book?", answer: "Use the request button on a profile." },
      { question: "Is it free?", answer: "Patient browsing is free." },
    ]);

    expect(faq["@type"]).toBe("FAQPage");
    expect(Array.isArray((faq as any).mainEntity)).toBe(true);
    expect((faq as any).mainEntity[0].name).toContain("How do I book");
  });

  it("builds breadcrumbs JSON-LD", () => {
    const breadcrumbs = buildBreadcrumbJsonLd([
      { name: "Florida", path: "/fl" },
      { name: "Palm Bay Dentists", path: "/fl/palm-bay/dentists" },
    ]);

    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect((breadcrumbs as any).itemListElement[1].item).toContain("/fl/palm-bay/dentists");
  });

  it("builds LocalBusiness JSON-LD", () => {
    const jsonLd = buildLocalBusinessJsonLd({
      name: "Dentist Finder",
      serviceArea: "Florida",
      url: "https://dentistfinder.com",
      phone: "555-1234",
    });

    expect(jsonLd["@type"]).toContain("LocalBusiness");
    expect((jsonLd as any).areaServed.name).toBe("Florida");
  });
});
