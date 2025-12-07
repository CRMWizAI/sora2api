import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Monitor, Smartphone, Square } from 'lucide-react';
import { motion } from 'framer-motion';

const aspectRatios = [
    { value: '16:9', label: 'Landscape', icon: Monitor, desc: '1920x1080' },
    { value: '9:16', label: 'Portrait', icon: Smartphone, desc: '1080x1920' },
    { value: '1:1', label: 'Square', icon: Square, desc: '1080x1080' }
];

export default function ConfigPanel({ config, onChange, onGenerate, disabled }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Prompt Input */}
            <div className="space-y-3">
                <Label className="text-white text-lg font-medium">
                    Describe Your Video
                </Label>
                <Textarea
                    value={config.prompt}
                    onChange={(e) => onChange({ ...config, prompt: e.target.value })}
                    placeholder="A serene beach at sunset with gentle waves rolling onto the shore, palm trees swaying in the breeze..."
                    className="min-h-32 bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none focus:bg-white/15 transition-colors"
                    disabled={disabled}
                />
                <p className="text-white/50 text-sm">
                    Be detailed and descriptive for best results
                </p>
            </div>

            {/* Aspect Ratio Selection */}
            <div className="space-y-3">
                <Label className="text-white text-lg font-medium">
                    Video Format
                </Label>
                <div className="grid grid-cols-3 gap-4">
                    {aspectRatios.map((ratio) => {
                        const Icon = ratio.icon;
                        const isSelected = config.aspect_ratio === ratio.value;
                        
                        return (
                            <button
                                key={ratio.value}
                                onClick={() => onChange({ ...config, aspect_ratio: ratio.value })}
                                disabled={disabled}
                                className={`relative p-6 rounded-2xl border-2 transition-all ${
                                    isSelected
                                        ? 'border-purple-500 bg-purple-500/20'
                                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <Icon className={`w-8 h-8 ${isSelected ? 'text-purple-400' : 'text-white/60'}`} />
                                    <div>
                                        <div className={`font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                                            {ratio.label}
                                        </div>
                                        <div className="text-sm text-white/50">
                                            {ratio.desc}
                                        </div>
                                    </div>
                                </div>
                                {isSelected && (
                                    <motion.div
                                        layoutId="selected-border"
                                        className="absolute inset-0 rounded-2xl border-2 border-purple-500"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Duration Selection */}
            <div className="space-y-3">
                <Label className="text-white text-lg font-medium">
                    Duration (seconds)
                </Label>
                <Input
                    type="number"
                    min="3"
                    max="10"
                    value={config.duration}
                    onChange={(e) => onChange({ ...config, duration: parseInt(e.target.value) || 5 })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    disabled={disabled}
                />
                <p className="text-white/50 text-sm">
                    Typical range: 3-10 seconds
                </p>
            </div>

            {/* Generate Button */}
            <Button
                onClick={onGenerate}
                disabled={disabled || !config.prompt.trim()}
                className="w-full h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-white text-lg font-semibold rounded-xl disabled:opacity-50"
            >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Video
            </Button>
        </motion.div>
    );
}