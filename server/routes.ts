import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import Replicate from "replicate";
import type {
  Lesson,
  LessonSection,
  LessonReel,
  Slide,
  GeneratedSlide,
  VocabularySlide,
  GrammarSlide,
  QuizSlide,
  TitleSlide,
  HookSlide,
  ObjectivesSlide,
  SummarySlide,
  OutroSlide,
  ReadingSlide,
  ActivitySlide,
  ExampleSlide,
  AnswerSlide,
} from "@shared/schema";

// OpenRouter client (OpenAI-compatible API)
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Replicate client for image generation
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

// Helper to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Classify section type based on keywords
function classifySection(section: LessonSection): string {
  const type = section.type.toLowerCase();
  const title = section.title.toLowerCase();
  const combined = type + " " + title;

  if (combined.includes("objective") || combined.includes("learning goal")) return "objectives";
  if (combined.includes("vocabulary") || combined.includes("key words")) return "vocabulary";
  if (combined.includes("grammar") || combined.includes("language focus") || combined.includes("structure")) return "grammar";
  if (combined.includes("reading") || combined.includes("passage") || combined.includes("text")) return "reading";
  if (combined.includes("example") || combined.includes("dialogue") || combined.includes("conversation") || combined.includes("sample")) return "example";
  if (combined.includes("activity") || combined.includes("practice") || combined.includes("exercise") || combined.includes("task")) return "activity";
  if (combined.includes("quiz") || combined.includes("assessment") || combined.includes("check") || combined.includes("test")) return "quiz";
  if (combined.includes("summary") || combined.includes("review") || combined.includes("wrap")) return "summary";
  if (combined.includes("introduction") || combined.includes("warm")) return "intro";

  // Default: if it has content, treat as reading/content slide
  if (section.content || section.paragraphs) return "content";
  return "other";
}

