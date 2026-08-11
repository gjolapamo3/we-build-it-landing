# we-build-it-landing

Official landing page and technical services portal for We Build-IT LLC.

## Environment

Create a local `.env` file from `.env.example` and set:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
# Legacy projects may still use VITE_SUPABASE_ANON_KEY instead.
SUPABASE_SERVICE_ROLE_KEY=
```

Set `VITE_SUPABASE_URL` and either `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` in Render for production.
Keep `SUPABASE_SERVICE_ROLE_KEY` out of the frontend runtime. It is only for local/admin sync scripts or a trusted CI job.

## Supabase setup

Run the SQL in `supabase-schema.sql` inside the Supabase SQL Editor. It creates:

- `public.inquiries` for lead submissions
- `public.site_content` for editable landing-page copy
- `public.service_capabilities` for the capability cards
- `public.engagement_models` for the engagement cards

The script also enables row-level security and adds anon policies for frontend inserts and reads.

## Content sync workflow

Edit the structured content in `content/landing-content.json`, then sync it to Supabase with:

```bash
npm run supabase:content:sync
```

To validate the JSON model without touching Supabase:

```bash
npm run supabase:content:sync -- --dry-run
```

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```
