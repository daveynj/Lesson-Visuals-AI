import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paintbrush, RotateCcw } from "lucide-react";

export interface BrandSettings {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    logoUrl?: string;
    ctaText: string;
    ctaHandle: string;
}

const DEFAULT_SETTINGS: BrandSettings = {
    primaryColor: "#edc437",
    secondaryColor: "#051d40",
    backgroundColor: "#fdfdfd",
    logoUrl: undefined,
    ctaText: "Follow for more lessons!",
    ctaHandle: "@teach",
};

const STORAGE_KEY = "lesson-visuals-brand-settings";

// Load settings from localStorage
export function loadBrandSettings(): BrandSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error("Error loading brand settings:", error);
    }
    return DEFAULT_SETTINGS;
}

// Save settings to localStorage
export function saveBrandSettings(settings: BrandSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Error saving brand settings:", error);
    }
}

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label: string;
}

function ColorPicker({ color, onChange, label }: ColorPickerProps) {
    return (
        <div className="flex items-center gap-3">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-10 h-10 p-0 border-2"
                        style={{ backgroundColor: color }}
                    >
                        <span className="sr-only">Pick {label}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                    <div className="space-y-2">
                        <Label>{label}</Label>
                        <Input
                            type="color"
                            value={color}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                            type="text"
                            value={color}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="#000000"
                            className="w-full"
                        />
                    </div>
                </PopoverContent>
            </Popover>
            <div className="flex-1">
                <Label className="text-sm">{label}</Label>
                <p className="text-xs text-muted-foreground">{color}</p>
            </div>
        </div>
    );
}

interface BrandSettingsPanelProps {
    settings: BrandSettings;
    onChange: (settings: BrandSettings) => void;
    onClose?: () => void;
}

export function BrandSettingsPanel({ settings, onChange, onClose }: BrandSettingsPanelProps) {
    const handleReset = () => {
        onChange(DEFAULT_SETTINGS);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                onChange({ ...settings, logoUrl: event.target?.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Paintbrush className="w-5 h-5" />
                    Brand Settings
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Colors */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium">Colors</h4>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <ColorPicker
                            color={settings.primaryColor}
                            onChange={(c) => onChange({ ...settings, primaryColor: c })}
                            label="Primary"
                        />
                        <ColorPicker
                            color={settings.secondaryColor}
                            onChange={(c) => onChange({ ...settings, secondaryColor: c })}
                            label="Secondary"
                        />
                        <ColorPicker
                            color={settings.backgroundColor}
                            onChange={(c) => onChange({ ...settings, backgroundColor: c })}
                            label="Background"
                        />
                    </div>
                </div>

                {/* Logo */}
                <div className="space-y-2">
                    <Label>Logo (optional)</Label>
                    <div className="flex items-center gap-3">
                        {settings.logoUrl ? (
                            <div className="relative">
                                <img
                                    src={settings.logoUrl}
                                    alt="Logo preview"
                                    className="w-12 h-12 object-contain border rounded"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -top-2 -right-2 w-5 h-5 p-0 rounded-full"
                                    onClick={() => onChange({ ...settings, logoUrl: undefined })}
                                >
                                    ×
                                </Button>
                            </div>
                        ) : null}
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="flex-1"
                        />
                    </div>
                </div>

                {/* Call to Action */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium">Call to Action</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>CTA Text</Label>
                            <Input
                                value={settings.ctaText}
                                onChange={(e) => onChange({ ...settings, ctaText: e.target.value })}
                                placeholder="Follow for more lessons!"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Social Handle</Label>
                            <Input
                                value={settings.ctaHandle}
                                onChange={(e) => onChange({ ...settings, ctaHandle: e.target.value })}
                                placeholder="@yourhandle"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Preview</h4>
                    <div
                        className="rounded-lg p-4 text-center"
                        style={{ backgroundColor: settings.backgroundColor }}
                    >
                        <div
                            className="inline-block px-4 py-2 rounded font-medium"
                            style={{
                                backgroundColor: settings.primaryColor,
                                color: settings.secondaryColor,
                            }}
                        >
                            Sample Button
                        </div>
                        <p
                            className="mt-2 text-sm"
                            style={{ color: settings.secondaryColor }}
                        >
                            {settings.ctaText} {settings.ctaHandle}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Hook to manage brand settings with localStorage
export function useBrandSettings() {
    const [settings, setSettings] = useState<BrandSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        setSettings(loadBrandSettings());
    }, []);

    const updateSettings = (newSettings: BrandSettings) => {
        setSettings(newSettings);
        saveBrandSettings(newSettings);
    };

    return { settings, updateSettings };
}
