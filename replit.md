# Lesson to Reels - Social Media Image Generator

## Overview
A web application that transforms lesson JSON files into branded social media images. Users can upload lesson content, have AI analyze the vocabulary and context, and generate educational illustrations using the nano banana (Gemini) image generation model.

## Architecture

### Frontend (React + Vite)
- **Main Page**: `/client/src/pages/home.tsx` - Multi-step workflow (Upload → Analysis → Generate → Results)
- **Styling**: Brand colors #edc437 (yellow), #051d40 (navy), #fdfdfd (off-white)
- **Components**: Uses shadcn/ui components

### Backend (Express)
- **Routes**: `/server/routes.ts` - API endpoints for lesson analysis and image generation
- **AI Integrations**: 
  - OpenAI (gpt-5.1) for content analysis and smart prompt generation
  - Gemini (gemini-2.5-flash-image / nano banana) for image generation

### Shared Types
- **Schema**: `/shared/schema.ts` - TypeScript types for lessons, vocabulary, and generated images

## Key Features
1. **File Upload**: Drag-and-drop JSON lesson files
2. **AI Lesson Analysis**: Extracts vocabulary and generates contextual summaries
3. **Smart Prompt Generation**: Creates enhanced image prompts based on lesson context
4. **Branded Image Generation**: Uses nano banana to create consistent, branded illustrations
5. **Bulk Download**: Download all generated images at once

## API Endpoints

### POST /api/analyze-lesson
Analyzes a lesson JSON and extracts vocabulary with AI-generated context.

### POST /api/generate-smart-prompts
Creates enhanced image prompts using lesson context and brand guidelines.

### POST /api/generate-vocab-image
Generates a single vocabulary image using Gemini nano banana.

## Brand Colors
- Primary: #edc437 (Golden Yellow) - CTAs, highlights
- Secondary: #051d40 (Navy Blue) - Headers, text
- Background: #fdfdfd (Off-White) - Clean backgrounds

## Development
```bash
npm run dev  # Start development server on port 5000
```

## Recent Changes
- Initial implementation of lesson-to-image workflow
- Integrated OpenAI for content analysis
- Integrated Gemini nano banana for image generation
- Built complete 4-step UI workflow
