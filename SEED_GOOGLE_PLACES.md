# Google Places Dentist Seeding

This script fetches dentist listings from Google Places API for Palm Bay, FL and Melbourne, FL.

## Prerequisites

1. **Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Places API
     - Places API (New)
   - Create credentials (API Key)
   - Restrict the API key to the Places API for security

2. **Install Dependencies**
   ```powershell
   pnpm install
   ```

## Setup

1. **Set Environment Variable**
   
   In PowerShell:
   ```powershell
   $env:GOOGLE_MAPS_API_KEY="your-api-key-here"
   ```
   
   Or create/update `.env` file:
   ```
   GOOGLE_MAPS_API_KEY=your-api-key-here
   ```

2. **Run the Script**
   ```powershell
   pnpm seed:dentists:google
   ```

## Output

The script generates 4 files in `data/seed/`:

- `palm-bay-dentists.json` - JSON array of up to 20 dentists
- `palm-bay-dentists.csv` - CSV format of the same data
- `melbourne-dentists.json` - JSON array of up to 20 dentists
- `melbourne-dentists.csv` - CSV format of the same data

## Data Fields

Each dentist entry includes:
- `name` - Business name
- `address` - Street address
- `city` - City name
- `state` - State abbreviation (FL)
- `zip` - ZIP code
- `phone` - Formatted phone number
- `website` - Website URL (if available)
- `google_maps_url` - Google Maps link
- `google_rating` - Rating (0-5)
- `google_review_count` - Number of reviews
- `place_id` - Google Places ID (unique identifier)
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate
- `hours` - Array of opening hours (weekday_text)
- `source` - Always "google_places"

## Rate Limiting

The script includes:
- Automatic retry logic for transient failures
- Delays between API calls to respect rate limits
- 2-second delay for pagination tokens (Google requirement)

## Notes

- The script targets 20 unique dentists per city
- Deduplication is done by `place_id`
- If fewer than 20 results are available, a warning is logged
- The script will stop after 5 pages to avoid excessive API usage

## Troubleshooting

**Error: "GOOGLE_MAPS_API_KEY environment variable is not set"**
- Make sure you've set the environment variable in PowerShell or `.env` file

**Error: "REQUEST_DENIED" or "INVALID_REQUEST"**
- Check that Places API is enabled in Google Cloud Console
- Verify your API key is correct
- Check API key restrictions

**Fewer than 20 results**
- This is normal if there aren't enough dentists in the area
- The script will log a warning and continue

