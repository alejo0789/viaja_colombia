# shadcn/ui Components

This directory contains standard shadcn/ui components for the VIAJA-COL-COMPLETO project.

## Components Created

1. **alert.tsx** - Alert components with variants (default, destructive)
2. **avatar.tsx** - Avatar with Image and Fallback subcomponents
3. **badge.tsx** - Badge with variants (default, secondary, destructive, outline)
4. **button.tsx** - Button with variants (default, destructive, outline, secondary, ghost, link) and sizes (default, sm, lg, icon)
5. **card.tsx** - Card layout components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
6. **chart.tsx** - Chart container wrapper for recharts configuration
7. **dialog.tsx** - Dialog/Modal components with overlay and content
8. **dropdown-menu.tsx** - Dropdown menu with support for checkboxes, radio items, and submenus
9. **input.tsx** - Standard input field component
10. **label.tsx** - Label component with cva variants
11. **popover.tsx** - Popover component for positioned content
12. **progress.tsx** - Progress bar component
13. **scroll-area.tsx** - Scrollable area with custom scrollbars
14. **select.tsx** - Select dropdown with groups, labels, and scroll buttons
15. **separator.tsx** - Horizontal or vertical separator line
16. **sheet.tsx** - Side sheet/drawer component (variants: top, bottom, left, right)
17. **skeleton.tsx** - Skeleton loading component with pulse animation
18. **sonner.tsx** - Sonner toast wrapper with next-themes integration
19. **switch.tsx** - Toggle switch component
20. **table.tsx** - Table components (Table, TableHeader, TableBody, TableFooter, etc.)
21. **tabs.tsx** - Tab navigation components
22. **textarea.tsx** - Multi-line text input component
23. **toast.tsx** - Toast notification system using @radix-ui/react-toast
24. **toaster.tsx** - Toaster renderer component with useToast hook
25. **tooltip.tsx** - Tooltip with trigger and content

## Dependencies

All components use:
- `@radix-ui/*` primitives
- `class-variance-authority` (cva) for variants
- `@/lib/utils` for the cn() utility function
- `lucide-react` for icons
- `next-themes` (for Sonner integration)
- `sonner` (optional, for toast alternative)

## Architecture

- All components follow shadcn/ui standard patterns
- Components are forwardRef-enabled for ref passing
- Proper TypeScript typing with interfaces
- Dark mode support via Tailwind CSS class variants
- Accessible components using Radix UI primitives

## Usage

Import components from this directory:

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
```
