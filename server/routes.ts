import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { Modality } from "@google/genai";
import { gemini } from "./replit_integrations/image/client";
import { batchProcess } from "./replit_integrations/batch";
import type { Lesson, VocabularyWord, SmartPromptResult } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Analyze lesson and extract vocabulary
  app.post("/api/analyze-lesson", async (req, res) => {
    try {
      const { lesson } = req.body as { lesson: Lesson };
      
      if (!lesson) {
        return res.status(400).json({ error: "Lesson data is required" });
      }

      if (!lesson.title || !lesson.content?.sections) {
        return res.status(400).json({ error: "Invalid lesson format. Expected title and content.sections" });
      }

      // Extract vocabulary words from sections
      const vocabulary: VocabularyWord[] = [];
      const sections: { type: string; title: string }[] = [];

      for (const section of lesson.content.sections) {
        sections.push({ type: section.type, title: section.title });
        
        if (section.words) {
          vocabulary.push(...section.words);
        }
      }

      // Generate lesson context using AI
      const contextPrompt = `Analyze this lesson and provide a brief context summary (2-3 sentences) that captures the main theme, learning objectives, and key concepts. This context will be used to generate relevant educational images.

Lesson Title: ${lesson.title}
Topic: ${lesson.topic}
Level: ${lesson.cefrLevel}
Sections: ${sections.map(s => s.title).join(", ")}
Vocabulary: ${vocabulary.map(v => `${v.term} (${v.definition})`).join("; ")}

Provide only the context summary, no additional formatting.`;

      const contextResponse = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: contextPrompt }],
        max_completion_tokens: 300,
      });

      const lessonContext = contextResponse.choices[0]?.message?.content || 
        `This is a ${lesson.cefrLevel} level lesson about ${lesson.title}, focusing on vocabulary related to ${lesson.topic}`;

      res.json({
        title: lesson.title,
        level: lesson.cefrLevel,
        topic: lesson.topic.trim(),
        vocabularyCount: vocabulary.length,
        sectionCount: sections.length,
        sections,
        vocabulary,
        lessonContext,
      });
    } catch (error) {
      console.error("Error analyzing lesson:", error);
      res.status(500).json({ error: "Failed to analyze lesson" });
    }
  });

  // Generate smart prompts with context
  app.post("/api/generate-smart-prompts", async (req, res) => {
    try {
      const { vocabulary, lessonContext, brandColors } = req.body as {
        vocabulary: VocabularyWord[];
        lessonContext: string;
        brandColors: { primary: string; secondary: string; background: string };
      };

      if (!vocabulary || vocabulary.length === 0) {
        return res.status(400).json({ error: "Vocabulary is required" });
      }

      const systemPrompt = `You are an expert educational content designer. Create image generation prompts for vocabulary flashcards that will be used on social media (Instagram Reels style).

BRAND GUIDELINES:
- Primary color: ${brandColors.primary} (golden yellow) - use for accents, highlights
- Secondary color: ${brandColors.secondary} (navy blue) - use for text overlays, borders
- Background: ${brandColors.background} (off-white) - clean backgrounds

LESSON CONTEXT:
${lessonContext}

STYLE REQUIREMENTS:
- Clean, modern illustration style (not photorealistic)
- Consistent visual language across all images
- Educational but visually engaging
- Include visual metaphors that represent the word meaning
- Suitable for language learners
- No text in the image itself (text will be overlaid separately)
- Square aspect ratio (1:1) optimized for social media
- Bright, clear imagery with good contrast

For each vocabulary word, create an enhanced image prompt that:
1. Captures the essence of the word's meaning
2. Relates to the overall lesson context when relevant
3. Uses visual storytelling to aid memory
4. Specifies the illustration style consistently
5. Mentions the brand colors where appropriate (as accent colors in the scene)`;

      const prompts = await batchProcess(
        vocabulary,
        async (word) => {
          const userPrompt = `Create an image generation prompt for the vocabulary word:

Word: ${word.term}
Part of Speech: ${word.partOfSpeech}
Definition: ${word.definition}
Example sentence: ${word.example}
${word.collocations ? `Common uses: ${word.collocations.join(", ")}` : ""}
${word.semanticMap?.contexts ? `Contexts: ${word.semanticMap.contexts.join(", ")}` : ""}
${word.imagePrompt ? `Original prompt idea: ${word.imagePrompt}` : ""}

Respond with ONLY the enhanced image prompt, nothing else. The prompt should be 2-4 sentences describing the scene in detail.`;

          const response = await openai.chat.completions.create({
            model: "gpt-5.1",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_completion_tokens: 200,
          });

          return {
            term: word.term,
            originalPrompt: word.imagePrompt,
            enhancedPrompt: response.choices[0]?.message?.content || word.imagePrompt || `Educational illustration representing "${word.term}" meaning "${word.definition}"`,
            definition: word.definition,
            example: word.example,
          } as SmartPromptResult;
        },
        { concurrency: 3, retries: 3 }
      );

      res.json(prompts);
    } catch (error) {
      console.error("Error generating smart prompts:", error);
      res.status(500).json({ error: "Failed to generate smart prompts" });
    }
  });

  // Generate vocabulary image
  app.post("/api/generate-vocab-image", async (req, res) => {
    try {
      const { prompt, term, definition, example } = req.body as {
        prompt: string;
        term: string;
        definition: string;
        example: string;
      };

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Enhance prompt with brand styling
      const enhancedPrompt = `${prompt}

Style: Clean, modern educational illustration with a minimalist aesthetic. Use golden yellow (#edc437) and navy blue (#051d40) as accent colors in the scene. Off-white background (#fdfdfd). No text in the image. Square format, high quality, professional illustration suitable for social media educational content.`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(
        (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
      );

      if (!imagePart?.inlineData?.data) {
        return res.status(500).json({ error: "No image data in response" });
      }

      const mimeType = imagePart.inlineData.mimeType || "image/png";
      const imageData = `data:${mimeType};base64,${imagePart.inlineData.data}`;

      res.json({ imageData, term, definition, example });
    } catch (error) {
      console.error("Error generating vocab image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  return httpServer;
}
