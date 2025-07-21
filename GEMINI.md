
# Gemini Project Context: todoist-inbox-processor (Frontend)

This document provides context for the Gemini AI assistant to effectively assist with development tasks on this project.

## Project Overview

This is a Next.js/TypeScript web application that provides a user interface for processing Todoist inbox tasks. It likely interacts with the backend MCP server.

## Core Technologies

- **Language:** TypeScript
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Dependencies:** Managed with `npm`.
- **Linting:** ESLint (`npm run lint`)

## Key Commands

- **Install Dependencies:** `npm install`
- **Run (Development):** `npm run dev`
- **Build:** `npm run build`
- **Run (Production):** `npm run start`
- **Lint:** `npm run lint`

## Project Structure

- `app/`: The main application directory for the Next.js app router.
  - `layout.tsx`: The root layout.
  - `page.tsx`: The main page component.
  - `api/`: API routes.
- `components/`: Reusable React components.
- `lib/`: Utility functions and libraries.
- `public/`: Static assets.
- `package.json`: Defines scripts, dependencies, and project metadata.
- `next.config.js`: Next.js configuration.
- `tailwind.config.ts`: Tailwind CSS configuration.
- `tsconfig.json`: TypeScript compiler options.

## Testing

The `test` script in `package.json` currently just returns an error. Testing procedures should be clarified if they exist.
