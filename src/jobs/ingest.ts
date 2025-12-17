/**
 * NPPES Ingestion Job
 * Wraps existing ingest-npi.ts logic for scheduled execution
 */

import { validateCitySlug } from "@/lib/slug";
import { ingestNPIForCity } from "./ingest-npi";

/**
 * Run ingestion job for a city
 * The ingestNPIForCity function already handles ingestion_runs table
 */
export async function runIngestJob(citySlug: string): Promise<{
  inserted: number;
  updated: number;
  errors: Array<{ message: string; npi?: string }>;
}> {
  if (!validateCitySlug(citySlug)) {
    throw new Error(`Invalid city slug: ${citySlug}`);
  }

  // Call the existing ingestion function
  // It already handles ingestion_runs table internally
  return await ingestNPIForCity(citySlug);
}

