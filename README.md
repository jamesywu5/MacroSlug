# MacroSlug

UCSC Dining Hall Nutrition & Macro Tracker

Menu data is collected from the UCSC dining hall website, stored in Supabase, and served to the mobile app through the API.

```mermaid
flowchart LR
  diningSite["UCSC dining hall website"] --> scraper["Python web scraper"]
  scraper --> supabase["Supabase"]
  supabase --> api["Node.js Express TypeScript"]
  api --> app["React Native Expo"]
```

The scraper reads the public dining hall pages and writes menu and nutrition data into Supabase. The Express API in `apps/api` reads that data and exposes it over HTTP. The Expo app is the client that calls the API.

## Run the backend API

From the repository root:

```bash
cd apps/api
npm install
npm run dev
```

`npm run dev` starts the API with `tsx watch src/index.ts` and restarts it when files change. The server listens on port 3000, or on the port in the `PORT` environment variable. A healthy process responds to `GET http://localhost:3000/api/health` with `{ "status": "ok" }`.
