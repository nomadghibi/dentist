import { Metadata } from "next";

export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  path?: string;
  noindex?: boolean;
}

const SITE_NAME = "Dentist Finder";
const DEFAULT_DESCRIPTION = "Find trusted dentists in Florida. Compare services, read reviews, and book appointments.";

export function buildCanonical(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dentistfinder.com";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function buildMetadata(config: SEOConfig): Metadata {
  const canonical = config.canonical || (config.path ? buildCanonical(config.path) : buildCanonical("/"));
  
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

export function buildBreadcrumbJsonLd(crumbs: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: buildCanonical(crumb.path),
    })),
  };
}

export function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildLocalBusinessJsonLd(business: {
  name: string;
  description?: string;
  url?: string;
  phone?: string | null;
  address?: {
    street?: string | null;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  serviceArea?: string;
  sameAs?: string[];
  image?: string;
  priceRange?: string;
}): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Dentist"],
    name: business.name,
    ...(business.description && { description: business.description }),
    ...(business.url && { url: business.url }),
    ...(business.phone && { telephone: business.phone }),
    ...(business.priceRange && { priceRange: business.priceRange }),
    ...(business.image && { image: business.image }),
  };

  if (business.address) {
    jsonLd.address = {
      "@type": "PostalAddress",
      ...(business.address.street && { streetAddress: business.address.street }),
      ...(business.address.city && { addressLocality: business.address.city }),
      ...(business.address.region && { addressRegion: business.address.region }),
      ...(business.address.postalCode && { postalCode: business.address.postalCode }),
      addressCountry: business.address.country || "US",
    };
  }

  if (business.serviceArea) {
    jsonLd.areaServed = {
      "@type": "AdministrativeArea",
      name: business.serviceArea,
    };
  }

  if (business.sameAs && business.sameAs.length > 0) {
    jsonLd.sameAs = business.sameAs;
  }

  return jsonLd;
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
  hours?: Record<string, { open: string; close: string } | null> | null;
  insurances?: string[] | null;
  servicesFlags?: Record<string, boolean | undefined> | null;
  acceptingNewPatients?: boolean | null;
  slug?: string;
  citySlug?: string;
}): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Dentist"],
    ...(dentist.slug && dentist.citySlug && {
      "@id": `${buildCanonical(`/fl/${dentist.citySlug}/dentists/${dentist.slug}`)}#practice`,
      url: buildCanonical(`/fl/${dentist.citySlug}/dentists/${dentist.slug}`),
    }),
    name: dentist.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: dentist.cityName,
      addressRegion: dentist.state,
      addressCountry: "US",
      ...(dentist.address && { streetAddress: dentist.address }),
    },
    ...(dentist.phone && { telephone: dentist.phone }),
    ...(dentist.website && { sameAs: [dentist.website] }),
  };

  if (dentist.lat && dentist.lng) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: dentist.lat,
      longitude: dentist.lng,
    };
  }

  if (dentist.hours && Object.keys(dentist.hours).length > 0) {
    const dayMap: Record<string, string> = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday",
    };

    jsonLd.openingHoursSpecification = Object.entries(dentist.hours).map(([day, window]) => {
      const spec: Record<string, unknown> = {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: dayMap[day.toLowerCase()] || day,
      };

      if (window) {
        spec.opens = window.open;
        spec.closes = window.close;
      } else {
        spec.opens = "00:00";
        spec.closes = "00:00";
      }

      return spec;
    });
  }

  if (dentist.insurances && dentist.insurances.length > 0) {
    jsonLd.acceptsInsurance = dentist.insurances;
  }

  if (dentist.servicesFlags && Object.keys(dentist.servicesFlags).length > 0) {
    const availableServices = Object.entries(dentist.servicesFlags)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
    jsonLd.availableService = availableServices;
  }

  if (dentist.acceptingNewPatients !== undefined && dentist.acceptingNewPatients !== null) {
    jsonLd.isAcceptingNewPatients = dentist.acceptingNewPatients;
  }

  return jsonLd;
}
