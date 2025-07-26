# Project Documentation Standard

Keep it simple. Create only the documents you actually need.

## Structure

```
docs/projects/
└── project-name/
    ├── README.md          # Project overview
    ├── PRD.md            # Product requirements (if needed)
    ├── Technical-Spec.md # Technical design (if needed)
    └── [other-docs].md   # Add as needed
```

## Guidelines

1. **Project Folder**: Create a folder with your project name in `kebab-case`
2. **Document Names**: Use `Title-Case.md` without the project name prefix
3. **Only Create What's Needed**: Don't create documents just to fill a template
4. **Keep It Flat**: No subfolders unless the project truly needs them

## Common Documents (create only if needed)

- **README.md** - Project overview and status
- **PRD.md** - Product requirements and user stories
- **Technical-Spec.md** - Architecture and implementation details
- **Stakeholder-Questions.md** - Unresolved questions
- **Implementation-Guide.md** - Step-by-step development instructions

## Example

```
docs/projects/list-view/
├── README.md
├── PRD.md
├── Technical-Spec.md
├── Implementation-Guide.md
└── Component-Templates.md
```

That's it. Keep it simple, keep it useful.