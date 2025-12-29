# Lesson to Reels - Visual ESL Lesson Generator

## Overview
A web application that transforms lesson JSON files into branded visual social media reels. Users upload ESL lesson content, and the app creates a complete slide-based visual lesson that learners can scroll through like Instagram/TikTok reels.

## Architecture

### Frontend (React + Vite)
- **Main Page**: `/client/src/pages/home.tsx` - 4-step workflow (Upload → Preview → Generating → Results)
- **Slide Types**: Title, Objectives, Vocabulary, Grammar, Reading, Activity, Quiz, Summary, Outro
- **Brand Colors**: #edc437 (yellow), #051d40 (navy), #fdfdfd (off-white)
- **Components**: shadcn/ui components with branded styling

### Backend (Express)
- **Routes**: `/server/routes.ts` - API endpoints for lesson-to-slides conversion and image generation
- **AI Integrations**: 
  - OpenAI (gpt-5.1) for lesson context analysis and smart prompt generation
  - Gemini (gemini-2.5-flash-image / nano banana) for branded illustration generation

### Shared Types
- **Schema**: `/shared/schema.ts` - Comprehensive slide types for visual lesson reels

## Key Features
1. **Lesson Upload**: Drag-and-drop JSON lesson files
2. **Slide Blueprint Generation**: Automatically maps lesson sections to appropriate slide types
3. **Visual Slides**: AI-generated illustrations for title, vocabulary, grammar, and reading slides
4. **Text-Only Slides**: Branded text layouts for objectives, activities, quizzes, and summaries
5. **Reel Preview**: Scrollable slide-by-slide preview with navigation
6. **Batch Download**: Export all slides as images

## Slide Types

| Type | Requires Image | Content |
|------|----------------|---------|
| Title | Yes | Lesson name, level, topic with hero illustration |
| Objectives | No | Learning goals in branded text layout |
| Vocabulary | Yes | Word, definition, example with AI illustration |
| Grammar | Yes | Concept explanation with visual metaphor |
| Reading | Yes | Passage content with atmospheric illustration |
| Activity | No | Instructions and target vocabulary |
| Quiz | No | Question and options in branded layout |
| Summary | No | Key vocabulary recap |
| Outro | Yes | Completion message with celebratory illustration |

## API Endpoints

### POST /api/lesson-to-slides
Converts lesson JSON to slide blueprints with type-specific layouts.

### POST /api/generate-lesson-context
Creates AI-generated context summary for consistent image prompts.

### POST /api/generate-slide-prompt
Generates enhanced image prompts for visual slides.

### POST /api/generate-slide-image
Creates branded illustrations using Gemini nano banana.

## Brand Colors
- Primary: #edc437 (Golden Yellow) - Accents, highlights, CTAs
- Secondary: #051d40 (Navy Blue) - Headers, text overlays, borders
- Background: #fdfdfd (Off-White) - Clean backgrounds

## Development
```bash
npm run dev  # Start development server on port 5000
```

## Recent Changes
- Pivoted from vocabulary-only images to complete visual lesson reels
- Added 10 distinct slide types with appropriate layouts
- Implemented slide-by-slide preview with navigation
- Added batch image generation with progress tracking
- Branded text layouts for non-visual slides (quizzes, activities)
