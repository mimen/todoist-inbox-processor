# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development (includes Redis + Next.js)
pnpm run dev              # Start Redis + Next.js dev server
pnpm run dev:turbo        # Start Redis + Next.js with Turbo mode
pnpm run dev:auto         # Start Redis + Next.js with auto-clean capability
pnpm run dev:clean        # Clean .next directory and start dev server
pnpm run dev:next-only    # Start only Next.js (without Redis)

# Individual services
pnpm run redis            # Start Redis server only

# Build & Production
pnpm run build            # Build for production
pnpm start                # Start production server

# Code Quality
pnpm run lint             # Run Next.js linter

# Utilities
pnpm run clean            # Remove .next directory
pnpm run restart          # Kill Redis + Next.js processes and restart clean
```

## Architecture Overview

This is a Next.js 15 application for processing Todoist inbox tasks with keyboard shortcuts and AI-powered suggestions.

### Key Technologies
- **Next.js 15** with App Router
- **TypeScript** with strict mode
- **Tailwind CSS 4** for styling
- **Todoist API** via `@doist/todoist-api-typescript`
- **React 19** with server components
- **Redis** for calendar event caching
- **Google Calendar API** with OAuth 2.0

### Core Architecture

1. **Task Processing Flow**
   - `TaskProcessor` component manages the overall task queue and processing state
   - Tasks flow through various processing modes (project, priority, labels, etc.)
   - Queue progression system with "keep going?" prompts between queues

2. **Unified Dropdown System**
   - Single `UnifiedDropdown` component handles all dropdown types
   - Options hooks in `hooks/use*Options.ts` provide data and actions
   - Configuration-driven via JSON file in `public/config/queue-config.json`
   - Full sorting system with per-dropdown customization

3. **Calendar Integration & Caching**
   - Redis-based calendar event caching with sync tokens
   - Google Calendar API OAuth 2.0 integration
   - Incremental sync reduces API calls by 95%
   - Background sync every 15 minutes
   - Rate limit protection with exponential backoff

4. **API Routes Structure**
   - `/api/todoist/*` - Todoist API integration endpoints
   - `/api/calendar/*` - Calendar events and sync endpoints
   - `/api/auth/google/*` - OAuth flow endpoints
   - `/api/llm/*` - AI suggestion endpoints (currently mock)
   - `/api/projects/*` - Project metadata and collaboration features

5. **State Management**
   - React hooks for local state
   - Custom hooks for shared logic (e.g., `useQueueConfig`, `useQueueProgression`)
   - Redis for calendar event persistence
   - No external state management library

6. **Configuration System**
   - Queue configuration loaded from `public/config/queue-config.json`
   - Live updates in development mode
   - Type-safe with TypeScript interfaces

### Important Patterns

- **Options Hooks**: Each dropdown type has a corresponding hook (e.g., `useProjectOptions`) that returns standardized options and handlers
- **Task Metadata**: Project metadata extracted from special tasks marked with `*` prefix or `project-metadata` label
- **Keyboard Navigation**: Extensive keyboard shortcuts for efficient task processing
- **Processing Modes**: Different queue types for focused task processing (project selection, priority assignment, etc.)

### Critical Rules

#### API ID Usage
**ALWAYS use Sync API IDs, NEVER use REST API IDs**
- The Todoist Sync API and REST API use different ID formats
- This codebase exclusively uses Sync API IDs for all operations
- REST API calls or IDs must never be introduced into the codebase
- All Todoist operations should use the `@doist/todoist-api-typescript` client which uses Sync API
- If you encounter any REST API endpoints or IDs, they must be converted to use Sync API equivalents

### Key Files
- `components/TaskProcessor.tsx` - Main task processing component
- `components/UnifiedDropdown.tsx` - Core dropdown component
- `hooks/useQueueConfig.ts` - Queue configuration loading
- `lib/todoist-api.ts` - Todoist API wrapper with caching
- `types/` - TypeScript type definitions