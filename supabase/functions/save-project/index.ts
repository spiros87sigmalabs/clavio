import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAVE-PROJECT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has Pro Plan
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('status, stripe_product_id')
      .eq('user_id', user.id)
      .single();

    const isProUser = subscription?.status === 'active';
    if (!isProUser) {
      return new Response(JSON.stringify({ 
        error: "Pro Plan required", 
        requiresUpgrade: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Pro Plan verified");

    const { project_name, html_content } = await req.json();
    if (!project_name || !html_content) {
      throw new Error("Missing project_name or html_content");
    }

    // Save or update project
    const { data: existingProject } = await supabaseClient
      .from('saved_projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_name', project_name)
      .single();

    let result;
    if (existingProject) {
      // Update existing project
      result = await supabaseClient
        .from('saved_projects')
        .update({ 
          html_content,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProject.id)
        .select()
        .single();
    } else {
      // Create new project
      result = await supabaseClient
        .from('saved_projects')
        .insert({
          user_id: user.id,
          project_name,
          html_content
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    logStep("Project saved successfully", { projectId: result.data.id });

    return new Response(JSON.stringify({ 
      success: true, 
      project: result.data 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in save-project", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});