# Task Processor Workflow Guide

## Overview

The Task Processor is a keyboard-optimized web application designed for rapid processing of Todoist inbox tasks. It prioritizes speed and efficiency over feature completeness, enabling users to maintain high data quality with minimal time investment.

## Core Philosophy

### Speed Over Features
- Single-keystroke actions for common operations
- Auto-focus on form inputs when tasks change
- Minimal clicking required
- Streamlined interface focused on essential metadata

### Intelligent Assistance
- AI-powered project suggestions based on task content
- Label recommendations using pattern recognition
- Priority suggestions for urgent language detection
- Task rewriting suggestions for improved clarity

### Systematic Workflow
- Queue-based processing ensures nothing is missed
- Progress tracking provides clear completion feedback
- Skip functionality for tasks requiring additional context
- Batch operations for efficient metadata assignment

## Keyboard Shortcuts

### Primary Actions
- **Enter**: Process current task (save metadata and move to next)
- **S**: Skip current task (move to next without processing)
- **Esc**: Close any open modal or overlay

### Navigation
- **Tab**: Navigate between form fields
- **Shift + Tab**: Navigate backwards through form fields

### Quick Actions
- **1-4**: Set priority levels (P1=urgent, P2=high, P3=medium, P4=low)
- **?**: Toggle keyboard shortcuts help modal

### Interface Controls
- **C**: Focus on task content/title field
- **D**: Focus on description field
- **P**: Open project selection overlay

## Workflow Steps

### 1. Task Review
- Current task displays in left panel with original content
- Review task content to understand context and scope
- Note any time sensitivity or project associations

### 2. Metadata Assignment
Use keyboard shortcuts and AI suggestions to assign:

#### Project Assignment
- Review AI project suggestions based on task content
- Use arrow keys or click to select suggested project
- Or type project name for manual assignment
- Projects with existing metadata are prioritized in suggestions

#### Label Assignment
- Multiple labels can be assigned using comma separation
- AI suggests labels based on task patterns:
  - `urgent` for time-sensitive language
  - `waiting` for dependency-related tasks
  - `email` for communication tasks
  - `phone` for call-related tasks

#### Priority Setting
- P1 (Red): Urgent, same-day completion required
- P2 (Orange): High priority, this week
- P3 (Blue): Medium priority, this month
- P4 (Gray): Low priority, someday/maybe

#### Scheduling
- Due dates using natural language (e.g., "tomorrow 2pm", "Friday")
- Scheduled dates for when to start working on task
- Duration estimates for time blocking

#### Content Enhancement
- AI suggests task rewrites for improved clarity
- Add descriptions for complex tasks requiring additional context
- Maintain original intent while improving actionability

### 3. Processing Decision
- **Process**: Save all metadata and advance to next task
- **Skip**: Move to next task without saving (task remains in inbox)

### 4. Progress Tracking
- Visual progress bar shows completion percentage
- Queue preview displays upcoming tasks
- Celebration screen when inbox reaches zero

## AI Suggestion System

### Project Suggestions
- Analyzes task content using keyword matching and context clues
- Prioritizes projects with complete metadata
- Confidence scores help evaluate suggestion quality
- Learns from user selections to improve future suggestions

### Label Suggestions
- Pattern recognition based on common task types
- Time-sensitivity detection for urgent labeling
- Communication method identification (email, phone, meeting)
- Context-aware suggestions based on project assignment

### Task Rewriting
- Improves task clarity and actionability
- Maintains original intent while enhancing specificity
- Suggests better verb usage and outcome definition
- Removes ambiguous language

## Best Practices

### Preparation
1. Ensure all active projects have metadata (use Projects page)
2. Review project suggestions cache for optimal performance
3. Process inbox when focused and uninterrupted

### During Processing
1. Trust AI suggestions but verify accuracy
2. Use skip liberally for tasks requiring additional research
3. Maintain consistent labeling patterns
4. Add descriptions for complex or multi-step tasks

### Post-Processing
1. Review skipped tasks for additional context gathering
2. Update project metadata based on new task insights
3. Schedule focused time blocks for high-priority items
4. Plan follow-up processing sessions for ongoing maintenance

## Integration with MCP Tools

The Task Processor prepares data for optimal MCP tool usage:

### Enhanced Context
- Proper project assignment enables project-based task queries
- Consistent labeling improves filtering and search
- Priority assignments help with workload analysis
- Descriptions provide context for AI planning assistance

### Improved AI Interactions
- Well-categorized tasks enable trustworthy scheduling recommendations
- Complete metadata allows for accurate priority queue generation
- Proper project context supports intelligent task batching
- Quality data reduces need for clarifying questions during AI sessions

## Maintenance Workflow

### Daily Routine
1. Process new inbox items (5-15 minutes)
2. Review any skipped items from previous sessions
3. Quick scan of high-priority items for the day

### Weekly Review
1. Process any accumulated skipped tasks
2. Update project metadata for active projects
3. Review and adjust priority assignments
4. Clean up completed projects and outdated labels

### Monthly Optimization
1. Analyze task processing patterns
2. Update AI suggestion algorithms
3. Review project hierarchy and organization
4. Optimize keyboard shortcuts and workflow efficiency

This systematic approach ensures that task data remains current and well-organized, providing the foundation for effective AI-assisted productivity management.