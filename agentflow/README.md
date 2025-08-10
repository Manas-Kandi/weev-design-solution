# Weev

Weev is a visual AI agent design platform that lets you connect and orchestrate nodes to build AI workflows. It is built with Next.js and Supabase to provide a fast, interactive design experience.

## Prerequisites

- Node.js 18+
- npm (or another Node package manager)

## Run

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Build and run in production:

```bash
npm run build
npm start
```

## Environment Variables

The application relies on the following environment variables (e.g. in `.env.local`):

- `NEXT_PUBLIC_GEMINI_API_KEY` – API key for Google Gemini.
- `SUPABASE_SERVICE_ROLE_KEY` – service role key for Supabase access.
- `NVIDIA_API_KEY` – key for NVIDIA AI endpoints.

## Architecture

For details about node contracts and data flow, see [docs/DataFlowContract.md](docs/DataFlowContract.md).
