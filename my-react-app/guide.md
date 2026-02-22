# PROJECT: "The War Room" - NBA Executive AI Suite

## 1. Executive Summary
A high-performance decision-support system for NBA Front Offices. The app bridges the gap between on-court performance (tracking data) and front-office economics (salary cap/valuation).

## 2. Technical Stack
- Frontend: React (Vite), Tailwind CSS, Recharts, Lucide-React.
- Backend: Python (FastAPI), nba_api, Scikit-learn, Pandas.
- Database: Supabase (PostgreSQL + pgvector for metadata and vector search).
- AI: LLM (Gemini/OpenAI) for Natural Language Querying (NLQ) and Gameplan Generation.

## 3. Feature Specifications & Logic
- **Team Selection Onboarding**: On first sign-up, the executive selects which NBA team he/she is the head of. This choice is persisted to the user's profile and scopes every downstream feature to that team (see §3.1).
- Shot Selection Hotspots: Map (x, y) coordinates from nba_api. Calculate Points Per Shot (PPS) and FG% per zone.
- Performance Predictor: Use a Random Forest model on the last 20 games + opponent Defensive Rating to predict stats for the "Next Game."
- Fragility Score (Injury Risk): Logic based on Age, MPG, Usage Rate, and Back-to-Back frequency. No biometrics.
- Contract Valuator: Fair Market Value calculation based on Win Shares relative to the Salary Cap.
- Team Fit Engine: Use Supabase (pgvector) to store player profiles. GMs select a "Team Identity" (e.g., Pace & Space), and we use Cosine Similarity to find matching players.
- Team Value Projection: 5-year Monte Carlo simulation of team record and financial valuation.

### 3.1 Team Selection & Team-Scoped Data

#### Onboarding Flow
1. After the executive creates an account (email/password via Supabase Auth), a **Team Selection** screen is shown before any other page.
2. The screen displays all 30 NBA teams (logo + city + name) in a searchable grid.
3. The executive clicks a team to select it, confirms the choice, and the selected `team_id` is saved to their user profile in a `profiles` table (column: `team_id`).
4. Until a team is selected, the user cannot access the main dashboard (route guard / middleware).

#### Data Scoping
Once a team is chosen, every feature in the app reflects that team:
- **Roster & Player Data**: The sidebar "Players" section and all player-centric views (Shot Hotspots, Performance Predictor, Fragility Score, Contract Valuator) default to the executive's team roster. The roster is fetched via `nba_api` using the stored `team_id`.
- **Team Stats & Value Projection**: The Team Value Projection and any team-level dashboards automatically load data for the selected team.
- **Team Fit Engine**: The "Team Identity" baseline and similarity searches are anchored to the executive's team composition.
- **Trade Simulator**: The executive's team is pre-loaded on one side of the trade interface; the other side is any opponent team they choose.
- **AI Chat / NLQ**: Queries are context-aware — the LLM receives the executive's team context so answers like "How is my roster performing?" refer to the correct team.

#### Changing Teams
- An option in **Settings** allows the executive to switch teams at any time. Switching immediately re-scopes all data across the app.

#### Database Schema Addition
- `profiles` table (Supabase):
  - `id` (UUID, FK → `auth.users.id`)
  - `display_name` (text)
  - `team_id` (integer, NBA team ID from `nba_api`)
  - `team_name` (text, e.g., "Los Angeles Lakers")
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

## 4. Supabase + pgvector Implementation
- Embedding: Convert seasonal stats into vectors.
- Similarity Search: Power the "Find players similar to X" feature.
- RAG: Store scouting reports in Supabase to provide context for the AI Chat.

## 5. Development Roles (Team Split)
- Backend/Data (Lead): FastAPI setup, nba_api integration, Supabase/pgvector logic, prediction models.
- Frontend: React Dashboard, SVG Court Heatmaps, Recharts for progress.
- Integration: API connections, Trade Simulator drag-and-drop, NLQ chat interface.

## 6. UI / Design Direction

