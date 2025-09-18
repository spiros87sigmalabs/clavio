import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      throw new Error('No prompt provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating AI reasoning for prompt:', prompt);

    // Call OpenAI to generate reasoning about the user's request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
        {
          role: 'system',
          content: `You are an AI assistant that provides brief reasoning for creating landing pages. When given a user request, analyze it and provide your reasoning process in a very concise manner. 

Your reasoning should:
- Be MAXIMUM 3 short lines (about 10-15 words each)
- Analyze what the user wants quickly
- Mention key design/approach considerations
- Be conversational but extremely brief

Format: Start with "Analyzing..." and keep it super short and focused.

Example:
"Analyzing your request for a SaaS landing page.
I'll focus on modern design with conversion elements.
Creating a clean, professional layout now..."`
        },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 60,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reasoning = data.choices[0].message.content;

    console.log('Generated reasoning:', reasoning);

    return new Response(JSON.stringify({ reasoning }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-reasoning function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      reasoning: `Analyzing your request...\nPlanning the best approach for your page.\nGenerating your design now...`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});