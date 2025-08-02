# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Development
npm run dev              # Start Next.js dev server
npm run dev:turbo        # Start with Turbo mode
npm run dev:auto         # Start with auto-clean capability
npm run dev:clean        # Clean .next directory and start dev server

# Build & Production
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run Next.js linter

# Utilities
npm run clean            # Remove .next directory
npm run restart          # Kill existing dev process and restart clean
```

## Architecture Overview

This is a Next.js 15 application for processing Todoist inbox tasks with keyboard shortcuts and AI-powered suggestions.

### Key Technologies
- **Next.js 15** with App Router
- **TypeScript** with strict mode
- **Tailwind CSS 4** for styling
- **Todoist API** via `@doist/todoist-api-typescript`
- **React 19** with server components

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

3. **API Routes Structure**
   - `/api/todoist/*` - Todoist API integration endpoints
   - `/api/llm/*` - AI suggestion endpoints (currently mock)
   - `/api/projects/*` - Project metadata and collaboration features

4. **State Management**
   - React hooks for local state
   - Custom hooks for shared logic (e.g., `useQueueConfig`, `useQueueProgression`)
   - No external state management library

5. **Configuration System**
   - Queue configuration loaded from `public/config/queue-config.json`
   - Live updates in development mode
   - Type-safe with TypeScript interfaces

### Important Patterns

- **Options Hooks**: Each dropdown type has a corresponding hook (e.g., `useProjectOptions`) that returns standardized options and handlers
- **Task Metadata**: Project metadata extracted from special tasks marked with `*` prefix or `project-metadata` label
- **Keyboard Navigation**: Extensive keyboard shortcuts for efficient task processing
- **Processing Modes**: Different queue types for focused task processing (project selection, priority assignment, etc.)

### Key Files
- `components/TaskProcessor.tsx` - Main task processing component
- `components/UnifiedDropdown.tsx` - Core dropdown component
- `hooks/useQueueConfig.ts` - Queue configuration loading
- `lib/todoist-api.ts` - Todoist API wrapper with caching
- `types/` - TypeScript type definitions