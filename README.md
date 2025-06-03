# Elynor Tours

This project provides car rental and hotel booking features for Elynor Tours.
It uses React with Vite for development and includes a partial migration to Next.js
for server-side rendering and SEO improvements.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the required keys.
3. Start the development server:
   ```bash
   npm run dev
   ```

The project expects the following environment variables:

- `VITE_HUBSPOT_API_KEY` – API key used for HubSpot requests.
- `VITE_GOOGLE_MAPS_API_KEY` – Google Maps API key used for map and autocomplete features.

## Building

To build the project for production run:
```bash
npm run build
```

## Notes

Additional setup commands used during development can be found in `setup-notes.sh`.
