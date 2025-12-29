import { z } from "zod";

// Vocabulary word schema
export const vocabularyWordSchema = z.object({
  term: z.string(),
  partOfSpeech: z.string(),
  definition: z.string(),
  example: z.string(),
  semanticGroup: z.string().optional(),
  additionalExamples: z.array(z.string()).optional(),
  wordFamily: z.object({
    words: z.array(z.string()),
    description: z.string(),
  }).optional(),
  collocations: z.array(z.string()).optional(),
  usageNotes: z.string().optional(),
  teachingTips: z.string().optional(),
  pronunciation: z.object({
    syllables: z.array(z.string()),
    stressIndex: z.number(),
    phoneticGuide: z.string(),
  }).optional(),
  imagePrompt: z.string().optional(),
  semanticMap: z.object({
    synonyms: z.array(z.string()).optional(),
    antonyms: z.array(z.string()).optional(),
    relatedConcepts: z.array(z.string()).optional(),
    contexts: z.array(z.string()).optional(),
    associatedWords: z.array(z.string()).optional(),
  }).optional(),
});

export type VocabularyWord = z.infer<typeof vocabularyWordSchema>;

// Lesson section schema
export const lessonSectionSchema = z.object({
  type: z.string(),
  title: z.string(),
  content: z.string().optional(),
  questions: z.array(z.string()).optional(),
  targetVocabulary: z.array(z.string()).optional(),
  procedure: z.string().optional(),
  teacherNotes: z.string().optional(),
  introduction: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  words: z.array(vocabularyWordSchema).optional(),
});

export type LessonSection = z.infer<typeof lessonSectionSchema>;

// Full lesson schema
export const lessonSchema = z.object({
  id: z.number(),
  title: z.string(),
  topic: z.string(),
  cefrLevel: z.string(),
  content: z.object({
    title: z.string(),
    level: z.string(),
    focus: z.string().optional(),
    estimatedTime: z.number().optional(),
    sections: z.array(lessonSectionSchema),
  }),
});

export type Lesson = z.infer<typeof lessonSchema>;

// Generated image schema
export const generatedImageSchema = z.object({
  term: z.string(),
  prompt: z.string(),
  imageData: z.string(),
  definition: z.string(),
  example: z.string(),
});

export type GeneratedImage = z.infer<typeof generatedImageSchema>;

// Analysis result schema
export const lessonAnalysisSchema = z.object({
  title: z.string(),
  level: z.string(),
  topic: z.string(),
  vocabularyCount: z.number(),
  sectionCount: z.number(),
  sections: z.array(z.object({
    type: z.string(),
    title: z.string(),
  })),
  vocabulary: z.array(vocabularyWordSchema),
  lessonContext: z.string(),
});

export type LessonAnalysis = z.infer<typeof lessonAnalysisSchema>;

// Smart prompt request
export const smartPromptRequestSchema = z.object({
  vocabulary: z.array(vocabularyWordSchema),
  lessonContext: z.string(),
  brandColors: z.object({
    primary: z.string(),
    secondary: z.string(),
    background: z.string(),
  }),
});

export type SmartPromptRequest = z.infer<typeof smartPromptRequestSchema>;

// Smart prompt result
export const smartPromptResultSchema = z.object({
  term: z.string(),
  originalPrompt: z.string().optional(),
  enhancedPrompt: z.string(),
  definition: z.string(),
  example: z.string(),
});

export type SmartPromptResult = z.infer<typeof smartPromptResultSchema>;

// Slide types for visual lesson reel
export type SlideType = 
  | "title"           // Opening slide with lesson title
  | "objectives"      // Learning objectives
  | "vocabulary"      // Individual vocab word with illustration
  | "grammar"         // Grammar/concept explanation with illustration
  | "example"         // Example sentence/scenario
  | "reading"         // Reading passage content
  | "activity"        // Interactive activity instructions
  | "quiz"            // Quiz question (text-only, branded)
  | "summary"         // Key takeaways
  | "outro";          // Closing slide

// Base slide blueprint
export const slideBaseSchema = z.object({
  id: z.string(),
  type: z.enum(["title", "objectives", "vocabulary", "grammar", "example", "reading", "activity", "quiz", "summary", "outro"]),
  sequence: z.number(),
  requiresImage: z.boolean(),
});

