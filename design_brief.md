# Design Brief: Kursverwaltungssystem

## 1. App Analysis
- **What this app does:** A comprehensive course management system for educational institutions to manage courses, instructors, participants, rooms, and enrollments in one centralized dashboard.
- **Who uses this:** Administrative staff at training centers, adult education facilities (Volkshochschule), or corporate training departments.
- **The ONE thing users care about most:** Quick overview of current courses and their enrollment status.
- **Primary actions:** Create/edit courses, register participants, manage enrollments, assign instructors and rooms.

## 2. What Makes This Design Distinctive
- **Visual identity:** Academic elegance with deep navy blues and warm gold accents. Clean, structured layouts that reflect the organized nature of course administration. Subtle card elevation creates depth without clutter.
- **Layout strategy:** Tab-based navigation with a persistent statistics header. Hero element is the active courses count with enrollment progress bars.
- **Unique element:** Gold accent badges showing enrollment capacity (e.g., "12/20 Plätze") that fill like progress indicators.

## 3. Theme & Colors
- **Font:** Plus Jakarta Sans – Professional, modern, excellent readability
- **Google Fonts URL:** https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap
- **Why this font:** Geometric yet warm, conveys professionalism without being cold. Great for data-heavy interfaces.

**Color Palette:**
```
--primary: 222 47% 25%         /* Deep navy - main brand */
--primary-foreground: 0 0% 98% /* White text on primary */
--accent: 43 74% 49%           /* Warm gold - highlights */
--accent-foreground: 222 47% 15% /* Dark text on gold */
--background: 220 20% 97%      /* Cool off-white */
--card: 0 0% 100%              /* Pure white cards */
--muted: 220 14% 90%           /* Subtle borders/dividers */
--muted-foreground: 220 9% 46% /* Secondary text */
--success: 152 69% 31%         /* Green for "bezahlt" */
--destructive: 0 84% 60%       /* Red for delete actions */
```

**Background treatment:** Subtle cool gray base with white cards that float slightly above.

## 4. Mobile Layout
- **Layout approach:** Single column with collapsible stat cards at top, then tabbed content below
- **What users see:** Stats summary → Tab bar (sticky) → Content list → FAB for adding new items
- **Touch targets:** Large tap areas (min 48px), swipe actions for edit/delete on list items

## 5. Desktop Layout
- **Overall structure:** Sidebar navigation (optional) or top tab bar. Main content area with 3-column grid for stats, then full-width data tables.
- **Section layout:** Stats row (4 cards) → Tab navigation → Data table with inline actions
- **Hover states:** Row highlight on tables, button elevations, tooltip previews for linked data

## 6. Components

### Hero KPI
- **Total active courses** with large number display
- Subtext showing "X starting this month"
- Gold accent border on left

### Secondary KPIs (in a row)
1. **Teilnehmer** - Total registered participants
2. **Auslastung** - Average enrollment percentage across courses
3. **Dozenten** - Active instructors count
4. **Räume** - Available rooms

### Data Tables (one per tab)
- Kurse: Title, Dozent, Raum, Datum, Teilnehmer (X/Max), Preis, Actions
- Dozenten: Name, Email, Telefon, Fachgebiet, Actions
- Teilnehmer: Name, Email, Telefon, Geburtsdatum, Actions
- Räume: Name, Gebäude, Kapazität, Actions
- Anmeldungen: Teilnehmer, Kurs, Datum, Bezahlt (badge), Actions

### Primary Action Button
- "Neu erstellen" button in each tab context
- Opens modal/drawer with form for that entity

### Enrollment Badge
- Shows "12/20" with progress bar underneath
- Gold when almost full (>80%), gray otherwise

## 7. Visual Details
- **Border radius:** 8px for cards, 6px for buttons, 4px for inputs
- **Shadows:**
  - Cards: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`
  - Elevated: `0 10px 15px -3px rgba(0,0,0,0.1)`
- **Spacing:** 4px base unit. Cards have 24px padding, 16px gaps between cards.
- **Animations:**
  - 200ms ease-out for hover transitions
  - 300ms for modal open/close
  - Subtle scale(1.02) on card hover

## 8. CSS Variables

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --font-sans: 'Plus Jakarta Sans', sans-serif;

  /* Core palette */
  --background: 220 20% 97%;
  --foreground: 222 47% 11%;

  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  --primary: 222 47% 25%;
  --primary-foreground: 0 0% 98%;

  --secondary: 220 14% 96%;
  --secondary-foreground: 222 47% 20%;

  --muted: 220 14% 90%;
  --muted-foreground: 220 9% 46%;

  --accent: 43 74% 49%;
  --accent-foreground: 222 47% 15%;

  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;

  --success: 152 69% 31%;
  --success-foreground: 0 0% 98%;

  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 222 47% 25%;

  --radius: 0.5rem;

  /* Custom shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06);
  --shadow-elevated: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, hsl(222 47% 25%), hsl(222 47% 35%));
  --gradient-accent: linear-gradient(135deg, hsl(43 74% 49%), hsl(43 74% 59%));
  --gradient-subtle: linear-gradient(180deg, hsl(220 20% 97%), hsl(220 20% 95%));
}
```
