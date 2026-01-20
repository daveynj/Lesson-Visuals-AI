import OpenAI from "openai";
import type { LessonReel, Slide, GeneratedSlide } from "@shared/schema";

// OpenRouter client
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Script line with timing and metadata
export interface ScriptLine {
  slideId: string;
  slideNumber: number;
  slideType: string;
  text: string;
  pronunciationHints?: string[];
  suggestedDurationSeconds: number;
  startTimeSeconds: number;
}

// Complete voiceover script
export interface VoiceoverScript {
  lessonTitle: string;
  totalDurationSeconds: number;
  lines: ScriptLine[];
}

// Tone options for script generation
export type ScriptTone = "professional" | "casual" | "fun";

// Estimate reading duration based on word count and slide type
function estimateDuration(text: string, slideType: string): number {
  const wordCount = text.split(/\s+/).length;
  // Average speaking rate: 150 words per minute = 2.5 words per second
  const baseTime = wordCount / 2.5;
  
  // Add extra time for certain slide types
  const typeMultipliers: Record<string, number> = {
    title: 1.5,      // Pause for impact
    vocabulary: 1.3, // Time to absorb new word
    quiz: 2.0,       // Thinking time
    answer: 1.5,     // Reveal moment
    hook: 1.2,       // Attention grabber
    outro: 1.3,      // Call to action
  };
  
  const multiplier = typeMultipliers[slideType] || 1.0;
  return Math.max(2, Math.round(baseTime * multiplier * 10) / 10);
}

// Generate voiceover text for a single slide
function generateSlideText(slide: Slide, tone: ScriptTone): string {
  const toneAdjust = {
    professional: { greeting: "Welcome to", emphasis: "importantly", closing: "Thank you for learning with us." },
    casual: { greeting: "Hey! Let's dive into", emphasis: "seriously", closing: "Thanks for watching!" },
    fun: { greeting: "Get ready for", emphasis: "super", closing: "You crushed it! See you next time!" },
  };
  const t = toneAdjust[tone];

  switch (slide.type) {
    case "title":
      return `${t.greeting} today's lesson: ${slide.title}. We'll be exploring ${slide.topic} at the ${slide.level} level.`;
    
    case "hook":
      return (slide as any).hookText || "Here's something interesting to think about...";
    
    case "objectives":
      const objectives = slide.objectives.join(". ");
      return `By the end of this lesson, you will be able to: ${objectives}`;
    
    case "vocabulary":
      return `Our next word is "${slide.term}". It's a ${slide.partOfSpeech}. ${slide.definition}. For example: "${slide.example}"`;
    
    case "grammar":
      return `Let's look at ${slide.title}. ${slide.explanation}${slide.examples?.[0] ? ` Here's an example: "${slide.examples[0]}"` : ""}`;
    
    case "reading":
      return slide.content;
    
    case "example":
      return `${slide.context}: "${slide.sentence}"${slide.highlight ? ` Notice how we use "${slide.highlight}" here.` : ""}`;
    
    case "quiz":
      const questionText = typeof slide.question === 'string' ? slide.question : (slide.question as any).question;
      return `Question ${slide.questionNumber}: ${questionText}${slide.options ? ` Your options are: ${slide.options.join(", ")}` : ""} Take a moment to think...`;
    
    case "answer":
      return `The answer is: ${(slide as any).correctAnswer}. ${(slide as any).explanation || ""}`;
    
    case "summary":
      return `Let's review what we learned. Key vocabulary: ${slide.keyPoints.join(", ")}.`;
    
    case "outro":
      return `${slide.message} ${slide.callToAction || t.closing}`;
    
    default:
      return "";
  }
}

// Extract pronunciation hints for vocabulary
function extractPronunciationHints(slide: Slide): string[] {
  if (slide.type === "vocabulary" && slide.pronunciation) {
    return [`${slide.term}: ${slide.pronunciation}`];
  }
  return [];
}