### 6.1 Visual Style and Mood
- Calm, simple, intuitive -- inspired by [apple.com](https://www.apple.com/).
- Primarily **white, black, and gray** palette; minimal accent color usage.
- Generous whitespace, clean typography (SF Pro / Inter / system sans-serif).
- Smooth micro-interactions and transitions.

### 6.2 Liquid Glass Effect (Apple visionOS-inspired)
- Translucent frosted-glass panels using CSS `backdrop-filter: blur()` with semi-transparent backgrounds.
- Subtle border highlights (1px white at ~20% opacity) to simulate glass edge lighting.
- Soft drop shadows for depth; layered z-index to create spatial hierarchy.
- Use for: sidebar, modal overlays, floating toolbars, card hover states.

### 6.3 Landing Page -- Bento Card Grid (Portrait-inspired)
- Top section: app name + tagline.
- Below: a masonry / bento-style grid of cards, each representing one core feature (Shot Hotspots, Performance Predictor, Fragility Score, Contract Valuator, Team Fit Engine, Team Value Projection).
- Cards vary in size (span 1 or 2 columns/rows) for visual interest.
- Each card contains a title, short description, and a subtle preview graphic or icon.
- Rounded corners (`border-radius: 16px`), light border or shadow, white/light-gray background.

### 6.4 Inner Pages -- Sidebar Navigation (Acctual-inspired)
- Persistent left sidebar (~220px) listing all features with icons (use Lucide icons, already in the stack).
- Sidebar items: vertical list with labels and status badges where relevant.
- Bottom of sidebar: Support, Settings, user avatar.
- Main content area: clean white canvas with section headers and contextual controls.
- Sidebar uses the liquid glass effect (frosted translucent background) to tie back to the overall aesthetic.

### 6.5 General UI Principles
- Navigation should be immediately obvious; no more than one click to reach any feature.
- Typography hierarchy: large bold headings, medium subheadings, regular body text.
- Responsive: cards reflow on smaller screens; sidebar collapses to icon-only or hamburger menu on mobile.
- Animations: subtle fade/slide transitions (150-300ms ease); no jarring movements.

## 7. Prerequisites & Environment Setup

### 7.1 API Keys & Accounts
- **Supabase**: Create a free project at [supabase.com](https://supabase.com). Required env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **LLM (pick one)**: `OPENAI_API_KEY` from [platform.openai.com](https://platform.openai.com) or `GEMINI_API_KEY` from [aistudio.google.com](https://aistudio.google.com).

### 7.2 Supabase Database Setup
- Enable the pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;` via the SQL Editor in the Supabase dashboard.
- Tables will be created by migration scripts during development.

### 7.3 Data Sources
- **NBA stats**: Pulled live via the `nba_api` Python package (no key required). Covers shot coordinates, game logs, player/team stats.
- **Salary cap data**: Public data from Basketball Reference or hardcoded for the current season.
- **Scouting reports (RAG)**: Seeded manually or sourced from public draft/scouting databases.

### 7.4 Frontend Dependencies
- Tailwind CSS, Recharts, Lucide-React, React Router DOM (installed via npm).

### 7.5 Backend Dependencies
- Python 3.11+, FastAPI, Uvicorn, nba_api, Scikit-learn, Pandas, Supabase Python client, OpenAI/Google GenAI SDK.

## 8. Documentation Links

### 8.1 Frontend
- **React**: [react.dev](https://react.dev)
- **Vite**: [vite.dev/guide](https://vite.dev/guide/)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **React Router**: [reactrouter.com](https://reactrouter.com/)
- **Recharts**: [recharts.org/en-US/api](https://recharts.org/en-US/api)
- **Lucide React**: [lucide.dev/guide/packages/lucide-react](https://lucide.dev/guide/packages/lucide-react)

### 8.2 Backend
- **Python**: [docs.python.org/3](https://docs.python.org/3/)
- **FastAPI**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
- **Uvicorn**: [www.uvicorn.org](https://www.uvicorn.org/)
- **nba_api**: [github.com/swar/nba_api](https://github.com/swar/nba_api)
- **Scikit-learn**: [scikit-learn.org/stable/user_guide.html](https://scikit-learn.org/stable/user_guide.html)
- **Pandas**: [pandas.pydata.org/docs](https://pandas.pydata.org/docs/)
- **NumPy**: [numpy.org/doc](https://numpy.org/doc/)

### 8.3 Database
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Supabase Python Client**: [supabase.com/docs/reference/python/introduction](https://supabase.com/docs/reference/python/introduction)
- **pgvector**: [github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
- **PostgreSQL**: [www.postgresql.org/docs](https://www.postgresql.org/docs/)

### 8.4 AI / LLM
- **OpenAI API**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Google Gemini**: [ai.google.dev/gemini-api/docs](https://ai.google.dev/gemini-api/docs)