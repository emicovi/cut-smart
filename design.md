# Design — Cut Smart

A locked design system for this app. Every future redesign reads this file before changing the interface. Extend this system instead of creating per-screen themes.

## Genre

Modern-minimal, with a utilitarian product voice.

## Product context

- Audience: one person using the app every day.
- Primary job: follow the meal plan.
- Information architecture: Piano · Spesa · Progressi.
- Content priority: next meal first, weekly context second, supporting evidence last.

## Macrostructure family

- App screens: Narrative Workflow, adapted to real in-product sequences rather than marketing stages.
- Piano: day → next meal → remaining meals → optional supporting tasks.
- Spesa: remaining products → current department → next department → completed list.
- Progressi: current evidence → new measurement → weekly adjustment → private history.
- Marketing pages: not present.
- Content pages: not present.

## Navigation

N5 Floating pill adapted to a compact three-destination mobile dock. The control stays visibly detached from viewport edges, has no more than three destinations, and never expands into a full-width rounded bar.

## Theme

- `--color-paper` oklch(97% 0.012 150)
- `--color-paper-2` oklch(94% 0.014 150)
- `--color-paper-3` oklch(91% 0.016 150)
- `--color-ink` oklch(20% 0.018 150)
- `--color-ink-2` oklch(36% 0.014 150)
- `--color-muted` oklch(45% 0.012 150)
- `--color-rule` oklch(82% 0.014 150)
- `--color-rule-2` oklch(89% 0.012 150)
- `--color-accent` oklch(45% 0.14 150)
- `--color-accent-ink` oklch(98% 0.008 150)
- `--color-focus` oklch(62% 0.19 150)

The accent is a signal, not a surface. Use it for active navigation, progress, focus, checkboxes, and small status details. Large controls use ink rather than accent.

## Typography

- Display: Bricolage Grotesque, weight 700–800, roman.
- Body and UI: Geist, weight 400.
- Emphasis: Geist, weight 700.
- Display tracking: −0.035em.
- Type-scale anchor: `--text-display: clamp(2.1rem, 7vw, 4.25rem)`.
- Numeric interfaces use tabular figures.
- Headings never use italic.

## Spacing

Use the 4-point named scale in `tokens.css`. Product components use `var(--space-*)`; raw spacing values are reserved for one-pixel rules and geometry that cannot be represented by the scale.

## Shape and depth

- Controls: `--radius-control`.
- Content containers: `--radius-card`.
- Navigation and binary selectors: `--radius-pill`.
- One floating shadow token is allowed for the detached navigation and transient toast.
- Content hierarchy comes from type, spacing, and rules rather than stacked cards.

## Motion

- No page or scroll reveals.
- Functional transitions only: button press, state crossfade, modal entry, toast entry.
- Easings: `--ease-out`, `--ease-in`, `--ease-in-out`.
- Reduced-motion fallback: no spatial movement, durations at or below 150 ms.

## Microinteractions stance

- Successful visible changes are silent.
- Shopping uses optimistic updates with a 10-second Undo.
- Focus rings appear immediately.
- Hover styles run only on hover-capable pointers.
- Touch targets are at least 44 × 44 CSS pixels.

## CTA voice

- Primary: ink fill, paper text, short action verb, single line.
- Secondary: paper fill, ink border, short action verb, single line.
- Destructive actions: error-coloured text and border, never decorative red fill.

## Per-screen allowances

- App screens must not use enrichment, ornamental illustration, generic emoji icons, or decorative gradients.
- Food emoji may appear only as factual meal thumbnails because they identify meal content; navigation and system controls use one coherent line-icon set.
- Guided cooking remains a native dialog and uses the same tokens.
- Progress charts use the accent only for the data line and latest point.

## What screens must share

- Cut Smart wordmark.
- Theme, fonts, spacing, controls, focus treatment, and navigation.
- Left-aligned section headings.
- One containment layer at a time.
- Compact, factual Italian copy.

## What screens may differ

- Piano may use a denser meal sequence.
- Spesa may keep controls sticky while shopping.
- Progressi may use two columns at desktop widths.
- Only Piano may show meal-content emoji.

## Exports

### tokens.css

The canonical drop-in export is the root `tokens.css` file. It contains the full colour, font, spacing, type, motion, radius, rule, shadow, and z-index token set.

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(97% 0.012 150);
  --color-paper-2: oklch(94% 0.014 150);
  --color-paper-3: oklch(91% 0.016 150);
  --color-ink: oklch(20% 0.018 150);
  --color-ink-2: oklch(36% 0.014 150);
  --color-muted: oklch(45% 0.012 150);
  --color-rule: oklch(82% 0.014 150);
  --color-accent: oklch(45% 0.14 150);
  --color-accent-ink: oklch(98% 0.008 150);
  --color-focus: oklch(62% 0.19 150);
  --font-display: "Bricolage Grotesque", sans-serif;
  --font-body: "Geist", sans-serif;
  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2.5rem;
  --text-base: 1rem;
  --text-md: 1.25rem;
  --text-lg: 1.5625rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "color": {
    "paper": { "$value": "oklch(97% 0.012 150)", "$type": "color" },
    "paper-2": { "$value": "oklch(94% 0.014 150)", "$type": "color" },
    "ink": { "$value": "oklch(20% 0.018 150)", "$type": "color" },
    "muted": { "$value": "oklch(45% 0.012 150)", "$type": "color" },
    "rule": { "$value": "oklch(82% 0.014 150)", "$type": "color" },
    "accent": { "$value": "oklch(45% 0.14 150)", "$type": "color" },
    "focus": { "$value": "oklch(62% 0.19 150)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Bricolage Grotesque", "$type": "fontFamily" },
    "body": { "$value": "Geist", "$type": "fontFamily" }
  },
  "space": {
    "xs": { "$value": "0.5rem", "$type": "dimension" },
    "sm": { "$value": "0.75rem", "$type": "dimension" },
    "md": { "$value": "1rem", "$type": "dimension" },
    "lg": { "$value": "1.5rem", "$type": "dimension" },
    "xl": { "$value": "2.5rem", "$type": "dimension" }
  }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background: 97% 0.012 150;
  --foreground: 20% 0.018 150;
  --primary: 45% 0.14 150;
  --primary-foreground: 98% 0.008 150;
  --muted: 94% 0.014 150;
  --muted-foreground: 45% 0.012 150;
  --border: 82% 0.014 150;
  --input: 82% 0.014 150;
  --ring: 62% 0.19 150;
  --radius: 0.625rem;
}
```
