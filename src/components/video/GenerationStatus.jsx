import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';

export default function GenerationStatus({ status, error }) {
    const statusConfig = {
        processing: {
            icon: Loader2,
            text: 'Creating your video...',
            subtext: 'This may take 1-2 minutes',
            color: 'text-purple-400',
            bg: 'bg-purple-500/20',
            spin: true
        },
        completed: {
            icon: CheckCircle,
            text: 'Video generated successfully!',
            subtext: 'Your video is ready',
            color: 'text-green-400',
            bg: 'bg-green-500/20',
            spin: false
        },
        failed: {
            icon: XCircle,
            text: 'Generation failed',
            subtext: error || 'Please try again',
            color: 'text-red-400',
            bg: 'bg-red-500/20',
            spin: false
        }
    };

    const config = statusConfig[status] || statusConfig.processing;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-3xl border border-white/20 ${config.bg} p-12 text-center backdrop-blur-sm`}
        >
            <div className="flex flex-col items-center gap-6">
                {/* Icon */}
                <div className="relative">
                    <motion.div
                        animate={config.spin ? { rotate: 360 } : {}}
                        transition={config.spin ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
                        className={`w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ${config.spin ? 'animate-pulse' : ''}`}
                    >
                        <Icon className={`w-12 h-12 ${config.color}`} />
                    </motion.div>
                    
                    {config.spin && (
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 -z-10"
                        />
                    )}
                </div>

                {/* Text */}
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {config.text}
                    </h3>
                    <p className="text-white/60">
                        {config.subtext}
                    </p>
                </div>

                {/* Progress Animation */}
                {config.spin && (
                    <div className="w-full max-w-md">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="h-full w-1/3 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                            />
                        </div>
                    </div>
                )}

                {/* Fun fact */}
                {config.spin && (
                    <div className="flex items-center gap-2 text-white/40 text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>AI is working its magic...</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}