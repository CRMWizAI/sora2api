import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Sparkles, History, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import ImageUploader from '../components/upload/ImageUploader';
import ConfigPanel from '../components/video/ConfigPanel';
import GenerationStatus from '../components/video/GenerationStatus';
import VideoPreview from '../components/video/VideoPreview';

export default function VideoGenerator() {
    const [activeTab, setActiveTab] = useState('create');
    const [imageUrl, setImageUrl] = useState(null);
    const [config, setConfig] = useState({
        prompt: '',
        aspect_ratio: '16:9',
        duration: 4
    });
    const [generating, setGenerating] = useState(false);
    const [currentGeneration, setCurrentGeneration] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        if (currentGeneration?.status === 'processing') {
            const interval = setInterval(() => {
                checkGenerationStatus();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [currentGeneration]);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const generations = await base44.entities.VideoGeneration.list('-created_date', 50);
            setHistory(generations);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleGenerate = async () => {
        if (!imageUrl || !config.prompt.trim()) {
            alert('Please upload an image and provide a prompt');
            return;
        }

        setGenerating(true);
        try {
            const response = await base44.functions.invoke('generateVideo', {
                action: 'create',
                image_url: imageUrl,
                prompt: config.prompt,
                aspect_ratio: config.aspect_ratio,
                duration: config.duration
            });

            if (response.data.success) {
                setCurrentGeneration({
                    id: response.data.generation_id,
                    status: 'processing'
                });
            }
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Failed to start video generation. Please try again.');
            setGenerating(false);
        }
    };

    const checkGenerationStatus = async () => {
        if (!currentGeneration?.id) return;

        try {
            const response = await base44.functions.invoke('generateVideo', {
                action: 'check_status',
                generationId: currentGeneration.id
            });

            const { status, video_url, error_message } = response.data;

            setCurrentGeneration({
                ...currentGeneration,
                status,
                video_url,
                error_message
            });

            if (status === 'completed' || status === 'failed') {
                setGenerating(false);
                loadHistory();
            }
        } catch (error) {
            console.error('Status check failed:', error);
        }
    };

    const resetForm = () => {
        setImageUrl(null);
        setConfig({
            prompt: '',
            aspect_ratio: '16:9',
            duration: 4
        });
        setCurrentGeneration(null);
        setGenerating(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-3xl"
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-white/80 text-sm font-medium">Powered by Sora AI</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                        AI Video Generator
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto">
                        Transform your images into stunning videos with the power of artificial intelligence
                    </p>
                </motion.div>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20 p-1">
                        <TabsTrigger value="create" className="data-[state=active]:bg-purple-500/50">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Video
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-purple-500/50">
                            <History className="w-4 h-4 mr-2" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="space-y-8">
                        <AnimatePresence mode="wait">
                            {!generating && !currentGeneration ? (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-8"
                                >
                                    {/* Step 1: Select Format First */}
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm">1</span>
                                            Select Video Format
                                        </h2>
                                        <ConfigPanel
                                            config={config}
                                            onChange={setConfig}
                                            onGenerate={handleGenerate}
                                            disabled={false}
                                            showOnlyFormat={true}
                                        />
                                    </div>

                                    {/* Step 2: Upload Image (only after format is selected) */}
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm">2</span>
                                            Upload Image
                                        </h2>
                                        <ImageUploader 
                                            onImageUploaded={setImageUrl} 
                                            aspectRatio={config.aspect_ratio}
                                        />
                                    </div>

                                    {/* Step 3: Configure Rest */}
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm">3</span>
                                            Configure Video
                                        </h2>
                                        <ConfigPanel
                                            config={config}
                                            onChange={setConfig}
                                            onGenerate={handleGenerate}
                                            disabled={!imageUrl}
                                            showOnlyPrompt={true}
                                        />
                                    </div>
                                </motion.div>
                            ) : generating || currentGeneration?.status === 'processing' ? (
                                <motion.div
                                    key="generating"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <GenerationStatus status="processing" />
                                </motion.div>
                            ) : currentGeneration?.status === 'completed' ? (
                                <motion.div
                                    key="completed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <VideoPreview
                                        videoUrl={currentGeneration.video_url}
                                        prompt={config.prompt}
                                    />
                                    <div className="flex justify-center">
                                        <Button
                                            onClick={resetForm}
                                            variant="outline"
                                            className="border-white/20 text-white hover:bg-white/10"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Another Video
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : currentGeneration?.status === 'failed' ? (
                                <motion.div
                                    key="failed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <GenerationStatus
                                        status="failed"
                                        error={currentGeneration.error_message}
                                    />
                                    <div className="flex justify-center">
                                        <Button
                                            onClick={resetForm}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">Generation History</h2>
                            
                            {loadingHistory ? (
                                <div className="text-center py-12 text-white/60">
                                    Loading history...
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/20">
                                    <Sparkles className="w-12 h-12 text-white/40 mx-auto mb-4" />
                                    <p className="text-white/60">No videos generated yet</p>
                                    <Button
                                        onClick={() => setActiveTab('create')}
                                        className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500"
                                    >
                                        Create Your First Video
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {history.map((gen) => (
                                        <Card
                                            key={gen.id}
                                            className="bg-white/5 backdrop-blur-sm border-white/20 overflow-hidden hover:bg-white/10 transition-all"
                                        >
                                            {gen.status === 'completed' && gen.video_url ? (
                                                <video
                                                    src={gen.video_url}
                                                    className="w-full h-48 object-cover"
                                                    muted
                                                />
                                            ) : (
                                                <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                                    <Sparkles className="w-12 h-12 text-white/40" />
                                                </div>
                                            )}
                                            <div className="p-4 space-y-2">
                                                <p className="text-white/80 text-sm line-clamp-2">
                                                    {gen.prompt}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-white/50">
                                                    <span>{gen.aspect_ratio}</span>
                                                    <span>{format(new Date(gen.created_date), 'MMM d, yyyy')}</span>
                                                </div>
                                                {gen.status === 'completed' && (
                                                    <Button
                                                        onClick={() => {
                                                            const a = document.createElement('a');
                                                            a.href = gen.video_url;
                                                            a.download = `video-${gen.id}.mp4`;
                                                            a.click();
                                                        }}
                                                        size="sm"
                                                        className="w-full bg-purple-500 hover:bg-purple-600"
                                                    >
                                                        Download
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}