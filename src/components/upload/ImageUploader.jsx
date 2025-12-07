import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageUploader({ onImageUploaded, aspectRatio }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [resizing, setResizing] = useState(false);
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

    const resizeImage = (file) => {
        return new Promise((resolve, reject) => {
            console.log('[RESIZE] Starting image resize process');
            console.log('[RESIZE] File type:', file.type, 'Size:', file.size);
            console.log('[RESIZE] Target aspect ratio:', aspectRatio);
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                console.log('[RESIZE] File read complete, creating image');
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // Calculate target dimensions based on aspect ratio
                        const targetWidth = aspectRatio === '16:9' ? 1280 : 720;
                        const targetHeight = aspectRatio === '16:9' ? 720 : 1280;

                        console.log('[RESIZE] Original image:', img.width, 'x', img.height);
                        console.log('[RESIZE] Target dimensions:', targetWidth, 'x', targetHeight);

                        // Create canvas with target dimensions
                        const canvas = document.createElement('canvas');
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                        const ctx = canvas.getContext('2d');

                        if (!ctx) {
                            throw new Error('Failed to get canvas context');
                        }

                        // Calculate scaling to cover the entire canvas
                        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
                        const scaledWidth = img.width * scale;
                        const scaledHeight = img.height * scale;

                        // Center the image
                        const x = (targetWidth - scaledWidth) / 2;
                        const y = (targetHeight - scaledHeight) / 2;

                        console.log('[RESIZE] Scale:', scale, 'Scaled dimensions:', scaledWidth, 'x', scaledHeight);
                        console.log('[RESIZE] Position:', x, y);

                        // Draw and crop
                        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

                        console.log('[RESIZE] Image drawn on canvas, converting to blob');

                        // Convert to blob
                        canvas.toBlob((blob) => {
                            if (blob) {
                                console.log('[RESIZE] Blob created successfully, size:', blob.size);
                                resolve(blob);
                            } else {
                                console.error('[RESIZE] Failed to create blob from canvas');
                                reject(new Error('Failed to create blob from canvas'));
                            }
                        }, 'image/jpeg', 0.95);
                    } catch (error) {
                        console.error('[RESIZE] Error during canvas operations:', error);
                        reject(error);
                    }
                };
                
                img.onerror = (error) => {
                    console.error('[RESIZE] Failed to load image:', error);
                    reject(new Error('Failed to load image for resizing'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = (error) => {
                console.error('[RESIZE] FileReader error:', error);
                reject(new Error('Failed to read image file'));
            };
            
            reader.readAsDataURL(file);
        });
    };

    const handleFile = async (file) => {
        console.log('[UPLOAD] File selected:', file.name, file.type, file.size);
        
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPG, PNG)');
            return;
        }

        if (!aspectRatio) {
            alert('Please select a video format first');
            return;
        }

        console.log('[UPLOAD] Starting resize with aspect ratio:', aspectRatio);
        setResizing(true);
        
        try {
            // Resize the image to exact dimensions
            console.log('[UPLOAD] Calling resizeImage...');
            const resizedBlob = await resizeImage(file);
            console.log('[UPLOAD] Resize complete, creating preview');
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('[UPLOAD] Preview created');
                setPreview(e.target.result);
            };
            reader.readAsDataURL(resizedBlob);

            // Upload resized image to server
            console.log('[UPLOAD] Starting upload to server');
            setUploading(true);
            const { file_url } = await base44.integrations.Core.UploadFile({ file: resizedBlob });
            console.log('[UPLOAD] Upload complete, URL:', file_url);
            onImageUploaded(file_url);
        } catch (error) {
            console.error('[UPLOAD] Processing failed:', error);
            console.error('[UPLOAD] Error stack:', error.stack);
            alert(`Failed to process image: ${error.message}`);
            setPreview(null);
        } finally {
            setResizing(false);
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
                                disabled={uploading || resizing || !aspectRatio}
                            >
                                {resizing ? 'Processing...' : uploading ? 'Uploading...' : 'Choose Image'}
                            </Button>
                            {!aspectRatio && (
                                <p className="text-white/60 text-sm mt-2">
                                    Select a video format above first
                                </p>
                            )}
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