// Title slide
export const titleSlideSchema = slideBaseSchema.extend({
  type: z.literal("title"),
  title: z.string(),
  subtitle: z.string().optional(),
  level: z.string(),
  topic: z.string(),
});

// Objectives slide  
export const objectivesSlideSchema = slideBaseSchema.extend({
  type: z.literal("objectives"),
  title: z.string(),
  objectives: z.array(z.string()),
});

// Vocabulary slide
export const vocabularySlideSchema = slideBaseSchema.extend({
  type: z.literal("vocabulary"),
  term: z.string(),
  partOfSpeech: z.string(),
  definition: z.string(),
  example: z.string(),
  pronunciation: z.string().optional(),
  imagePrompt: z.string().optional(),
});

// Grammar/concept slide
export const grammarSlideSchema = slideBaseSchema.extend({
  type: z.literal("grammar"),
  title: z.string(),
  explanation: z.string(),
  examples: z.array(z.string()).optional(),
  imagePrompt: z.string().optional(),
});

// Example slide
export const exampleSlideSchema = slideBaseSchema.extend({
  type: z.literal("example"),
  context: z.string(),
  sentence: z.string(),
  highlight: z.string().optional(),
});

// Reading slide
export const readingSlideSchema = slideBaseSchema.extend({
  type: z.literal("reading"),
  title: z.string(),
  content: z.string(),
  part: z.number().optional(),
  totalParts: z.number().optional(),
  imagePrompt: z.string().optional(),
});

// Activity slide
export const activitySlideSchema = slideBaseSchema.extend({
  type: z.literal("activity"),
  title: z.string(),
  instructions: z.string(),
  targetVocabulary: z.array(z.string()).optional(),
});

// Quiz slide
export const quizSlideSchema = slideBaseSchema.extend({
  type: z.literal("quiz"),
  questionNumber: z.number(),
  totalQuestions: z.number(),
  question: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
});

// Summary slide
export const summarySlideSchema = slideBaseSchema.extend({
  type: z.literal("summary"),
  title: z.string(),
  keyPoints: z.array(z.string()),
});

// Outro slide
export const outroSlideSchema = slideBaseSchema.extend({
  type: z.literal("outro"),
  message: z.string(),
  callToAction: z.string().optional(),
});

// Union of all slide types
export const slideSchema = z.discriminatedUnion("type", [
  titleSlideSchema,
  objectivesSlideSchema,
  vocabularySlideSchema,
  grammarSlideSchema,
  exampleSlideSchema,
  readingSlideSchema,
  activitySlideSchema,
  quizSlideSchema,
  summarySlideSchema,
  outroSlideSchema,
]);

export type Slide = z.infer<typeof slideSchema>;
export type TitleSlide = z.infer<typeof titleSlideSchema>;
export type ObjectivesSlide = z.infer<typeof objectivesSlideSchema>;
export type VocabularySlide = z.infer<typeof vocabularySlideSchema>;
export type GrammarSlide = z.infer<typeof grammarSlideSchema>;
export type ExampleSlide = z.infer<typeof exampleSlideSchema>;
export type ReadingSlide = z.infer<typeof readingSlideSchema>;
export type ActivitySlide = z.infer<typeof activitySlideSchema>;
export type QuizSlide = z.infer<typeof quizSlideSchema>;
export type SummarySlide = z.infer<typeof summarySlideSchema>;
export type OutroSlide = z.infer<typeof outroSlideSchema>;

// Slide with generated content
export const generatedSlideSchema = z.object({
  slide: slideSchema,
  imageData: z.string().optional(),
  imagePrompt: z.string().optional(),
});

export type GeneratedSlide = z.infer<typeof generatedSlideSchema>;

// Lesson reel - the complete visual lesson
export const lessonReelSchema = z.object({
  lessonId: z.number(),
  title: z.string(),
  level: z.string(),
  topic: z.string(),
  totalSlides: z.number(),
  slides: z.array(generatedSlideSchema),
});

export type LessonReel = z.infer<typeof lessonReelSchema>;

// User schema for compatibility
export const users = {
  $inferSelect: {} as { id: string; username: string; password: string },
};
export type User = typeof users.$inferSelect;
export type InsertUser = { username: string; password: string };
