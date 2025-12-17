# Google Places Seeding Implementation Summary

## Files Created/Modified

### 1. New Files Created

#### `src/jobs/seed-google-places.ts`
- Main seeding script that fetches dentist data from Google Places API
- Handles pagination, deduplication, and rate limiting
- Transforms Google Places data into standardized format
- Outputs both JSON and CSV files

#### `src/lib/csv.ts`
- Simple CSV writer utility without external dependencies
- Handles proper escaping of CSV values
- Supports array fields (like hours)

#### `SEED_GOOGLE_PLACES.md`
- Documentation for using the seeding script
- Setup instructions and troubleshooting

### 2. Modified Files

#### `package.json`
- Added `tsx` as dev dependency (for running TypeScript files directly)
- Added script: `"seed:dentists:google": "tsx src/jobs/seed-google-places.ts"`

## Implementation Details

### API Usage
- Uses **Places Text Search API** for initial search
- Uses **Place Details API** for full information
- Respects Google's pagination requirements (2-second delay for next_page_token)
- Includes retry logic for transient failures

### Data Processing
- Deduplicates by `place_id`
- Parses addresses into city/state/zip components
- Handles missing/optional fields gracefully
- Targets 20 unique dentists per city

### Output Format
- **JSON**: Pretty-printed array of dentist objects
- **CSV**: Properly escaped CSV with all fields
- Both formats include the same data structure

## Usage Instructions (Windows PowerShell)

### Step 1: Install Dependencies
```powershell
pnpm install
```

### Step 2: Set API Key
```powershell
$env:GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"
```

Or add to `.env` file:
```
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### Step 3: Run the Script
```powershell
pnpm seed:dentists:google
```

### Step 4: Verify Output
Check the following files are created:
- `data/seed/palm-bay-dentists.json`
- `data/seed/palm-bay-dentists.csv`
- `data/seed/melbourne-dentists.json`
- `data/seed/melbourne-dentists.csv`

## Output Data Structure

Each dentist entry contains:
```typescript
{
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  google_maps_url: string;
  google_rating: number | null;
  google_review_count: number | null;
  place_id: string;
  latitude: number | null;
  longitude: number | null;
  hours: string[];
  source: "google_places";
}
```

## Features

✅ Official Google Places API (no scraping)  
✅ Pagination support to get more results  
✅ Deduplication by place_id  
✅ Rate limiting and retry logic  
✅ Address parsing (city/state/zip)  
✅ JSON and CSV output formats  
✅ Proper error handling  
✅ Progress logging  
✅ Windows PowerShell compatible  

## Notes

- The script will log warnings if fewer than 20 results are found
- API calls include delays to respect rate limits
- The script stops after 5 pages to avoid excessive API usage
- All data is sourced from Google Places API (source = "google_places")