// Map lesson sections to slide blueprints
function lessonToSlides(lesson: Lesson): Slide[] {
  const slides: Slide[] = [];
  let sequence = 0;
  const processedSections = new Set<number>();

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

  // 2. Hook slide - attention grabbing opening
  const hookSlide: HookSlide = {
    id: generateId(),
    type: "hook",
    sequence: sequence++,
    requiresImage: true,
    hookText: `Ready to master ${lesson.topic}? Let's go! 🚀`,
    hookType: "teaser",
  };
  slides.push(hookSlide);

  // 2. Extract objectives from sections
  const objectivesIdx = lesson.content.sections.findIndex(s => classifySection(s) === "objectives");
  if (objectivesIdx !== -1) {
    const section = lesson.content.sections[objectivesIdx];
    processedSections.add(objectivesIdx);

    if (section.content) {
      const objectives = section.content
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
  }

  // 3. Process each section
  for (let i = 0; i < lesson.content.sections.length; i++) {
    if (processedSections.has(i)) continue;

    const section = lesson.content.sections[i];
    const category = classifySection(section);

    switch (category) {
      case "vocabulary":
        if (section.words) {
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
        break;

      case "grammar":
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
        break;

      case "reading":
      case "content":
        const readingContent = section.paragraphs?.join(" ") || section.content || "";
        if (readingContent) {
          const readingSlide: ReadingSlide = {
            id: generateId(),
            type: "reading",
            sequence: sequence++,
            requiresImage: true,
            title: section.title,
            content: readingContent.substring(0, 400),
          };
          slides.push(readingSlide);
        }
        break;

      case "example":
        const exampleContent = section.paragraphs?.join(" ") || section.content || "";
        if (exampleContent) {
          const exampleSlide: ExampleSlide = {
            id: generateId(),
            type: "example",
            sequence: sequence++,
            requiresImage: true,
            context: section.title,
            sentence: exampleContent.substring(0, 300),
            highlight: section.targetVocabulary?.[0],
          };
          slides.push(exampleSlide);
        }
        break;

      case "activity":
        // Skip activity slides - not necessary for visual reels
        break;

      case "quiz":
        if (section.questions) {
          section.questions.slice(0, 5).forEach((questionData: unknown, idx: number) => {
            // Handle both string and object question formats
            let questionText: string;
            let questionOptions: string[] | undefined;
            let correctAnswer: string | undefined;

            if (typeof questionData === 'object' && questionData !== null) {
              const qObj = questionData as { question?: string; options?: string[]; answer?: string };
              questionText = qObj.question || JSON.stringify(questionData);
              questionOptions = qObj.options;
              correctAnswer = qObj.answer;
            } else {
              questionText = String(questionData);
            }

            // Quiz question slide
            const quizSlide: QuizSlide = {
              id: generateId(),
              type: "quiz",
              sequence: sequence++,
              requiresImage: false,
              questionNumber: idx + 1,
              totalQuestions: Math.min(section.questions!.length, 5),
              question: questionText,
              options: questionOptions,
            };
            slides.push(quizSlide);

            // Answer reveal slide (follows each question)
            const answerSlide: AnswerSlide = {
              id: generateId(),
              type: "answer",
              sequence: sequence++,
              requiresImage: false,
              questionNumber: idx + 1,
              correctAnswer: correctAnswer || "See the correct answer!",
              explanation: `Great job thinking about this question!`,
            };
            slides.push(answerSlide);
          });
        }
        break;

      case "intro":
        // Skip intro sections - content covered by title
        break;

      default:
        // For unclassified sections with content, create a reading slide
        if (section.content || section.paragraphs) {
          const fallbackContent = section.paragraphs?.join(" ") || section.content || "";
          if (fallbackContent.length > 20) {
            const readingSlide: ReadingSlide = {
              id: generateId(),
              type: "reading",
              sequence: sequence++,
              requiresImage: true,
              title: section.title,
              content: fallbackContent.substring(0, 400),
            };
            slides.push(readingSlide);
          }
        }
        break;
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

        case "example":
          promptContent = `Create an image prompt for an example/dialogue illustration:
Context: "${slide.context}"
Content: "${slide.sentence.substring(0, 150)}"
${slide.highlight ? `Key word to highlight: "${slide.highlight}"` : ""}
Create an illustration showing this scenario or dialogue situation in action.`;
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

      const response = await openrouter.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptContent },
        ],
        max_tokens: 200,
      });

      const prompt = response.choices[0]?.message?.content || null;

      res.json({ prompt, slideId: slide.id });
    } catch (error) {
      console.error("Error generating slide prompt:", error);
      res.status(500).json({ error: "Failed to generate prompt" });
    }
  });

  // Generate image for a slide with retry logic for rate limits
  app.post("/api/generate-slide-image", async (req, res) => {
    try {
      const { prompt, slideId } = req.body as { prompt: string; slideId: string };

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const enhancedPrompt = `${prompt}

Style: Clean, modern educational illustration with a minimalist aesthetic. Warm golden yellow and deep navy blue as accent colors. Light off-white background. No text, no words, no letters in the image. Vertical format, high quality, professional illustration for social media educational content.`;

      // Retry logic for rate limiting (429 errors)
      const maxRetries = 5;
      let lastError: any;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Wait before retrying (exponential backoff starting at 10s)
          if (attempt > 0) {
            const delay = Math.min(10000 * Math.pow(1.5, attempt), 30000);
            console.log(`Retry attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          // Use Replicate's google/imagen-4-fast model for fast image generation
          const prediction = await replicate.predictions.create({
            model: "google/imagen-4-fast",
            input: {
              prompt: enhancedPrompt,
              aspect_ratio: "9:16",
              output_format: "png",
              enable_prompt_rewriting: false,
              safety_filter_level: "block_medium_and_above",
            }
          });

          // Wait for the prediction to complete
          let completedPrediction = await replicate.predictions.get(prediction.id);
          while (completedPrediction.status !== "succeeded" && completedPrediction.status !== "failed") {
            await new Promise(resolve => setTimeout(resolve, 1000));
            completedPrediction = await replicate.predictions.get(prediction.id);
          }

          if (completedPrediction.status === "failed") {
            console.error("Prediction failed:", completedPrediction.error);
            return res.status(500).json({ error: "Image generation failed" });
          }

          const output = completedPrediction.output;
          console.log("Replicate output:", JSON.stringify(output, null, 2));

          // Handle different output formats from Replicate
          let imageUrl: string;
          if (typeof output === 'string') {
            imageUrl = output;
          } else if (Array.isArray(output) && output.length > 0) {
            imageUrl = output[0];
          } else {
            console.error("Unexpected output format:", output);
            return res.status(500).json({ error: "Unexpected image output format" });
          }

          // Fetch the image and convert to base64
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString('base64');
          const imageData = `data:image/png;base64,${base64}`;

          return res.json({ imageData, slideId, prompt });
        } catch (error: any) {
          lastError = error;
          // Check if it's a rate limit error (429)
          if (error?.response?.status === 429 || error?.message?.includes('429')) {
            console.log(`Rate limited, will retry... (attempt ${attempt + 1}/${maxRetries})`);
            continue;
          }
          // For other errors, don't retry
          throw error;
        }
      }

      // All retries exhausted
      console.error("All retries exhausted for image generation:", lastError);
      res.status(500).json({ error: "Failed to generate image after retries" });
    } catch (error) {
      console.error("Error generating slide image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Rewrite reading text using Kimi K2 to include all vocabulary
  app.post("/api/rewrite-reading-text", async (req, res) => {
    try {
      const { lesson } = req.body as { lesson: Lesson };

      if (!lesson) {
        return res.status(400).json({ error: "Lesson data is required" });
      }

      // Extract all vocabulary terms
      const vocabularyWords = lesson.content.sections
        .flatMap(s => s.words || []);

      const vocabList = vocabularyWords.map(w =>
        `- ${w.term} (${w.partOfSpeech}): ${w.definition}`
      ).join("\n");

      const vocabTerms = vocabularyWords.map(w => w.term).join(", ");

      const prompt = `You are an expert ESL content writer. Write a VERY SHORT reading passage for a ${lesson.cefrLevel} level ESL lesson about "${lesson.topic}".

CRITICAL REQUIREMENTS:
1. Write exactly 2 SHORT paragraphs (each paragraph MUST be only 2-3 sentences, MAX 30 words each)
2. You MUST naturally incorporate ALL of these vocabulary words: ${vocabTerms}
3. Keep it simple and engaging for ${lesson.cefrLevel} learners
4. The topic is: ${lesson.topic}

VOCABULARY TO USE (you must use every word):
${vocabList}

IMPORTANT: 
- Each paragraph MUST be under 30 words - this is critical for fitting on mobile slides
- Use simple, short sentences
- Distribute vocabulary words between both paragraphs

Respond with ONLY a JSON object in this exact format:
{
  "paragraph1": "Short paragraph here (max 30 words)...",
  "paragraph2": "Short paragraph here (max 30 words)..."
}`;

      const response = await openrouter.chat.completions.create({
        model: "moonshotai/kimi-k2",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "";

      // Parse the JSON response
      let paragraphs;
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          paragraphs = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse Kimi K2 response:", content);
        // Fallback: split by double newline or create default
        const parts = content.split(/\n\n+/).filter(p => p.trim().length > 20);
        paragraphs = {
          paragraph1: parts[0] || `Learning about ${lesson.topic} helps us understand important concepts.`,
          paragraph2: parts[1] || `These vocabulary words are useful in everyday situations.`,
        };
      }

      res.json({
        paragraph1: paragraphs.paragraph1,
        paragraph2: paragraphs.paragraph2,
        vocabularyUsed: vocabTerms,
      });
    } catch (error) {
      console.error("Error rewriting reading text:", error);
      res.status(500).json({ error: "Failed to rewrite reading text" });
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

      const response = await openrouter.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: contextPrompt }],
        max_tokens: 200,
      });

      const context = response.choices[0]?.message?.content ||
        `ESL lesson about ${lesson.topic} for ${lesson.cefrLevel} learners.`;

      res.json({ context });
    } catch (error) {
      console.error("Error generating context:", error);
      res.status(500).json({ error: "Failed to generate context" });
    }
  });

  // Generate voiceover script for the reel
  app.post("/api/generate-script", async (req, res) => {
    try {
      const { reel, tone = "professional" } = req.body as {
        reel: LessonReel;
        tone?: "professional" | "casual" | "fun";
      };

      if (!reel) {
        return res.status(400).json({ error: "Reel data is required" });
      }

      const { generateVoiceoverScript, generateScriptText, generateSRT } = await import("./scriptGenerator");

      const script = await generateVoiceoverScript(reel, tone);
      const scriptText = generateScriptText(script);
      const srtContent = generateSRT(script);

      res.json({
        script,
        scriptText,
        srtContent,
      });
    } catch (error) {
      console.error("Error generating script:", error);
      res.status(500).json({ error: "Failed to generate script" });
    }
  });

  // Generate AI-enhanced script with engagement optimization
  app.post("/api/enhance-script", async (req, res) => {
    try {
      const { script, cefrLevel, tone = "professional" } = req.body as {
        script: any;
        cefrLevel: string;
        tone?: "professional" | "casual" | "fun";
      };

      if (!script) {
        return res.status(400).json({ error: "Script data is required" });
      }

      const { enhanceScriptWithAI, generateScriptText, generateSRT } = await import("./scriptGenerator");

      const enhancedScript = await enhanceScriptWithAI(script, cefrLevel, tone);
      const scriptText = generateScriptText(enhancedScript);
      const srtContent = generateSRT(enhancedScript);

      res.json({
        script: enhancedScript,
        scriptText,
        srtContent,
      });
    } catch (error) {
      console.error("Error enhancing script:", error);
      res.status(500).json({ error: "Failed to enhance script" });
    }
  });

  return httpServer;
}
