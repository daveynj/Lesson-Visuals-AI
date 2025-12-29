import { useState, useCallback, useRef } from "react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  Wand2, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  MessageSquare,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import type { Lesson, LessonReel, GeneratedSlide, Slide } from "@shared/schema";

type Step = "upload" | "preview" | "generating" | "results";

const BRAND_COLORS = {
  primary: "#edc437",
  secondary: "#051d40", 
  background: "#fdfdfd",
};

function SlideTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "title": return <BookOpen className="w-4 h-4" />;
    case "objectives": return <GraduationCap className="w-4 h-4" />;
    case "vocabulary": return <MessageSquare className="w-4 h-4" />;
    case "grammar": return <FileText className="w-4 h-4" />;
    case "reading": return <BookOpen className="w-4 h-4" />;
    case "activity": return <Sparkles className="w-4 h-4" />;
    case "quiz": return <HelpCircle className="w-4 h-4" />;
    case "summary": return <CheckCircle className="w-4 h-4" />;
    case "outro": return <Sparkles className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

function SlidePreview({ slide, imageData, slideRef }: { slide: Slide; imageData?: string; slideRef?: React.RefObject<HTMLDivElement> }) {
  const baseStyle = "aspect-[9/16] rounded-md flex flex-col overflow-hidden";
  
  if (imageData) {
    return (
      <div 
        ref={slideRef}
        className={baseStyle}
        style={{ 
          backgroundImage: `url(${imageData})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Strong gradient overlay for text readability */}
        <div className="flex-1 flex flex-col justify-end p-4" style={{
          background: "linear-gradient(to top, rgba(5,29,64,0.95) 0%, rgba(5,29,64,0.85) 30%, rgba(5,29,64,0.4) 70%, transparent 100%)"
        }}>
          <SlideTextContent slide={slide} onImage={true} />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={slideRef}
      className={baseStyle}
      style={{ backgroundColor: BRAND_COLORS.background }}
    >
      <div 
        className="p-4 text-center"
        style={{ backgroundColor: BRAND_COLORS.secondary }}
      >
        <Badge 
          variant="secondary" 
          className="text-xs"
          style={{ backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.secondary }}
        >
          {slide.type.toUpperCase()}
        </Badge>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-center">
        <SlideTextContent slide={slide} onImage={false} />
      </div>
    </div>
  );
}

function SlideTextContent({ slide, onImage = false }: { slide: Slide; onImage?: boolean }) {
  // Use white text on image backgrounds, navy text on light backgrounds
  const textColor = onImage ? "#ffffff" : "#051d40";
  const accentColor = "#edc437";

  switch (slide.type) {
    case "title":
      return (
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold" style={{ color: textColor }}>{slide.title}</h2>
          {slide.subtitle && <p className="text-xl opacity-80" style={{ color: textColor }}>{slide.subtitle}</p>}
          <div className="flex justify-center gap-3 mt-3">
            <Badge className="text-lg px-4 py-2" style={{ backgroundColor: accentColor, color: textColor }}>{slide.level}</Badge>
            <Badge variant="outline" className="text-lg px-4 py-2" style={{ borderColor: textColor, color: textColor }}>{slide.topic}</Badge>
          </div>
        </div>
      );
      
    case "objectives":
      return (
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-center" style={{ color: textColor }}>{slide.title}</h3>
          <ul className="space-y-3 text-xl">
            {slide.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-3" style={{ color: textColor }}>
                <span style={{ color: accentColor }}>•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      );
      
    case "vocabulary":
      return (
        <div className="text-center space-y-3">
          <h3 className="text-4xl font-bold" style={{ color: accentColor }}>{slide.term}</h3>
          <p className="text-lg italic opacity-70" style={{ color: textColor }}>{slide.partOfSpeech}</p>
          <p className="text-xl font-medium" style={{ color: textColor }}>{slide.definition}</p>
          <p className="text-lg italic opacity-80" style={{ color: textColor }}>"{slide.example}"</p>
          {slide.pronunciation && (
            <p className="text-lg opacity-60" style={{ color: textColor }}>{slide.pronunciation}</p>
          )}
        </div>
      );
      
    case "grammar":
      return (
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold" style={{ color: textColor }}>{slide.title}</h3>
          <p className="text-xl" style={{ color: textColor }}>{slide.explanation}</p>
          {slide.examples && slide.examples.length > 0 && (
            <div className="mt-3 p-3 rounded" style={{ backgroundColor: `${accentColor}20` }}>
              <p className="text-lg italic" style={{ color: textColor }}>{slide.examples[0]}</p>
            </div>
          )}
        </div>
      );

    case "reading":
      return (
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold" style={{ color: textColor }}>{slide.title}</h3>
          <p className="text-xl leading-relaxed" style={{ color: textColor }}>{slide.content}</p>
        </div>
      );

    case "example":
      return (
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold" style={{ color: accentColor }}>{slide.context}</h3>
          <p className="text-xl leading-relaxed" style={{ color: textColor }}>{slide.sentence}</p>
          {slide.highlight && (
            <Badge className="text-lg px-4 py-2" style={{ backgroundColor: accentColor, color: textColor }}>{slide.highlight}</Badge>
          )}
        </div>
      );

    case "activity":
      return (
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold" style={{ color: accentColor }}>{slide.title}</h3>
          <p className="text-xl" style={{ color: textColor }}>{slide.instructions}</p>
          {slide.targetVocabulary && slide.targetVocabulary.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {slide.targetVocabulary.map((word, i) => (
                <Badge key={i} variant="outline" className="text-lg px-3 py-1" style={{ borderColor: accentColor, color: textColor }}>
                  {word}
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
      
    case "quiz":
      // Handle question as either string or object
      const questionText = typeof slide.question === 'object' 
        ? (slide.question as { question?: string }).question || JSON.stringify(slide.question)
        : slide.question;
      const questionOptions = slide.options || 
        (typeof slide.question === 'object' ? (slide.question as { options?: string[] }).options : undefined);
      
      return (
        <div className="space-y-4">
          <div className="text-center">
            <Badge className="text-lg px-4 py-2" style={{ backgroundColor: accentColor, color: textColor }}>
              Question {slide.questionNumber} of {slide.totalQuestions}
            </Badge>
          </div>
          <p className="text-xl font-medium text-center" style={{ color: textColor }}>{questionText}</p>
          {questionOptions && Array.isArray(questionOptions) && (
            <div className="space-y-3 mt-4">
              {questionOptions.map((opt, i) => (
                <div 
                  key={i} 
                  className="p-3 rounded text-xl text-center"
                  style={{ backgroundColor: `${accentColor}20`, color: textColor }}
                >
                  {String.fromCharCode(65 + i)}. {typeof opt === 'string' ? opt : String(opt)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
      
    case "summary":
      return (
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-center" style={{ color: textColor }}>{slide.title}</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {slide.keyPoints.map((point, i) => (
              <Badge 
                key={i} 
                className="text-lg px-4 py-2"
                style={{ backgroundColor: accentColor, color: textColor }}
              >
                {point}
              </Badge>
            ))}
          </div>
        </div>
      );
      
    case "outro":
      return (
        <div className="text-center space-y-4">
          <h3 className="text-3xl font-bold" style={{ color: accentColor }}>{slide.message}</h3>
          {slide.callToAction && (
            <p className="text-xl" style={{ color: textColor }}>{slide.callToAction}</p>
          )}
        </div>
      );
      
    default:
      return <p className="text-xl text-center" style={{ color: textColor }}>Slide content</p>;
  }
}

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [reel, setReel] = useState<LessonReel | null>(null);
  const [lessonContext, setLessonContext] = useState<string>("");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGenerating, setCurrentGenerating] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith(".json")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Lesson;
      setLesson(data);

      // Convert lesson to slides
      const slidesResponse = await apiRequest("POST", "/api/lesson-to-slides", { lesson: data });
      let reelData = await slidesResponse.json() as LessonReel;

      // Rewrite reading text using Kimi K2 with all vocabulary
      try {
        const readingResponse = await apiRequest("POST", "/api/rewrite-reading-text", { lesson: data });
        const readingData = await readingResponse.json() as { 
          paragraph1: string; 
          paragraph2: string; 
          vocabularyUsed: string;
        };

        // Find the reading slide and replace with 2 slides
        const readingIndex = reelData.slides.findIndex(s => s.slide.type === "reading");
        if (readingIndex !== -1) {
          const originalReading = reelData.slides[readingIndex].slide as { title: string };
          const baseTitle = originalReading.title?.replace(/^Reading Text:\s*/i, "") || "Reading";
          
          // Create 2 reading slides
          const reading1 = {
            slide: {
              id: Math.random().toString(36).substring(2, 9),
              type: "reading" as const,
              sequence: reelData.slides[readingIndex].slide.sequence,
              requiresImage: true,
              title: `${baseTitle} (1/2)`,
              content: readingData.paragraph1,
              part: 1,
              totalParts: 2,
            },
            imageData: undefined,
            imagePrompt: undefined,
          };
          
          const reading2 = {
            slide: {
              id: Math.random().toString(36).substring(2, 9),
              type: "reading" as const,
              sequence: reelData.slides[readingIndex].slide.sequence + 0.5,
              requiresImage: true,
              title: `${baseTitle} (2/2)`,
              content: readingData.paragraph2,
              part: 2,
              totalParts: 2,
            },
            imageData: undefined,
            imagePrompt: undefined,
          };

          // Replace the single reading slide with 2 slides
          reelData.slides.splice(readingIndex, 1, reading1, reading2);
          reelData.totalSlides = reelData.slides.length;
        }
      } catch (readingError) {
        console.error("Failed to rewrite reading text:", readingError);
      }

      setReel(reelData);

      // Generate lesson context for image prompts
      const contextResponse = await apiRequest("POST", "/api/generate-lesson-context", { lesson: data });
      const contextData = await contextResponse.json() as { context: string };
      setLessonContext(contextData.context);

      setStep("preview");
      toast({
        title: "Lesson loaded",
        description: `Created ${reelData.totalSlides} slides for your visual lesson`,
      });
    } catch (error) {
      console.error("Error processing lesson:", error);
      toast({
        title: "Error processing file",
        description: "Please check the JSON format and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const generateImages = async () => {
    if (!reel) return;
    
    setIsGenerating(true);
    setStep("generating");
    setGenerationProgress(0);

    const slidesRequiringImages = reel.slides.filter(s => s.slide.requiresImage);
    const updatedSlides = [...reel.slides];
    let completed = 0;
    let failed = 0;

    for (const genSlide of slidesRequiringImages) {
      const slideIndex = reel.slides.findIndex(s => s.slide.id === genSlide.slide.id);
      setCurrentGenerating(getSlideLabel(genSlide.slide));

      try {
        // Generate prompt for this slide
        const promptResponse = await apiRequest("POST", "/api/generate-slide-prompt", {
          slide: genSlide.slide,
          lessonContext,
        });
        const promptData = await promptResponse.json() as { prompt: string | null; slideId: string };

        if (promptData.prompt) {
          // Generate image
          const imageResponse = await apiRequest("POST", "/api/generate-slide-image", {
            prompt: promptData.prompt,
            slideId: genSlide.slide.id,
          });
          const imageData = await imageResponse.json() as { imageData: string; slideId: string; prompt: string };

          updatedSlides[slideIndex] = {
            ...updatedSlides[slideIndex],
            imageData: imageData.imageData,
            imagePrompt: imageData.prompt,
          };

          setReel({ ...reel, slides: updatedSlides });
        }
      } catch (error) {
        console.error(`Error generating image for slide:`, error);
        failed++;
        toast({
          title: `Failed: ${getSlideLabel(genSlide.slide)}`,
          description: "Skipping this slide...",
          variant: "destructive",
        });
      }

      completed++;
      setGenerationProgress(Math.round((completed / slidesRequiringImages.length) * 100));
    }

    setIsGenerating(false);
    setCurrentGenerating("");
    setStep("results");

    toast({
      title: "Reel generated",
      description: failed > 0 
        ? `Created ${completed - failed} images (${failed} failed)`
        : `Successfully created ${completed} visual slides`,
    });
  };

  const getSlideLabel = (slide: Slide): string => {
    switch (slide.type) {
      case "title": return slide.title;
      case "vocabulary": return slide.term;
      case "grammar": return slide.title;
      case "reading": return slide.title;
      case "outro": return "Outro";
      default: return slide.type;
    }
  };

  const downloadSlideAsImage = async (genSlide: GeneratedSlide, slideIndex: number): Promise<void> => {
    // Create a hidden container for rendering
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "1080px"; // Full resolution for social media
    container.style.height = "1920px"; // 9:16 aspect ratio
    document.body.appendChild(container);

    // Create the slide element
    const slideEl = document.createElement("div");
    slideEl.style.width = "100%";
    slideEl.style.height = "100%";
    slideEl.style.display = "flex";
    slideEl.style.flexDirection = "column";
    slideEl.style.fontFamily = "system-ui, -apple-system, sans-serif";
    
    const slide = genSlide.slide;
    
    if (genSlide.imageData) {
      // Image slide with text overlay
      slideEl.style.backgroundImage = `url(${genSlide.imageData})`;
      slideEl.style.backgroundSize = "cover";
      slideEl.style.backgroundPosition = "center";
      
      const overlay = document.createElement("div");
      overlay.style.flex = "1";
      overlay.style.display = "flex";
      overlay.style.flexDirection = "column";
      overlay.style.justifyContent = "flex-end";
      overlay.style.padding = "60px";
      overlay.style.background = "linear-gradient(to top, rgba(5,29,64,0.95) 0%, rgba(5,29,64,0.85) 30%, rgba(5,29,64,0.4) 70%, transparent 100%)";
      
      overlay.innerHTML = renderSlideTextForDownload(slide, true);
      slideEl.appendChild(overlay);
    } else {
      // Text-only slide
      slideEl.style.backgroundColor = BRAND_COLORS.background;
      
      const header = document.createElement("div");
      header.style.padding = "40px";
      header.style.textAlign = "center";
      header.style.backgroundColor = BRAND_COLORS.secondary;
      header.innerHTML = `<span style="background-color: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.secondary}; padding: 8px 16px; border-radius: 4px; font-size: 24px; font-weight: 600;">${slide.type.toUpperCase()}</span>`;
      
      const content = document.createElement("div");
      content.style.flex = "1";
      content.style.padding = "60px";
      content.style.display = "flex";
      content.style.flexDirection = "column";
      content.style.justifyContent = "center";
      content.innerHTML = renderSlideTextForDownload(slide, false);
      
      slideEl.appendChild(header);
      slideEl.appendChild(content);
    }
    
    container.appendChild(slideEl);
    
    try {
      const canvas = await html2canvas(slideEl, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `slide-${slideIndex + 1}-${slide.type}.png`;
      link.click();
    } finally {
      document.body.removeChild(container);
    }
  };

  const renderSlideTextForDownload = (slide: Slide, onImage: boolean): string => {
    const textColor = onImage ? "#ffffff" : "#051d40";
    const accentColor = "#edc437";
    
    switch (slide.type) {
      case "title":
        return `
          <div style="text-align: center;">
            <h2 style="font-size: 56px; font-weight: bold; color: ${textColor}; margin-bottom: 16px;">${slide.title}</h2>
            ${slide.subtitle ? `<p style="font-size: 28px; opacity: 0.8; color: ${textColor};">${slide.subtitle}</p>` : ""}
            <div style="display: flex; justify-content: center; gap: 16px; margin-top: 24px;">
              <span style="background-color: ${accentColor}; color: ${BRAND_COLORS.secondary}; padding: 8px 20px; border-radius: 4px; font-size: 24px;">${slide.level}</span>
              <span style="border: 2px solid ${textColor}; color: ${textColor}; padding: 8px 20px; border-radius: 4px; font-size: 24px;">${slide.topic}</span>
            </div>
          </div>
        `;
      case "vocabulary":
        return `
          <div style="text-align: center;">
            <h3 style="font-size: 64px; font-weight: bold; color: ${accentColor}; margin-bottom: 16px;">${slide.term}</h3>
            <p style="font-size: 24px; font-style: italic; opacity: 0.7; color: ${textColor};">${slide.partOfSpeech}</p>
            <p style="font-size: 32px; font-weight: 500; color: ${textColor}; margin-top: 24px;">${slide.definition}</p>
            <p style="font-size: 28px; font-style: italic; opacity: 0.8; color: ${textColor}; margin-top: 16px;">"${slide.example}"</p>
          </div>
        `;
      case "grammar":
        return `
          <div>
            <h3 style="font-size: 48px; font-weight: 600; color: ${textColor}; margin-bottom: 24px;">${slide.title}</h3>
            <p style="font-size: 32px; color: ${textColor}; line-height: 1.5;">${slide.explanation}</p>
            ${slide.examples?.[0] ? `<div style="margin-top: 32px; padding: 24px; background-color: ${accentColor}20; border-radius: 8px;"><p style="font-size: 28px; font-style: italic; color: ${textColor};">${slide.examples[0]}</p></div>` : ""}
          </div>
        `;
      case "reading":
        return `
          <div>
            <h3 style="font-size: 48px; font-weight: 600; color: ${textColor}; margin-bottom: 24px;">${slide.title}</h3>
            <p style="font-size: 28px; color: ${textColor}; line-height: 1.6;">${slide.content}</p>
          </div>
        `;
      case "example":
        return `
          <div>
            <h3 style="font-size: 48px; font-weight: 600; color: ${accentColor}; margin-bottom: 24px;">${slide.context}</h3>
            <p style="font-size: 32px; color: ${textColor}; line-height: 1.5;">${slide.sentence}</p>
            ${slide.highlight ? `<span style="background-color: ${accentColor}; color: ${BRAND_COLORS.secondary}; padding: 8px 20px; border-radius: 4px; font-size: 24px; margin-top: 24px; display: inline-block;">${slide.highlight}</span>` : ""}
          </div>
        `;
      case "activity":
        return `
          <div>
            <h3 style="font-size: 48px; font-weight: 600; color: ${accentColor}; margin-bottom: 24px;">${slide.title}</h3>
            <p style="font-size: 28px; color: ${textColor}; line-height: 1.5;">${slide.instructions}</p>
            ${slide.targetVocabulary?.length ? `<div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px;">${slide.targetVocabulary.map(word => `<span style="border: 2px solid ${accentColor}; color: ${textColor}; padding: 8px 16px; border-radius: 4px; font-size: 20px;">${word}</span>`).join("")}</div>` : ""}
          </div>
        `;
      case "objectives":
        return `
          <div style="text-align: center;">
            <h3 style="font-size: 48px; font-weight: 600; color: ${textColor}; margin-bottom: 32px;">${slide.title}</h3>
            <ul style="list-style: none; padding: 0;">
              ${slide.objectives.map(obj => `<li style="font-size: 28px; color: ${textColor}; margin-bottom: 20px; display: flex; align-items: start; gap: 16px;"><span style="color: ${accentColor}; font-size: 32px;">•</span><span>${obj}</span></li>`).join("")}
            </ul>
          </div>
        `;
      case "quiz":
        const questionText = typeof slide.question === 'object' 
          ? (slide.question as { question?: string }).question || ""
          : slide.question;
        const opts = slide.options || (typeof slide.question === 'object' ? (slide.question as { options?: string[] }).options : undefined);
        return `
          <div style="text-align: center;">
            <span style="background-color: ${accentColor}; color: ${BRAND_COLORS.secondary}; padding: 8px 20px; border-radius: 4px; font-size: 24px;">Question ${slide.questionNumber} of ${slide.totalQuestions}</span>
            <p style="font-size: 36px; font-weight: 500; color: ${textColor}; margin-top: 40px;">${questionText}</p>
            ${opts ? `<div style="margin-top: 40px;">${opts.map((opt, i) => `<div style="background-color: ${accentColor}20; padding: 20px; border-radius: 8px; margin-bottom: 16px; font-size: 28px; color: ${textColor};">${String.fromCharCode(65 + i)}. ${opt}</div>`).join("")}</div>` : ""}
          </div>
        `;
      case "summary":
        return `
          <div style="text-align: center;">
            <h3 style="font-size: 48px; font-weight: 600; color: ${textColor}; margin-bottom: 32px;">${slide.title}</h3>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 16px;">
              ${slide.keyPoints.map(point => `<span style="background-color: ${accentColor}; color: ${BRAND_COLORS.secondary}; padding: 12px 24px; border-radius: 4px; font-size: 24px;">${point}</span>`).join("")}
            </div>
          </div>
        `;
      case "outro":
        return `
          <div style="text-align: center;">
            <h3 style="font-size: 56px; font-weight: bold; color: ${accentColor}; margin-bottom: 24px;">${slide.message}</h3>
            ${slide.callToAction ? `<p style="font-size: 32px; color: ${textColor};">${slide.callToAction}</p>` : ""}
          </div>
        `;
      default:
        return `<p style="font-size: 28px; color: ${textColor};">Slide content</p>`;
    }
  };

  const downloadAll = async () => {
    if (!reel) return;
    
    toast({
      title: "Preparing downloads",
      description: `Preparing ${reel.slides.length} slides for download...`,
    });
    
    for (let i = 0; i < reel.slides.length; i++) {
      await downloadSlideAsImage(reel.slides[i], i);
      // Small delay between downloads to prevent browser issues
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    toast({
      title: "Download complete",
      description: `Downloaded ${reel.slides.length} slides`,
    });
  };

  const navigateSlide = (direction: "prev" | "next") => {
    if (!reel) return;
    if (direction === "prev" && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (direction === "next" && currentSlideIndex < reel.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="border-b p-4"
        style={{ backgroundColor: BRAND_COLORS.secondary }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-md"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              <Sparkles className="w-5 h-5" style={{ color: BRAND_COLORS.secondary }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Lesson to Reels</h1>
              <p className="text-xs text-white/70">Visual ESL Lesson Generator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {["upload", "preview", "generating", "results"].map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-1 text-xs ${
                  step === s ? "text-white" : "text-white/40"
                }`}
              >
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step === s 
                      ? "text-[#051d40]" 
                      : "bg-white/20 text-white/60"
                  }`}
                  style={step === s ? { backgroundColor: BRAND_COLORS.primary } : {}}
                >
                  {i + 1}
                </div>
                <span className="hidden sm:inline capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {step === "upload" && (
          <div className="max-w-xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Upload Your Lesson</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drop a lesson JSON file to create a visual social media reel
                </p>
              </CardHeader>
              <CardContent>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-md p-8 text-center transition-colors cursor-pointer ${
                    isDragOver ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  data-testid="dropzone-upload"
                >
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                    data-testid="input-file"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload 
                      className="w-12 h-12 mx-auto mb-4"
                      style={{ color: BRAND_COLORS.primary }}
                    />
                    <p className="font-medium">Drop lesson JSON here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </label>
                </div>

                {isLoading && (
                  <div className="mt-4 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Processing lesson...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === "preview" && reel && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>{reel.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reel.totalSlides} slides ready for generation
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{reel.level}</Badge>
                  <Badge style={{ backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.secondary }}>
                    {reel.topic}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Slide Overview</h4>
                    <ScrollArea className="h-[400px] rounded-md border p-2">
                      <div className="space-y-2">
                        {reel.slides.map((genSlide, index) => (
                          <div
                            key={genSlide.slide.id}
                            className={`p-3 rounded-md flex items-center gap-3 cursor-pointer hover-elevate ${
                              currentSlideIndex === index ? "bg-accent" : ""
                            }`}
                            onClick={() => setCurrentSlideIndex(index)}
                            data-testid={`slide-item-${index}`}
                          >
                            <span className="text-xs text-muted-foreground w-6">{index + 1}</span>
                            <SlideTypeIcon type={genSlide.slide.type} />
                            <span className="text-sm flex-1 truncate">{getSlideLabel(genSlide.slide)}</span>
                            {genSlide.slide.requiresImage && (
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex flex-col items-center">
                    <h4 className="text-sm font-medium mb-3">Preview</h4>
                    <div className="w-48 sm:w-56">
                      <SlidePreview 
                        slide={reel.slides[currentSlideIndex].slide}
                        imageData={reel.slides[currentSlideIndex].imageData}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => navigateSlide("prev")}
                        disabled={currentSlideIndex === 0}
                        data-testid="button-prev-slide"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentSlideIndex + 1} / {reel.slides.length}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => navigateSlide("next")}
                        disabled={currentSlideIndex === reel.slides.length - 1}
                        data-testid="button-next-slide"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button 
                    onClick={generateImages}
                    size="lg"
                    className="gap-2"
                    style={{ backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.secondary }}
                    data-testid="button-generate-reel"
                  >
                    <Wand2 className="w-4 h-4" />
                    Generate Visual Reel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "generating" && reel && (
          <div className="max-w-xl mx-auto">
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center animate-pulse"
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                >
                  <Sparkles className="w-8 h-8" style={{ color: BRAND_COLORS.secondary }} />
                </div>
                <h3 className="text-lg font-semibold">Generating Your Visual Lesson</h3>
                <p className="text-sm text-muted-foreground">
                  Creating branded illustrations for each slide...
                </p>
                
                <div className="space-y-2">
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {currentGenerating && `Creating: ${currentGenerating}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {generationProgress}% complete
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    This may take a few minutes depending on the number of slides
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "results" && reel && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Your Visual Lesson Reel</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reel.slides.filter(s => s.imageData).length} visual slides generated
                  </p>
                </div>
                <Button 
                  onClick={downloadAll} 
                  className="gap-2"
                  style={{ backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.secondary }}
                  data-testid="button-download-all"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <ScrollArea className="h-[500px] rounded-md border p-2">
                    <div className="space-y-2">
                      {reel.slides.map((genSlide, index) => (
                        <div
                          key={genSlide.slide.id}
                          className={`p-3 rounded-md flex items-center gap-3 cursor-pointer hover-elevate ${
                            currentSlideIndex === index ? "bg-accent" : ""
                          }`}
                          onClick={() => setCurrentSlideIndex(index)}
                          data-testid={`result-slide-${index}`}
                        >
                          <span className="text-xs text-muted-foreground w-6">{index + 1}</span>
                          <SlideTypeIcon type={genSlide.slide.type} />
                          <span className="text-sm flex-1 truncate">{getSlideLabel(genSlide.slide)}</span>
                          {genSlide.imageData && (
                            <Badge variant="outline" className="text-xs">
                              <ImageIcon className="w-3 h-3 mr-1" />
                              Image
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex flex-col items-center">
                    <div className="w-56 sm:w-64">
                      <SlidePreview 
                        slide={reel.slides[currentSlideIndex].slide}
                        imageData={reel.slides[currentSlideIndex].imageData}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => navigateSlide("prev")}
                        disabled={currentSlideIndex === 0}
                        data-testid="button-result-prev"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentSlideIndex + 1} / {reel.slides.length}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => navigateSlide("next")}
                        disabled={currentSlideIndex === reel.slides.length - 1}
                        data-testid="button-result-next"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-2"
                      onClick={() => downloadSlideAsImage(reel.slides[currentSlideIndex], currentSlideIndex)}
                      data-testid="button-download-current"
                    >
                      <Download className="w-4 h-4" />
                      Download This Slide
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setLesson(null);
                  setReel(null);
                  setCurrentSlideIndex(0);
                }}
                data-testid="button-start-over"
              >
                Start Over with New Lesson
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
