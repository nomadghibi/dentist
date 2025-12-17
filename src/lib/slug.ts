export function generateSlug(name: string, npi?: string | null): string {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // Add NPI suffix if provided for uniqueness
  if (npi && slug) {
    slug = `${slug}-${npi.slice(-4)}`;
  }

  return slug || "dentist";
}

export function validateCitySlug(slug: string): boolean {
  const validCities = ["palm-bay", "melbourne", "space-coast"];
  return validCities.includes(slug);
}

export function validateServiceSlug(slug: string): boolean {
  const validServices = ["emergency-dentist", "pediatric-dentist", "invisalign"];
  return validServices.includes(slug);
}