// Generate complete voiceover script from reel
export async function generateVoiceoverScript(
  reel: LessonReel,
  tone: ScriptTone = "professional"
): Promise<VoiceoverScript> {
  const lines: ScriptLine[] = [];
  let currentTime = 0;

  for (let i = 0; i < reel.slides.length; i++) {
    const genSlide = reel.slides[i];
    const slide = genSlide.slide;
    const text = generateSlideText(slide, tone);
    
    if (text) {
      const duration = estimateDuration(text, slide.type);
      
      lines.push({
        slideId: slide.id,
        slideNumber: i + 1,
        slideType: slide.type,
        text,
        pronunciationHints: extractPronunciationHints(slide),
        suggestedDurationSeconds: duration,
        startTimeSeconds: currentTime,
      });
      
      currentTime += duration;
    }
  }

  return {
    lessonTitle: reel.title,
    totalDurationSeconds: currentTime,
    lines,
  };
}

// Format time as SRT timestamp (HH:MM:SS,mmm)
function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

// Generate SRT subtitle file content
export function generateSRT(script: VoiceoverScript): string {
  const srtLines: string[] = [];
  
  for (let i = 0; i < script.lines.length; i++) {
    const line = script.lines[i];
    const startTime = formatSRTTime(line.startTimeSeconds);
    const endTime = formatSRTTime(line.startTimeSeconds + line.suggestedDurationSeconds);
    
    // Split long text into multiple subtitle lines (max 42 chars per line)
    const words = line.text.split(" ");
    const subtitleLines: string[] = [];
    let currentLine = "";
    
    for (const word of words) {
      if ((currentLine + " " + word).length > 42) {
        subtitleLines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += " " + word;
      }
    }
    if (currentLine.trim()) {
      subtitleLines.push(currentLine.trim());
    }
    
    srtLines.push(`${i + 1}`);
    srtLines.push(`${startTime} --> ${endTime}`);
    srtLines.push(subtitleLines.slice(0, 2).join("\n")); // Max 2 lines per subtitle
    srtLines.push("");
  }
  
  return srtLines.join("\n");
}

// Generate formatted script.txt content
export function generateScriptText(script: VoiceoverScript): string {
  const lines: string[] = [
    `VOICEOVER SCRIPT: ${script.lessonTitle}`,
    `Total Duration: ${Math.floor(script.totalDurationSeconds / 60)}m ${Math.round(script.totalDurationSeconds % 60)}s`,
    "",
    "=" .repeat(50),
    "",
  ];

  for (const line of script.lines) {
    lines.push(`[SLIDE ${line.slideNumber}] ${line.slideType.toUpperCase()}`);
    lines.push(`Duration: ${line.suggestedDurationSeconds}s`);
    lines.push("");
    lines.push(line.text);
    
    if (line.pronunciationHints && line.pronunciationHints.length > 0) {
      lines.push("");
      lines.push(`📢 Pronunciation: ${line.pronunciationHints.join(", ")}`);
    }
    
    lines.push("");
    lines.push("-".repeat(50));
    lines.push("");
  }

  return lines.join("\n");
}

// AI-enhanced script generation with engagement optimization
export async function enhanceScriptWithAI(
  script: VoiceoverScript,
  cefrLevel: string,
  tone: ScriptTone
): Promise<VoiceoverScript> {
  const systemPrompt = `You are an expert ESL content creator optimizing voiceover scripts for social media.

CEFR Level: ${cefrLevel}
Tone: ${tone}

Your task is to enhance the script with:
1. Natural transitions between slides
2. Engagement hooks ("Did you know...", "Here's a tip...")
3. Appropriate vocabulary for the CEFR level
4. Clear, conversational pacing

Keep the same structure but make it more engaging for ${tone === "fun" ? "young learners" : tone === "casual" ? "everyday learners" : "professional contexts"}.`;

  const enhancedLines: ScriptLine[] = [];

  // Process in batches to avoid token limits
  for (const line of script.lines) {
    try {
      const response = await openrouter.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Enhance this ${line.slideType} slide script (keep it concise, max 2 sentences):\n\n${line.text}` },
        ],
        max_tokens: 150,
      });

      const enhancedText = response.choices[0]?.message?.content || line.text;
      
      enhancedLines.push({
        ...line,
        text: enhancedText,
        suggestedDurationSeconds: estimateDuration(enhancedText, line.slideType),
      });
    } catch (error) {
      console.error("Error enhancing script line:", error);
      enhancedLines.push(line);
    }
  }

  // Recalculate timings
  let currentTime = 0;
  for (const line of enhancedLines) {
    line.startTimeSeconds = currentTime;
    currentTime += line.suggestedDurationSeconds;
  }

  return {
    ...script,
    lines: enhancedLines,
    totalDurationSeconds: currentTime,
  };
}
