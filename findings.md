# Findings & Technical Decisions: Online Examination System

## Project Requirements
- Enterprise/educational grade Online Examination System.
- Multi-role: Admin, Instructor, Student.
- 5 Question types: MCQ, MSQ, True/False, Short Answer, Essay/Descriptive with rubrics.
- 6-step Exam Builder workflow.
- Proctored Exam Engine: Authoritative timer, anti-cheating detections (fullscreen, tab blur, copy/paste), autosave, refresh recovery, answer key isolation.
- Automatic scoring + manual essay grading with score recalculation.
- Meaningful analytics & audit logs.
- Kindergarten Test Exam ("Kids Easy Test – LKG / UKG / Kindergarten") with 20 exact questions seeded in database.

## Architecture
- **Frontend Stack**: Vite + React 18/19 + TypeScript + Tailwind CSS + Lucide React + React Router v6 + TanStack React Query + React Hook Form + Zod + Recharts.
- **Backend / Storage**:
  - Full Supabase PostgreSQL schema with RLS policies and stored procedures (`supabase/migrations/`).
  - Seamless Dual-Mode Client: If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided, connects to real Supabase. Otherwise, seamlessly runs a local persistent database engine (`src/services/db/`) that executes the exact same operations, RLS constraints, answer key stripping for active attempts, and scoring engine.
  - This ensures 100% zero-config immediate out-of-the-box functionality, while providing complete production-ready SQL migrations for live Supabase deployments.

## Design System Tokens
- Neutral slate palette (`#0f172a`, `#334155`, `#64748b`, `#f8fafc`).
- Primary education indigo/blue (`#2563eb`, `#1d4ed8`) - calm, authoritative, accessible contrast.
- Emerald for success (`#10b981`), Amber for warnings (`#f59e0b`), Rose for destructive (`#ef4444`).
- No neon, no glassmorphism clutter, no AI-generated gradients. High clarity, dense information hierarchy, spacious padding, crisp borders.
