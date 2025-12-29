import { useState, useCallback } from "react";
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

function SlidePreview({ slide, imageData }: { slide: Slide; imageData?: string }) {
  const baseStyle = "aspect-[9/16] rounded-md flex flex-col overflow-hidden";
  
  if (imageData) {
    return (
      <div 
        className={baseStyle}
        style={{ 
          backgroundImage: `url(${imageData})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex-1 flex flex-col justify-end p-4 bg-gradient-to-t from-[#051d40]/90 via-[#051d40]/50 to-transparent">
          <SlideTextContent slide={slide} />
        </div>
      </div>
    );
  }

  return (
    <div 
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
        <SlideTextContent slide={slide} />
      </div>
    </div>
  );
}

function SlideTextContent({ slide }: { slide: Slide }) {
  const textColor = "#051d40";
  const accentColor = "#edc437";

  switch (slide.type) {
    case "title":
      return (
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold" style={{ color: textColor }}>{slide.title}</h2>
          {slide.subtitle && <p className="text-sm opacity-80" style={{ color: textColor }}>{slide.subtitle}</p>}
          <div className="flex justify-center gap-2 mt-2">
            <Badge style={{ backgroundColor: accentColor, color: textColor }}>{slide.level}</Badge>
            <Badge variant="outline" style={{ borderColor: textColor, color: textColor }}>{slide.topic}</Badge>
          </div>
        </div>
      );
      
    case "objectives":
      return (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-center" style={{ color: textColor }}>{slide.title}</h3>
          <ul className="space-y-2 text-sm">
            {slide.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2" style={{ color: textColor }}>
                <span style={{ color: accentColor }}>•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      );
      
    case "vocabulary":
      return (
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold" style={{ color: accentColor }}>{slide.term}</h3>
          <p className="text-xs italic opacity-70" style={{ color: textColor }}>{slide.partOfSpeech}</p>
          <p className="text-sm font-medium" style={{ color: textColor }}>{slide.definition}</p>
          <p className="text-xs italic opacity-80" style={{ color: textColor }}>"{slide.example}"</p>
          {slide.pronunciation && (
            <p className="text-xs opacity-60" style={{ color: textColor }}>{slide.pronunciation}</p>
          )}
        </div>
      );
      
    case "grammar":
      return (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>{slide.title}</h3>
          <p className="text-sm" style={{ color: textColor }}>{slide.explanation}</p>
          {slide.examples && slide.examples.length > 0 && (
            <div className="mt-2 p-2 rounded" style={{ backgroundColor: `${accentColor}20` }}>
              <p className="text-xs italic" style={{ color: textColor }}>{slide.examples[0]}</p>
            </div>
          )}
        </div>
      );

    case "reading":
      return (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>{slide.title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: textColor }}>{slide.content}</p>
        </div>
      );

    case "activity":
      return (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold" style={{ color: accentColor }}>{slide.title}</h3>
          <p className="text-sm" style={{ color: textColor }}>{slide.instructions}</p>
          {slide.targetVocabulary && slide.targetVocabulary.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {slide.targetVocabulary.map((word, i) => (
                <Badge key={i} variant="outline" className="text-xs" style={{ borderColor: accentColor, color: textColor }}>
                  {word}
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
      
    case "quiz":
      return (
        <div className="space-y-3">
          <div className="text-center">
            <Badge style={{ backgroundColor: accentColor, color: textColor }}>
              Question {slide.questionNumber} of {slide.totalQuestions}
            </Badge>
          </div>
          <p className="text-sm font-medium text-center" style={{ color: textColor }}>{slide.question}</p>
          {slide.options && (
            <div className="space-y-2 mt-3">
              {slide.options.map((opt, i) => (
                <div 
                  key={i} 
                  className="p-2 rounded text-sm text-center"
                  style={{ backgroundColor: `${accentColor}20`, color: textColor }}
                >
                  {String.fromCharCode(65 + i)}. {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      );
      
    case "summary":
      return (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-center" style={{ color: textColor }}>{slide.title}</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {slide.keyPoints.map((point, i) => (
              <Badge 
                key={i} 
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
        <div className="text-center space-y-3">
          <h3 className="text-xl font-bold" style={{ color: accentColor }}>{slide.message}</h3>
          {slide.callToAction && (
            <p className="text-sm" style={{ color: textColor }}>{slide.callToAction}</p>
          )}
        </div>
      );
      
    default:
      return <p className="text-sm text-center" style={{ color: textColor }}>Slide content</p>;
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
      const reelData = await slidesResponse.json() as LessonReel;
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

  const downloadSlide = (genSlide: GeneratedSlide) => {
    if (!genSlide.imageData) return;
    
    const link = document.createElement("a");
    link.href = genSlide.imageData;
    link.download = `slide-${genSlide.slide.sequence + 1}-${genSlide.slide.type}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    if (!reel) return;
    
    reel.slides.forEach((genSlide, index) => {
      if (genSlide.imageData) {
        setTimeout(() => downloadSlide(genSlide), index * 200);
      }
    });
    
    toast({
      title: "Downloading slides",
      description: `Downloading ${reel.slides.filter(s => s.imageData).length} images`,
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
                    {reel.slides[currentSlideIndex].imageData && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 gap-2"
                        onClick={() => downloadSlide(reel.slides[currentSlideIndex])}
                        data-testid="button-download-current"
                      >
                        <Download className="w-4 h-4" />
                        Download This Slide
                      </Button>
                    )}
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
