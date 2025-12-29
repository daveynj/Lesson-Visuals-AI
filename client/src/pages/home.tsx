import { useState, useCallback } from "react";
import { Upload, FileJson, Sparkles, ImageIcon, Download, RefreshCw, CheckCircle2, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Lesson, LessonAnalysis, VocabularyWord, GeneratedImage, SmartPromptResult } from "@shared/schema";

type Step = "upload" | "analysis" | "generate" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [analysis, setAnalysis] = useState<LessonAnalysis | null>(null);
  const [selectedVocab, setSelectedVocab] = useState<Set<string>>(new Set());
  const [smartPrompts, setSmartPrompts] = useState<SmartPromptResult[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGenerating, setCurrentGenerating] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
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

    try {
      const text = await file.text();
      const data = JSON.parse(text) as Lesson;
      
      // Strip base64 image data from vocabulary words to reduce payload size
      const cleanedData = {
        ...data,
        content: {
          ...data.content,
          sections: data.content.sections.map(section => ({
            ...section,
            words: section.words?.map(word => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { imageBase64, ...rest } = word as VocabularyWord & { imageBase64?: string };
              return rest;
            }),
          })),
        },
      };
      
      setLesson(data);
      setIsAnalyzing(true);

      const response = await apiRequest("POST", "/api/analyze-lesson", { lesson: cleanedData });
      const analysisData = await response.json() as LessonAnalysis;
      
      setAnalysis(analysisData);
      setSelectedVocab(new Set(analysisData.vocabulary.map(v => v.term)));
      setStep("analysis");
      
      toast({
        title: "Lesson analyzed",
        description: `Found ${analysisData.vocabularyCount} vocabulary words`,
      });
    } catch (error) {
      console.error("Error parsing file:", error);
      toast({
        title: "Error parsing file",
        description: "Please make sure the file is a valid lesson JSON",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const toggleVocab = (term: string) => {
    setSelectedVocab(prev => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  };

  const toggleAllVocab = () => {
    if (!analysis) return;
    if (selectedVocab.size === analysis.vocabulary.length) {
      setSelectedVocab(new Set());
    } else {
      setSelectedVocab(new Set(analysis.vocabulary.map(v => v.term)));
    }
  };

  const toggleCardExpand = (term: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  };

  const generateSmartPrompts = async () => {
    if (!analysis) return;
    
    setIsGeneratingPrompts(true);
    try {
      const selectedWords = analysis.vocabulary.filter(v => selectedVocab.has(v.term));
      const response = await apiRequest("POST", "/api/generate-smart-prompts", {
        vocabulary: selectedWords,
        lessonContext: analysis.lessonContext,
        brandColors: {
          primary: "#edc437",
          secondary: "#051d40",
          background: "#fdfdfd",
        },
      });
      const prompts = await response.json() as SmartPromptResult[];
      setSmartPrompts(prompts);
      setStep("generate");
      
      toast({
        title: "Smart prompts ready",
        description: `Created ${prompts.length} contextual image prompts`,
      });
    } catch (error) {
      console.error("Error generating prompts:", error);
      toast({
        title: "Error generating prompts",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const generateImages = async () => {
    if (smartPrompts.length === 0) return;
    
    setIsGeneratingImages(true);
    setGenerationProgress(0);
    setGeneratedImages([]);
    
    const images: GeneratedImage[] = [];
    let failedCount = 0;
    
    for (let i = 0; i < smartPrompts.length; i++) {
      const prompt = smartPrompts[i];
      setCurrentGenerating(prompt.term);
      setGenerationProgress(Math.round(((i + 1) / smartPrompts.length) * 100));
      
      try {
        const response = await apiRequest("POST", "/api/generate-vocab-image", {
          prompt: prompt.enhancedPrompt,
          term: prompt.term,
          definition: prompt.definition,
          example: prompt.example,
        });
        const imageData = await response.json() as { imageData: string };
        
        images.push({
          term: prompt.term,
          prompt: prompt.enhancedPrompt,
          imageData: imageData.imageData,
          definition: prompt.definition,
          example: prompt.example,
        });
        setGeneratedImages([...images]);
      } catch (error) {
        console.error(`Error generating image for ${prompt.term}:`, error);
        failedCount++;
        toast({
          title: `Failed: ${prompt.term}`,
          description: "Could not generate image, skipping...",
          variant: "destructive",
        });
      }
    }
    
    setGenerationProgress(100);
    setIsGeneratingImages(false);
    setCurrentGenerating("");
    
    if (images.length > 0) {
      setStep("results");
      toast({
        title: "Images generated",
        description: failedCount > 0 
          ? `Created ${images.length} images (${failedCount} failed)`
          : `Successfully created ${images.length} social media images`,
      });
    } else {
      toast({
        title: "Generation failed",
        description: "No images could be generated. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadImage = (image: GeneratedImage) => {
    const link = document.createElement("a");
    link.href = image.imageData;
    link.download = `${image.term.toLowerCase().replace(/\s+/g, "-")}-vocab-card.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = () => {
    generatedImages.forEach((image, index) => {
      setTimeout(() => downloadImage(image), index * 200);
    });
  };

  const resetApp = () => {
    setStep("upload");
    setLesson(null);
    setAnalysis(null);
    setSelectedVocab(new Set());
    setSmartPrompts([]);
    setGeneratedImages([]);
    setGenerationProgress(0);
    setExpandedCards(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-[#051d40]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#edc437] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#051d40]" />
            </div>
            <h1 className="text-lg font-semibold text-[#fdfdfd]">Lesson to Reels</h1>
          </div>
          {step !== "upload" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetApp}
              className="border-[#edc437]/30 text-[#fdfdfd] bg-transparent"
              data-testid="button-new-project"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">Upload Your Lesson</h2>
              <p className="text-muted-foreground">
                Transform your lesson content into engaging social media images
              </p>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                isDragOver 
                  ? "border-[#edc437] bg-[#edc437]/10" 
                  : "border-border hover:border-[#edc437]/50"
              } ${isAnalyzing ? "pointer-events-none opacity-70" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById("file-input")?.click()}
              data-testid="dropzone-upload"
            >
              <input
                id="file-input"
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                data-testid="input-file"
              />
              
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-[#edc437] animate-spin" />
                  <p className="text-foreground font-medium">Analyzing lesson content...</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#051d40]/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-[#051d40]" />
                  </div>
                  <p className="text-foreground font-medium mb-2">
                    Drop your lesson JSON file here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse files
                  </p>
                  <Badge variant="secondary" className="gap-1">
                    <FileJson className="w-3 h-3" />
                    .json
                  </Badge>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Analysis */}
        {step === "analysis" && analysis && (
          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileJson className="w-5 h-5 text-[#edc437]" />
                    Lesson Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium text-foreground">{analysis.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#edc437] text-[#051d40]">{analysis.level}</Badge>
                    <span className="text-sm text-muted-foreground">{analysis.topic}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vocabulary</span>
                      <span className="font-medium text-foreground">{analysis.vocabularyCount} words</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Sections</span>
                      <span className="font-medium text-foreground">{analysis.sectionCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.sections.map((section, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[#edc437]" />
                      <span className="text-foreground">{section.title}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      {selectedVocab.size} of {analysis.vocabularyCount} selected
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleAllVocab}
                      data-testid="button-toggle-all"
                    >
                      {selectedVocab.size === analysis.vocabularyCount ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <Button 
                    className="w-full bg-[#edc437] text-[#051d40] font-semibold"
                    onClick={generateSmartPrompts}
                    disabled={selectedVocab.size === 0 || isGeneratingPrompts}
                    data-testid="button-generate-prompts"
                  >
                    {isGeneratingPrompts ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Context...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Smart Prompts
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main content */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Vocabulary Words</h3>
                <p className="text-sm text-muted-foreground">
                  Select words to generate images for
                </p>
              </div>
              
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-3 pr-4">
                  {analysis.vocabulary.map((word) => (
                    <Collapsible 
                      key={word.term}
                      open={expandedCards.has(word.term)}
                      onOpenChange={() => toggleCardExpand(word.term)}
                    >
                      <Card 
                        className={`transition-all ${
                          selectedVocab.has(word.term) 
                            ? "border-[#edc437] bg-[#edc437]/5" 
                            : ""
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedVocab.has(word.term)}
                              onCheckedChange={() => toggleVocab(word.term)}
                              className="mt-1"
                              data-testid={`checkbox-vocab-${word.term}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-foreground">{word.term}</span>
                                <Badge variant="outline">{word.partOfSpeech}</Badge>
                                {word.semanticGroup && (
                                  <Badge variant="secondary">{word.semanticGroup}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground mt-1">{word.definition}</p>
                              <p className="text-sm text-muted-foreground italic mt-1">"{word.example}"</p>
                              
                              <CollapsibleContent className="mt-3 pt-3 border-t space-y-2">
                                {word.additionalExamples && word.additionalExamples.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">More examples:</p>
                                    {word.additionalExamples.map((ex, i) => (
                                      <p key={i} className="text-sm text-muted-foreground italic">"{ex}"</p>
                                    ))}
                                  </div>
                                )}
                                {word.collocations && word.collocations.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {word.collocations.map((col, i) => (
                                      <Badge key={i} variant="outline">{col}</Badge>
                                    ))}
                                  </div>
                                )}
                                {word.imagePrompt && (
                                  <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                                    <span className="font-medium">Original prompt: </span>
                                    {word.imagePrompt}
                                  </div>
                                )}
                              </CollapsibleContent>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-expand-${word.term}`}>
                                {expandedCards.has(word.term) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </CardContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Step 3: Generate */}
        {step === "generate" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">Smart Image Prompts</h2>
              <p className="text-muted-foreground">
                AI-enhanced prompts with lesson context and brand styling
              </p>
            </div>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Ready to generate</p>
                    <p className="text-lg font-semibold text-foreground">{smartPrompts.length} images</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded-full bg-[#edc437] border-2 border-background" />
                      <div className="w-6 h-6 rounded-full bg-[#051d40] border-2 border-background -ml-2" />
                      <div className="w-6 h-6 rounded-full bg-[#fdfdfd] border-2 border-border -ml-2" />
                    </div>
                    <span className="text-sm text-muted-foreground">Brand colors</span>
                  </div>
                  <Button 
                    className="bg-[#edc437] text-[#051d40] font-semibold"
                    onClick={generateImages}
                    disabled={isGeneratingImages}
                    data-testid="button-generate-images"
                  >
                    {isGeneratingImages ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Generate Images
                      </>
                    )}
                  </Button>
                </div>

                {isGeneratingImages && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Generating: <span className="font-medium text-foreground">{currentGenerating}</span>
                      </span>
                      <span className="text-sm font-medium text-foreground">{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3">
                {smartPrompts.map((prompt, i) => (
                  <Card key={prompt.term}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#051d40] text-[#fdfdfd] flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{prompt.term}</span>
                            {generatedImages.some(img => img.term === prompt.term) && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{prompt.enhancedPrompt}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step 4: Results */}
        {step === "results" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Generated Images</h2>
                <p className="text-muted-foreground">{generatedImages.length} social media cards ready</p>
              </div>
              <Button 
                className="bg-[#edc437] text-[#051d40] font-semibold"
                onClick={downloadAllImages}
                data-testid="button-download-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((image) => (
                <Card key={image.term} className="overflow-hidden">
                  <div className="aspect-square relative bg-muted">
                    <img
                      src={image.imageData}
                      alt={image.term}
                      className="w-full h-full object-cover"
                      data-testid={`img-vocab-${image.term}`}
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => downloadImage(image)}
                      data-testid={`button-download-${image.term}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-1">{image.term}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{image.definition}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
