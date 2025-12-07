import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageUploader({ onImageUploaded }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFile = async (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPG, PNG)');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Upload to server
        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            onImageUploaded(file_url);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image. Please try again.');
            setPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const clearImage = () => {
        setPreview(null);
        onImageUploaded(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!preview ? (
                    <motion.div
                        key="uploader"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
                            isDragging 
                                ? 'border-purple-500 bg-purple-500/10' 
                                : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Upload className="w-10 h-10 text-white" />
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Upload Your Image
                                </h3>
                                <p className="text-white/60">
                                    Drag and drop or click to browse
                                </p>
                                <p className="text-white/40 text-sm mt-1">
                                    Supports JPG, PNG
                                </p>
                            </div>
                            
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Choose Image'}
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative rounded-3xl overflow-hidden bg-white/5 border border-white/20"
                    >
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-auto max-h-96 object-contain"
                        />
                        
                        <Button
                            onClick={clearImage}
                            size="icon"
                            variant="ghost"
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                            <div className="flex items-center gap-2 text-white">
                                <ImageIcon className="w-5 h-5" />
                                <span className="font-medium">Image uploaded successfully</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}