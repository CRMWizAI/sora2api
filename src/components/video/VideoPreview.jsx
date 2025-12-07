import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VideoPreview({ videoUrl, prompt }) {
    const handleDownload = async () => {
        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-video-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download video. Please try again.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Video Player */}
            <div className="relative rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl max-w-2xl mx-auto">
                <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-auto max-h-[600px]"
                >
                    Your browser does not support video playback.
                </video>

                {/* Overlay gradient */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Info and Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <Play className="w-5 h-5 text-purple-400" />
                        Your Generated Video
                    </h3>
                    <p className="text-white/60 text-sm line-clamp-2">
                        {prompt}
                    </p>
                </div>
                
                <Button
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shrink-0"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Video
                </Button>
            </div>
        </motion.div>
    );
}