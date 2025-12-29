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

// User schema for compatibility
export const users = {
  $inferSelect: {} as { id: string; username: string; password: string },
};
export type User = typeof users.$inferSelect;
export type InsertUser = { username: string; password: string };
