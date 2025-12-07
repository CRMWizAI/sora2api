import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API_BASE = "https://api.openai.com/v1";

Deno.serve(async (req) => {
    try {
        console.log('[DEBUG] Function invoked');
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            console.log('[DEBUG] Unauthorized - no user');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('[DEBUG] User authenticated:', user.email);

        const body = await req.json();
        console.log('[DEBUG] Request body:', JSON.stringify(body));
        
        const { action, generationId, image_url, prompt, aspect_ratio, duration } = body;

        // Handle different actions: create or check status
        if (action === 'create') {
            console.log('[DEBUG] Action: create video');
            console.log('[DEBUG] Prompt:', prompt);
            console.log('[DEBUG] Image URL:', image_url);
            console.log('[DEBUG] Aspect ratio:', aspect_ratio);
            console.log('[DEBUG] Duration:', duration);

            // Prepare the size parameter
            const size = aspect_ratio === "16:9" ? "1280x720" : "720x1280";
            console.log('[DEBUG] Calculated size:', size);

            // Fetch the image file if provided
            let formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('model', 'sora-2');
            formData.append('seconds', String(duration || 4));
            formData.append('size', size);

            // Download and attach the image if provided
            if (image_url) {
                console.log('[DEBUG] Fetching image from URL...');
                try {
                    const imageResponse = await fetch(image_url);
                    if (!imageResponse.ok) {
                        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
                    }
                    
                    // Get content type from response
                    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
                    console.log('[DEBUG] Image content type:', contentType);
                    
                    const imageArrayBuffer = await imageResponse.arrayBuffer();
                    console.log('[DEBUG] Image fetched, size:', imageArrayBuffer.byteLength, 'bytes');
                    
                    // Create blob with proper MIME type
                    const imageBlob = new Blob([imageArrayBuffer], { type: contentType });
                    console.log('[DEBUG] Created blob with type:', imageBlob.type);
                    
                    // Determine file extension
                    const extension = contentType.includes('png') ? 'png' : 
                                     contentType.includes('webp') ? 'webp' : 'jpg';
                    
                    formData.append('input_reference', imageBlob, `reference.${extension}`);
                } catch (imageError) {
                    console.error('[ERROR] Failed to fetch image:', imageError);
                    return Response.json({ 
                        error: 'Failed to fetch reference image',
                        details: imageError.message
                    }, { status: 500 });
                }
            }

            console.log('[DEBUG] Calling OpenAI API to create video...');
            
            // Call OpenAI API to create video
            const createResponse = await fetch(`${OPENAI_API_BASE}/videos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: formData
            });

            console.log('[DEBUG] OpenAI API response status:', createResponse.status);
            
            const responseText = await createResponse.text();
            console.log('[DEBUG] OpenAI API response body:', responseText);

            if (!createResponse.ok) {
                console.error('[ERROR] OpenAI API error:', responseText);
                return Response.json({ 
                    error: 'OpenAI API error',
                    status: createResponse.status,
                    details: responseText
                }, { status: 500 });
            }

            const videoJob = JSON.parse(responseText);
            console.log('[DEBUG] Video job created:', JSON.stringify(videoJob));

            // Create database record
            console.log('[DEBUG] Creating database record...');
            const generation = await base44.entities.VideoGeneration.create({
                image_url,
                prompt,
                aspect_ratio,
                duration: duration || 4,
                status: 'processing',
                job_id: videoJob.id
            });

            console.log('[DEBUG] Database record created:', generation.id);

            return Response.json({ 
                success: true,
                generation_id: generation.id,
                job_id: videoJob.id,
                debug: {
                    video_job: videoJob
                }
            });

        } else if (action === 'check_status') {
            console.log('[DEBUG] Action: check_status');
            console.log('[DEBUG] Generation ID:', generationId);

            // Check generation status
            const generation = await base44.entities.VideoGeneration.filter({ id: generationId });
            
            if (!generation || generation.length === 0) {
                console.log('[DEBUG] Generation not found in database');
                return Response.json({ error: 'Generation not found' }, { status: 404 });
            }

            const gen = generation[0];
            console.log('[DEBUG] Found generation:', JSON.stringify(gen));

            // If already completed or failed, return current status
            if (gen.status === 'completed' || gen.status === 'failed') {
                console.log('[DEBUG] Generation already finished with status:', gen.status);
                return Response.json({ 
                    status: gen.status,
                    video_url: gen.video_url,
                    error_message: gen.error_message
                });
            }

            try {
                console.log('[DEBUG] Checking video status with OpenAI API...');
                console.log('[DEBUG] Job ID:', gen.job_id);
                
                // Check with OpenAI API
                const statusResponse = await fetch(`${OPENAI_API_BASE}/videos/${gen.job_id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`
                    }
                });

                console.log('[DEBUG] Status check response status:', statusResponse.status);
                
                const statusText = await statusResponse.text();
                console.log('[DEBUG] Status check response body:', statusText);

                if (!statusResponse.ok) {
                    console.error('[ERROR] Failed to check status:', statusText);
                    return Response.json({
                        status: 'processing',
                        message: 'Still processing...',
                        progress: gen.progress || 0
                    });
                }

                const videoJob = JSON.parse(statusText);
                console.log('[DEBUG] Video job status:', videoJob.status);
                console.log('[DEBUG] Video job progress:', videoJob.progress);
                
                if (videoJob.status === 'completed') {
                    console.log('[DEBUG] Video generation completed!');
                    
                    // Download the video content
                    console.log('[DEBUG] Downloading video content...');
                    const contentUrl = `${OPENAI_API_BASE}/videos/${gen.job_id}/content`;
                    console.log('[DEBUG] Content URL:', contentUrl);
                    
                    const contentResponse = await fetch(contentUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${OPENAI_API_KEY}`
                        }
                    });

                    console.log('[DEBUG] Content download response status:', contentResponse.status);

                    if (contentResponse.ok) {
                        const videoBlob = await contentResponse.blob();
                        console.log('[DEBUG] Video downloaded, size:', videoBlob.size, 'bytes');
                        
                        // Upload video to Base44 storage
                        console.log('[DEBUG] Uploading video to Base44 storage...');
                        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ 
                            file: videoBlob 
                        });
                        console.log('[DEBUG] Video uploaded to:', file_url);

                        // Update database with completed video
                        await base44.asServiceRole.entities.VideoGeneration.update(generationId, {
                            status: 'completed',
                            video_url: file_url
                        });

                        console.log('[DEBUG] Database updated with completed status');

                        return Response.json({
                            status: 'completed',
                            video_url: file_url
                        });
                    } else {
                        console.error('[ERROR] Failed to download video content');
                        const errorText = await contentResponse.text();
                        console.error('[ERROR] Content download error:', errorText);
                    }
                } else if (videoJob.status === 'failed') {
                    console.log('[DEBUG] Video generation failed');
                    const errorMessage = videoJob.error?.message || 'Video generation failed';
                    console.log('[DEBUG] Error message:', errorMessage);
                    
                    await base44.asServiceRole.entities.VideoGeneration.update(generationId, {
                        status: 'failed',
                        error_message: errorMessage
                    });

                    return Response.json({
                        status: 'failed',
                        error_message: errorMessage
                    });
                } else {
                    // Still processing
                    console.log('[DEBUG] Video still processing, progress:', videoJob.progress);
                    return Response.json({
                        status: 'processing',
                        progress: videoJob.progress || 0
                    });
                }
            } catch (error) {
                console.error('[ERROR] Error checking status:', error);
                console.error('[ERROR] Error stack:', error.stack);
                // Error checking status, assume still processing
                return Response.json({
                    status: 'processing',
                    message: 'Checking status...'
                });
            }
        }

        console.log('[DEBUG] Invalid action:', action);
        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('[ERROR] Generation error:', error);
        console.error('[ERROR] Error stack:', error.stack);
        return Response.json({ 
            error: error.message || 'Video generation failed',
            details: error.toString(),
            stack: error.stack
        }, { status: 500 });
    }
});