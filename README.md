# Enterprise AI Inventory Management System

A production-ready, full-stack inventory management application powered by an AI Assistant and Recommendation Engine. Built with React 19, Vite, Tailwind CSS, shadcn/ui, and Supabase.

## Features

- **Role-Based Access Control**: Super Admin, Admin, Manager, Employee, Viewer.
- **SaaS Dashboard**: Real-time insights, revenue trends, and inventory health metrics.
- **Inventory & Warehouse Management**: Full CRUD operations for products, categories, suppliers, and multi-warehouse setups.
- **AI Inventory Assistant**: Ask natural language questions about your live inventory. Uses Retrieval-Augmented Generation (RAG) backed by `pgvector` to ensure zero hallucinations.
- **AI Recommendation Engine**: Automated insights for low stock alerts, reordering, and dead stock detection.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router, Recharts.
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Edge Functions, pgvector).

## Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase CLI

### Setup Supabase (Local Development)

1. Navigate to the `backend/supabase` folder.
2. Initialize Supabase if not already done:
   ```bash
   supabase init
   ```
3. Start local Supabase services:
   ```bash
   supabase start
   ```
4. Copy the environment variables to `.env` in `backend/supabase`:
   ```bash
   cp .env.example .env
   # Add your OPENAI_API_KEY to the .env file
   ```

### Setup Frontend

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase CLI output.
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment to Vercel

1. Push the repository to GitHub.
2. Import the `frontend` directory into Vercel as a new project.
3. Vercel will automatically detect Vite. The build command is `npm run build` and output directory is `dist`.
4. Add the following environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

For Supabase deployment:
1. Link your local project to your remote Supabase instance:
   ```bash
   supabase link --project-ref your-project-ref
   ```
2. Push database migrations:
   ```bash
   supabase db push
   ```
3. Deploy Edge Functions:
   ```bash
   supabase functions deploy chat
   supabase functions deploy recommend
   ```
