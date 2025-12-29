# Design Guidelines: Lesson-to-Social Media Image Generator

## Design Approach

**System Selected:** Material Design with custom brand integration
**Rationale:** Utility-focused educational tool requiring clear workflows, efficient processing, and professional presentation. Material Design provides the structure needed for multi-step processes while allowing brand color customization.

## Core Design Principles

1. **Workflow Clarity** - Multi-step process must be obvious and guided
2. **Content Preview** - Users need to see lesson analysis before generation
3. **Brand Consistency** - Maintain strict brand color palette throughout
4. **Generation Transparency** - Show AI analysis and image creation progress

---

## Typography

**Font Stack:**
- **Primary:** Inter (Google Fonts) - Clean, modern sans-serif for UI
- **Display:** Poppins SemiBold - For headings and emphasis

**Hierarchy:**
- H1: 32px/40px (Poppins SemiBold) - Page titles
- H2: 24px/32px (Poppins SemiBold) - Section headers
- H3: 18px/24px (Poppins SemiBold) - Card titles
- Body: 16px/24px (Inter Regular) - Primary text
- Small: 14px/20px (Inter Regular) - Labels, metadata
- Caption: 12px/16px (Inter Medium) - Help text

---

## Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-6 (standard), p-8 (generous)
- Section spacing: py-12 to py-16
- Card spacing: p-6 with gap-6 for internal elements
- Form fields: mb-4 between fields, mb-8 between sections

**Container Strategy:**
- Max-width: max-w-6xl for main content area
- Side panels: Fixed w-80 or w-96 for preview/settings
- Full-bleed upload zones

---

## Color Implementation

**Brand Palette:**
- **Primary Yellow:** #edc437 - CTAs, highlights, success states
- **Navy Blue:** #051d40 - Headers, primary text, borders
- **Off-White:** #fdfdfd - Backgrounds, cards
- **System Colors:**
  - Error: #dc2626
  - Warning: #f59e0b  
  - Success: #10b981 (use sparingly, prefer brand yellow)
  - Neutral Grays: #6b7280, #d1d5db, #f3f4f6

**Application Rules:**
- Backgrounds: #fdfdfd for main areas
- Cards/surfaces: White (#ffffff) with subtle shadow
- Primary actions: #edc437 buttons with #051d40 text
- Headers/navigation: #051d40 background with #fdfdfd text
- Borders: #d1d5db for subtle separation, #051d40 for emphasis

---

## Component Library

### 1. File Upload Zone
- Drag-and-drop area with dashed border (#051d40)
- Large centered upload icon and "Drop JSON file here"
- File type badge showing accepted format (.json)
- Alternative: "Browse files" button (yellow background)
- Shows uploaded file name with remove option

### 2. Lesson Analysis Panel
- Left sidebar (w-80) displaying:
  - Lesson title and CERF level badge
  - Vocabulary count with icon
  - Section breakdown (warmup, reading, vocab, etc.)
  - Estimated generation time
- Scrollable content with clear hierarchy

### 3. Content Preview Cards
- White cards with subtle shadow
- Each vocabulary word displayed as expandable card:
  - Header: Term + part of speech
  - Definition in medium weight
  - Example sentence in italics
  - Collapsible additional examples
  - Associated image prompt preview

### 4. Image Generation Controls
- Top bar with generation settings:
  - Number of images selector (dropdown)
  - Style consistency toggle
  - Brand color enforcement checkbox (checked by default)
  - "Generate Images" CTA button (yellow)
- Progress indicator during generation (linear progress bar)

### 5. Generated Image Gallery
- Grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
- Each card shows:
  - Generated image with 16:9 aspect ratio
  - Vocabulary term overlay
  - Download button (icon-only, top-right corner)
  - Regenerate button if needed
- Bulk actions: "Download All" button

### 6. Navigation
- Top header bar (navy #051d40):
  - Logo/app name on left
  - "New Project" button
  - User profile/settings icon
  - Height: h-16

### 7. Forms & Inputs
- Consistent input styling:
  - Border: 2px solid #d1d5db
  - Focus: border-#edc437 with subtle shadow
  - Padding: px-4 py-2
  - Rounded: rounded-lg
- Labels above inputs (14px, #051d40, font-medium)

---

## Page Structure

### Main Workflow (Single Page Application)

**Step 1: Upload**
- Centered upload zone (max-w-2xl)
- Brief instruction text above
- Supported format information below

**Step 2: Analysis**
- Split view:
  - Left: Lesson analysis panel (fixed)
  - Right: Scrollable content preview with vocabulary cards
- Fixed footer with "Continue" button

**Step 3: Configuration**
- Header with lesson title
- Grid of vocabulary items with checkboxes (select which to generate)
- Right sidebar: Generation settings panel
- Fixed footer: "Generate X Images" button

**Step 4: Generation & Results**
- Progress overlay during generation
- Grid gallery once complete
- Sidebar: Regeneration options and bulk download

---

## Images

**Hero/Landing:** No large hero image needed - utility-focused tool
**In-App Images:** 
- Generated vocabulary images displayed in gallery cards
- Placeholder illustrations for empty states (upload zone, no files selected)
- Small icons throughout UI (upload, download, settings, vocabulary, etc.)

**Icon Library:** Material Icons via CDN

---

## Interactions & States

**Minimal Animations:**
- Card hover: Subtle lift (shadow increase)
- Button hover: Slight darkening of yellow (#d4b130)
- Progress indicators: Smooth linear animation
- File upload: Drag-over state (background tint #edc437 at 10% opacity)

**Loading States:**
- Skeleton loaders for content preview
- Spinner for AI analysis
- Linear progress for image generation

---

## Accessibility

- High contrast text (#051d40 on #fdfdfd)
- Focus indicators using yellow outline
- Descriptive labels for all form inputs
- Keyboard navigation through entire workflow
- Alt text for generated images using vocabulary terms
- ARIA labels for icon-only buttons