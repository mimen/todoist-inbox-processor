# Todoist Inbox Processor

A sleek Next.js interface for processing Todoist inbox tasks efficiently with keyboard shortcuts and AI-powered suggestions.

## Features

- **Keyboard-Optimized**: Process tasks quickly with keyboard shortcuts
- **AI Suggestions**: Mock AI suggestions for projects, labels, priorities, and task rewrites
- **Beautiful UI**: Clean, focused interface built with Tailwind CSS
- **Progress Tracking**: Visual progress indicator and queue preview
- **Skip Option**: Skip tasks that need more context
- **Real-time Processing**: Immediate feedback and smooth transitions

## Keyboard Shortcuts

- `Enter` - Process current task
- `S` - Skip current task
- `?` - Toggle keyboard shortcuts help
- `Esc` - Close help modal
- `Tab` - Navigate between form fields
- `1-4` - Set priority (P1-P4)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Mock Data

Currently uses mock data for development and UI testing:
- 5 sample inbox tasks
- Project suggestions (Work, Personal, Shopping)
- Label suggestions (urgent, waiting, someday, email, phone)
- AI-powered task rewriting suggestions

## Future Integration

This interface is designed to integrate with the Todoist MCP server for real API interactions. The mock AI suggestions will be replaced with actual AI processing in future iterations.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Turbo** - Fast development builds

## Development

```bash
# Development with Turbo
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```# todoist-mcp-tools
