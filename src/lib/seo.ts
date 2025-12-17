import { Metadata } from "next";

export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = "Dentist Finder";
const DEFAULT_DESCRIPTION = "Find trusted dentists in Florida. Compare services, read reviews, and book appointments.";

export function buildCanonical(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dentistfinder.com";
  return `${baseUrl}${path}`;
}

export function buildMetadata(config: SEOConfig): Metadata {
  const canonical = config.canonical || buildCanonical("");
  
  return {
    title: `${config.title} | ${SITE_NAME}`,
    description: config.description || DEFAULT_DESCRIPTION,
    alternates: {
      canonical,
    },
    robots: {
      index: !config.noindex,
      follow: !config.noindex,
    },
    openGraph: {
      title: config.title,
      description: config.description || DEFAULT_DESCRIPTION,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export function buildCityHubMetadata(cityName: string, citySlug: string): Metadata {
  return buildMetadata({
    title: `Best Dentists in ${cityName}, FL`,
    description: `Find the best dentists in ${cityName}, Florida. Compare services, insurance accepted, and verified practices. Book your appointment today.`,
    canonical: buildCanonical(`/fl/${citySlug}/dentists`),
  });
}

export function buildServicePageMetadata(
  cityName: string,
  citySlug: string,
  serviceName: string,
  serviceSlug: string
): Metadata {
  const serviceDisplayNames: Record<string, string> = {
    "emergency-dentist": "Emergency Dentist",
    "pediatric-dentist": "Pediatric Dentist",
    "invisalign": "Invisalign",
  };

  const displayName = serviceDisplayNames[serviceSlug] || serviceName;

  return buildMetadata({
    title: `${displayName} in ${cityName}, FL`,
    description: `Find the best ${displayName.toLowerCase()} services in ${cityName}, Florida. Compare verified practices, read reviews, and book appointments.`,
    canonical: buildCanonical(`/fl/${citySlug}/${serviceSlug}`),
  });
}

export function buildDentistProfileMetadata(
  dentistName: string,
  cityName: string,
  citySlug: string,
  slug: string
): Metadata {
  return buildMetadata({
    title: `${dentistName} - Dentist in ${cityName}, FL`,
    description: `Learn more about ${dentistName} in ${cityName}, Florida. View services, insurance accepted, hours, and contact information.`,
    canonical: buildCanonical(`/fl/${citySlug}/dentists/${slug}`),
  });
}

export function buildDentistJsonLd(dentist: {
  name: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  cityName: string;
  state: string;
  lat?: string | null;
  lng?: string | null;
}): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: dentist.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: dentist.cityName,
      addressRegion: dentist.state,
      addressCountry: "US",
      ...(dentist.address && { streetAddress: dentist.address }),
    },
    ...(dentist.phone && { telephone: dentist.phone }),
    ...(dentist.website && { url: dentist.website }),
  };

  if (dentist.lat && dentist.lng) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: dentist.lat,
      longitude: dentist.lng,
    };
  }

  return jsonLd;
}

