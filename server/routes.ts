import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { Modality } from "@google/genai";
import { gemini } from "./replit_integrations/image/client";
import { batchProcess } from "./replit_integrations/batch";
import type { 
  Lesson, 
  LessonSection,
  Slide, 
  GeneratedSlide,
  VocabularySlide,
  GrammarSlide,
  QuizSlide,
  TitleSlide,
  ObjectivesSlide,
  SummarySlide,
  OutroSlide,
  ReadingSlide,
  ActivitySlide,
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Helper to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Map lesson sections to slide blueprints
function lessonToSlides(lesson: Lesson): Slide[] {
  const slides: Slide[] = [];
  let sequence = 0;

  // 1. Title slide
  const titleSlide: TitleSlide = {
    id: generateId(),
    type: "title",
    sequence: sequence++,
    requiresImage: true,
    title: lesson.title,
    subtitle: lesson.content.focus,
    level: lesson.cefrLevel,
    topic: lesson.topic,
  };
  slides.push(titleSlide);

  // 2. Extract objectives from sections
  const objectivesSection = lesson.content.sections.find(s => 
    s.type.toLowerCase().includes("objective") || 
    s.type.toLowerCase().includes("learning goal") ||
    s.title.toLowerCase().includes("objective")
  );
  
  if (objectivesSection && objectivesSection.content) {
    const objectives = objectivesSection.content
      .split(/[\n•\-]/)
      .map(o => o.trim())
      .filter(o => o.length > 10);
    
    if (objectives.length > 0) {
      const objectivesSlide: ObjectivesSlide = {
        id: generateId(),
        type: "objectives",
        sequence: sequence++,
        requiresImage: false,
        title: "What You'll Learn",
        objectives: objectives.slice(0, 4),
      };
      slides.push(objectivesSlide);
    }
  }

  // 3. Process each section
  for (const section of lesson.content.sections) {
    const sectionType = section.type.toLowerCase();

    // Vocabulary sections
    if (sectionType.includes("vocabulary") && section.words) {
      for (const word of section.words) {
        const vocabSlide: VocabularySlide = {
          id: generateId(),
          type: "vocabulary",
          sequence: sequence++,
          requiresImage: true,
          term: word.term,
          partOfSpeech: word.partOfSpeech,
          definition: word.definition,
          example: word.example,
          pronunciation: word.pronunciation?.phoneticGuide,
          imagePrompt: word.imagePrompt,
        };
        slides.push(vocabSlide);
      }
    }

    // Grammar/explanation sections
    if (sectionType.includes("grammar") || sectionType.includes("explanation") || sectionType.includes("focus")) {
      if (section.content) {
        const grammarSlide: GrammarSlide = {
          id: generateId(),
          type: "grammar",
          sequence: sequence++,
          requiresImage: true,
          title: section.title,
          explanation: section.content.substring(0, 300),
          examples: section.paragraphs?.slice(0, 2),
        };
        slides.push(grammarSlide);
      }
    }

    // Reading sections
    if (sectionType.includes("reading") || sectionType.includes("passage") || sectionType.includes("text")) {
      if (section.paragraphs && section.paragraphs.length > 0) {
        const readingSlide: ReadingSlide = {
          id: generateId(),
          type: "reading",
          sequence: sequence++,
          requiresImage: true,
          title: section.title,
          content: section.paragraphs.slice(0, 2).join(" ").substring(0, 400),
        };
        slides.push(readingSlide);
      }
    }

    // Activity sections
    if (sectionType.includes("activity") || sectionType.includes("practice") || sectionType.includes("exercise")) {
      const activitySlide: ActivitySlide = {
        id: generateId(),
        type: "activity",
        sequence: sequence++,
        requiresImage: false,
        title: section.title,
        instructions: section.procedure || section.content || "Complete the following activity.",
        targetVocabulary: section.targetVocabulary,
      };
      slides.push(activitySlide);
    }

    // Quiz sections
    if (sectionType.includes("quiz") || sectionType.includes("assessment") || sectionType.includes("check")) {
      if (section.questions) {
        section.questions.slice(0, 5).forEach((question, idx) => {
          const quizSlide: QuizSlide = {
            id: generateId(),
            type: "quiz",
            sequence: sequence++,
            requiresImage: false,
            questionNumber: idx + 1,
            totalQuestions: Math.min(section.questions!.length, 5),
            question: question,
          };
          slides.push(quizSlide);
        });
      }
    }
  }

  // 4. Summary slide
  const vocabularyTerms = slides
    .filter((s): s is VocabularySlide => s.type === "vocabulary")
    .map(s => s.term);
  
  if (vocabularyTerms.length > 0) {
    const summarySlide: SummarySlide = {
      id: generateId(),
      type: "summary",
      sequence: sequence++,
      requiresImage: false,
      title: "Key Vocabulary",
      keyPoints: vocabularyTerms.slice(0, 6),
    };
    slides.push(summarySlide);
  }

  // 5. Outro slide
  const outroSlide: OutroSlide = {
    id: generateId(),
    type: "outro",
    sequence: sequence++,
    requiresImage: true,
    message: `Great job learning about ${lesson.topic}!`,
    callToAction: "Follow for more lessons!",
  };
  slides.push(outroSlide);

  return slides;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Convert lesson to slide blueprints
  app.post("/api/lesson-to-slides", async (req, res) => {
    try {
      const { lesson } = req.body as { lesson: Lesson };
      
      if (!lesson) {
        return res.status(400).json({ error: "Lesson data is required" });
      }

      if (!lesson.title || !lesson.content?.sections) {
        return res.status(400).json({ error: "Invalid lesson format" });
      }

      const slides = lessonToSlides(lesson);

      res.json({
        lessonId: lesson.id,
        title: lesson.title,
        level: lesson.cefrLevel,
        topic: lesson.topic,
        totalSlides: slides.length,
        slides: slides.map(slide => ({ slide, imageData: undefined, imagePrompt: undefined })),
      });
    } catch (error) {
      console.error("Error converting lesson to slides:", error);
      res.status(500).json({ error: "Failed to convert lesson to slides" });
    }
  });

  // Generate image prompt for a slide
  app.post("/api/generate-slide-prompt", async (req, res) => {
    try {
      const { slide, lessonContext } = req.body as { 
        slide: Slide; 
        lessonContext: string;
      };

      if (!slide) {
        return res.status(400).json({ error: "Slide data is required" });
      }

      let promptContent = "";
      
      switch (slide.type) {
        case "title":
          promptContent = `Create an image prompt for a lesson title slide:
Title: "${slide.title}"
Topic: ${slide.topic}
Level: ${slide.level}
The image should be a hero illustration that captures the essence of the lesson topic, inviting and educational.`;
          break;
          
        case "vocabulary":
          promptContent = `Create an image prompt for a vocabulary flashcard:
Word: "${slide.term}"
Part of Speech: ${slide.partOfSpeech}
Definition: ${slide.definition}
Example: "${slide.example}"
Create a visual that clearly represents the word's meaning in an educational context.`;
          break;
          
        case "grammar":
          promptContent = `Create an image prompt for a grammar/concept explanation:
Topic: "${slide.title}"
Explanation: ${slide.explanation}
Create a visual metaphor or diagram-style illustration that helps explain this concept.`;
          break;

        case "reading":
          promptContent = `Create an image prompt for a reading passage illustration:
Title: "${slide.title}"
Content preview: ${slide.content.substring(0, 150)}
Create an atmospheric illustration that sets the scene for this reading content.`;
          break;
          
        case "outro":
          promptContent = `Create an image prompt for a lesson outro/completion slide:
Message: "${slide.message}"
Create a celebratory, encouraging illustration for completing the lesson.`;
          break;
          
        default:
          return res.json({ prompt: null, requiresImage: false });
      }

      const systemPrompt = `You are an expert educational content designer creating image prompts for social media lesson reels.

BRAND GUIDELINES:
- Primary color: #edc437 (golden yellow) - use for accents, highlights
- Secondary color: #051d40 (navy blue) - for contrast elements
- Background: #fdfdfd (off-white) - clean backgrounds

LESSON CONTEXT: ${lessonContext}

STYLE REQUIREMENTS:
- Clean, modern illustration style (not photorealistic)
- Consistent visual language
- Educational but visually engaging
- No text in the image (text overlaid separately)
- Square aspect ratio (1:1) for social media
- Bright, clear imagery with good contrast
- Professional quality suitable for Instagram/TikTok

Respond with ONLY the image generation prompt, 2-4 sentences describing the scene in detail.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptContent },
        ],
        max_completion_tokens: 200,
      });

      const prompt = response.choices[0]?.message?.content || null;
      
      res.json({ prompt, slideId: slide.id });
    } catch (error) {
      console.error("Error generating slide prompt:", error);
      res.status(500).json({ error: "Failed to generate prompt" });
    }
  });

  // Generate image for a slide
  app.post("/api/generate-slide-image", async (req, res) => {
    try {
      const { prompt, slideId } = req.body as { prompt: string; slideId: string };

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const enhancedPrompt = `${prompt}

Style: Clean, modern educational illustration with a minimalist aesthetic. Use golden yellow (#edc437) and navy blue (#051d40) as accent colors. Off-white background (#fdfdfd). No text in the image. Square format, high quality, professional illustration for social media educational content.`;

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

      res.json({ imageData, slideId, prompt });
    } catch (error) {
      console.error("Error generating slide image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Generate lesson context
  app.post("/api/generate-lesson-context", async (req, res) => {
    try {
      const { lesson } = req.body as { lesson: Lesson };
      
      if (!lesson) {
        return res.status(400).json({ error: "Lesson data is required" });
      }

      const vocabulary = lesson.content.sections
        .flatMap(s => s.words || [])
        .map(w => `${w.term}: ${w.definition}`)
        .join("; ");

      const contextPrompt = `Analyze this ESL lesson and provide a brief context summary (2-3 sentences) for generating educational illustrations.

Lesson: ${lesson.title}
Topic: ${lesson.topic}
Level: ${lesson.cefrLevel}
Vocabulary: ${vocabulary}

Provide only the context summary.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: contextPrompt }],
        max_completion_tokens: 200,
      });

      const context = response.choices[0]?.message?.content || 
        `ESL lesson about ${lesson.topic} for ${lesson.cefrLevel} learners.`;

      res.json({ context });
    } catch (error) {
      console.error("Error generating context:", error);
      res.status(500).json({ error: "Failed to generate context" });
    }
  });

  return httpServer;
}
