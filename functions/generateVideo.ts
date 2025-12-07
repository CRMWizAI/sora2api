import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, generationId, image_url, prompt, aspect_ratio, duration } = await req.json();

        // Handle different actions: create or check status
        if (action === 'create') {
            // Start video generation
            const response = await openai.videos.generate({
                model: "sora-1.0-turbo",
                prompt: prompt,
                image: image_url,
                size: aspect_ratio === "16:9" ? "1920x1080" : 
                      aspect_ratio === "9:16" ? "1080x1920" : "1080x1080",
                duration: duration || 5
            });

            // Create database record
            const generation = await base44.entities.VideoGeneration.create({
                image_url,
                prompt,
                aspect_ratio,
                duration: duration || 5,
                status: 'processing',
                job_id: response.id
            });

            return Response.json({ 
                success: true,
                generation_id: generation.id,
                job_id: response.id
            });

        } else if (action === 'check_status') {
            // Check generation status
            const generation = await base44.entities.VideoGeneration.filter({ id: generationId });
            
            if (!generation || generation.length === 0) {
                return Response.json({ error: 'Generation not found' }, { status: 404 });
            }

            const gen = generation[0];

            // If already completed or failed, return current status
            if (gen.status === 'completed' || gen.status === 'failed') {
                return Response.json({ 
                    status: gen.status,
                    video_url: gen.video_url,
                    error_message: gen.error_message
                });
            }

            try {
                // Check with OpenAI API
                const video = await openai.videos.retrieve(gen.job_id);
                
                if (video.status === 'completed') {
                    // Update database with completed video
                    await base44.asServiceRole.entities.VideoGeneration.update(generationId, {
                        status: 'completed',
                        video_url: video.url
                    });

                    return Response.json({
                        status: 'completed',
                        video_url: video.url
                    });
                } else if (video.status === 'failed') {
                    await base44.asServiceRole.entities.VideoGeneration.update(generationId, {
                        status: 'failed',
                        error_message: video.error?.message || 'Video generation failed'
                    });

                    return Response.json({
                        status: 'failed',
                        error_message: video.error?.message || 'Video generation failed'
                    });
                } else {
                    // Still processing
                    return Response.json({
                        status: 'processing'
                    });
                }
            } catch (error) {
                // Error checking status
                return Response.json({
                    status: 'processing',
                    message: 'Checking status...'
                });
            }
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Generation error:', error);
        return Response.json({ 
            error: error.message || 'Video generation failed',
            details: error.toString()
        }, { status: 500 });
    }
});