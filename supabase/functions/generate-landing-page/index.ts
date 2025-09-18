import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { prompt, existingCode = '', actionType = 'generate', isStreaming = false } = await req.json();
    
    // Check authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required. Please log in to use AI generation.',
        needsAuth: true 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ 
        error: 'Invalid authentication. Please log in again.',
        needsAuth: true 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = userData.user;
    console.log('Authenticated user:', { userId: user.id, email: user.email });

    // Check and consume credits
    try {
      // First check if user has credits
      const { data: creditsData, error: creditsError } = await supabaseClient
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creditsError) {
        console.error('Error fetching credits:', creditsError);
        return new Response(JSON.stringify({ 
          error: 'Failed to check credits. Please try again.',
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!creditsData) {
        return new Response(JSON.stringify({ 
          error: 'User credits not found. Please contact support.',
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Reset daily credits if needed
      let updatedCredits = { ...creditsData };
      if (creditsData.last_daily_reset !== today) {
        updatedCredits.daily_credits_used = 0;
        updatedCredits.last_daily_reset = today;
      }

      // Reset monthly credits if needed (for Pro users)
      const lastResetMonth = creditsData.last_monthly_reset.slice(0, 7);
      if (creditsData.subscription_type === 'pro' && lastResetMonth !== currentMonth) {
        updatedCredits.monthly_credits_used = 0;
        updatedCredits.last_monthly_reset = today;
      }

      // Check if user can consume a credit
      const availableDailyCredits = Math.max(0, 5 - updatedCredits.daily_credits_used);
      const availableMonthlyCredits = creditsData.subscription_type === 'pro' 
        ? Math.max(0, 100 - updatedCredits.monthly_credits_used) 
        : 0;

      if (availableDailyCredits === 0 && availableMonthlyCredits === 0) {
        console.log('No credits available for user:', user.id);
        return new Response(JSON.stringify({ 
          error: 'No credits available',
          needsUpgrade: creditsData.subscription_type === 'free',
          noCredits: true
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Consume a credit (prefer monthly for Pro users if available)
      if (creditsData.subscription_type === 'pro' && availableMonthlyCredits > 0) {
        updatedCredits.monthly_credits_used += 1;
        console.log('Monthly credit consumed for user:', user.id);
      } else {
        updatedCredits.daily_credits_used += 1;
        console.log('Daily credit consumed for user:', user.id);
      }

      // Update the database
      const { error: updateError } = await supabaseClient
        .from('user_credits')
        .update(updatedCredits)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating credits:', updateError);
        return new Response(JSON.stringify({ 
          error: 'Failed to update credits. Please try again.',
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Credit consumed successfully for user:', user.id);
    } catch (creditError) {
      console.error('Error managing credits:', creditError);
      return new Response(JSON.stringify({ 
        error: 'Failed to process credits. Please try again.',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!prompt) {
      return new Response(JSON.stringify({ 
        error: 'No prompt provided' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        error: 'AI service temporarily unavailable' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Received request:', { prompt, actionType, hasExistingCode: !!existingCode });

    let systemPrompt = '';
    let userMessage = '';

    if (actionType === 'edit' && existingCode) {
      // For editing existing code - targeted changes
      systemPrompt = `You are an expert web developer that makes precise, targeted edits to HTML code.

CRITICAL INSTRUCTIONS FOR EDITING:
1. First, ANALYZE the existing code and understand its structure
2. Provide clear REASONING about what specific changes are needed
3. Make ONLY the necessary changes - don't rewrite the entire code
4. Preserve all existing functionality, styling, and animations that aren't being modified
5. Return complete updated HTML code with only the requested changes applied
6. Maintain the same code structure, formatting style, and design patterns
7. When adding images, use placeholder images with https://placehold.co/ service (e.g., https://placehold.co/600x400/png?text=Sample+Image)
8. Add images that suit the content context (hero images, feature images, team photos, product shots, etc.)
9. Make sure image alt text is descriptive and relevant
10. Use appropriate image dimensions for each section

FORMAT YOUR RESPONSE AS:
REASONING: [Explain what you understand from the request and what specific changes you'll make]

\`\`\`html
[Complete updated HTML code with only the requested changes]
\`\`\`

When making changes:
- If adding a section, insert it in the appropriate location within existing structure
- If modifying styles/colors, update only the specific elements/classes mentioned
- If changing content, replace only the specified parts
- Keep all responsive design, animations, gradients, and existing features intact
- Use the same CSS framework and styling approach as the existing code`;

      userMessage = `EXISTING HTML CODE:
\`\`\`html
${existingCode}
\`\`\`

USER REQUEST: ${prompt}

Please analyze the existing code and make only the specific changes requested. First explain your reasoning, then provide the updated HTML code.`;
    } else {
      // For generating new code from scratch  
      systemPrompt = `You are an expert web developer specializing in creating beautiful, modern landing pages using HTML and Tailwind CSS.

CRITICAL INSTRUCTIONS:
- Generate ONLY valid HTML with Tailwind CSS classes
- Create responsive, mobile-first designs
- Use modern design patterns with proper spacing, typography, and color schemes
- Include semantic HTML structure
- Make it visually appealing with gradients, shadows, and animations where appropriate
- Always include a proper DOCTYPE, head section with meta tags, and full HTML structure
- Use Tailwind's utility classes exclusively - no custom CSS
- Create professional, conversion-focused landing pages
- Include sections like hero, features, testimonials, pricing, footer as relevant
- When images are needed, use placeholder images with https://placehold.co/ service (e.g., https://placehold.co/600x400/png?text=Sample+Image)
- Add images that suit the content (hero images, feature images, team photos, product shots, etc.)
- Make sure image alt text is descriptive and relevant
- Use appropriate image dimensions for each section (wide for heroes, square for team, etc.)

Return ONLY the HTML code, no explanations or markdown formatting.`;

      userMessage = prompt;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        stream: isStreaming,
        max_tokens: actionType === 'edit' ? 4000 : 3000, // More tokens for reasoning
        temperature: actionType === 'edit' ? 0.3 : 0.7, // Lower temperature for consistent edits
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    if (isStreaming) {
      // Create a ReadableStream to handle streaming response
      const stream = new ReadableStream({
        start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                  controller.close();
                  break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    
                    if (data === '[DONE]') {
                      controller.close();
                      return;
                    }

                    try {
                      const parsed = JSON.parse(data);
                      const content = parsed.choices?.[0]?.delta?.content;
                      
                      if (content) {
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content, actionType })}\n\n`));
                      }
                    } catch (e) {
                      // Skip invalid JSON lines
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Streaming error:', error);
              controller.error(error);
            }
          };

          pump();
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      console.log('Generated content length:', content.length);

      // Extract reasoning and code if it's an edit request
      let reasoning = '';
      let code = content;
      
      if (actionType === 'edit') {
        const reasoningMatch = content.match(/REASONING:\s*(.*?)(?=```|$)/is);
        const codeMatch = content.match(/```html\s*([\s\S]*?)```/);
        
        if (reasoningMatch) {
          reasoning = reasoningMatch[1].trim();
        }
        
        if (codeMatch) {
          code = codeMatch[1].trim();
        }
      }

      return new Response(JSON.stringify({ 
        content: code,
        reasoning: reasoning,
        actionType: actionType,
        usage: data.usage 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in generate-landing-page function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});