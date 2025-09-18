import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DOWNLOAD-PROJECT] ${step}${detailsStr}`);
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

    const { html_content, project_name } = await req.json();
    if (!html_content) {
      throw new Error("Missing html_content");
    }

    const projectFileName = project_name || 'landing-page';

    // Create a complete HTML file with proper structure
    const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectFileName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
    }
    
    /* Animation Styles */
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.6s ease-out forwards;
    }
    
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
    
    /* Responsive utilities */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    @media (max-width: 768px) {
      .md\\:grid-cols-2 { grid-template-columns: 1fr; }
      .md\\:grid-cols-3 { grid-template-columns: 1fr; }
      .md\\:grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
      .md\\:text-6xl { font-size: 3rem; }
      .md\\:text-7xl { font-size: 3.5rem; }
      .lg\\:grid-cols-2 { grid-template-columns: 1fr; }
      .hidden.md\\:flex { display: none; }
      .flex-col.sm\\:flex-row { flex-direction: column; }
    }
  </style>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${html_content}
</body>
</html>`;

    logStep("HTML file prepared", { fileName: projectFileName });

    return new Response(JSON.stringify({ 
      success: true, 
      html: completeHtml,
      filename: `${projectFileName}.html`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in download-project", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});