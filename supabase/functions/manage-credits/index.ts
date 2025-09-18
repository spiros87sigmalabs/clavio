import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-CREDITS] ${step}${detailsStr}`);
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
    if (!user) throw new Error("User not authenticated");
    
    const { action } = await req.json();
    logStep("User authenticated and action received", { userId: user.id, action });

    // Get user credits
    const { data: credits, error: creditsError } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (creditsError) {
      logStep("Error fetching credits", { error: creditsError });
      throw new Error(`Failed to fetch user credits: ${creditsError.message}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Reset daily credits if needed
    let updatedCredits = { ...credits };
    if (credits.last_daily_reset !== today) {
      updatedCredits.daily_credits_used = 0;
      updatedCredits.last_daily_reset = today;
      logStep("Daily credits reset", { userId: user.id });
    }

    // Reset monthly credits if needed (for Pro users)
    const lastResetMonth = credits.last_monthly_reset.slice(0, 7);
    if (credits.subscription_type === 'pro' && lastResetMonth !== currentMonth) {
      updatedCredits.monthly_credits_used = 0;
      updatedCredits.last_monthly_reset = today;
      logStep("Monthly credits reset", { userId: user.id });
    }

    if (action === 'check') {
      // Just return current status
      const availableDailyCredits = Math.max(0, 5 - updatedCredits.daily_credits_used);
      const availableMonthlyCredits = credits.subscription_type === 'pro' 
        ? Math.max(0, 100 - updatedCredits.monthly_credits_used) 
        : 0;

      // Update credits if they were reset
      if (updatedCredits.daily_credits_used !== credits.daily_credits_used || 
          updatedCredits.monthly_credits_used !== credits.monthly_credits_used) {
        await supabaseClient
          .from('user_credits')
          .update(updatedCredits)
          .eq('user_id', user.id);
      }

      return new Response(JSON.stringify({
        canUseCredit: availableDailyCredits > 0 || availableMonthlyCredits > 0,
        dailyCreditsUsed: updatedCredits.daily_credits_used,
        monthlyCreditsUsed: updatedCredits.monthly_credits_used,
        subscriptionType: credits.subscription_type,
        availableDailyCredits,
        availableMonthlyCredits,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'consume') {
      // Check if user can consume a credit
      const availableDailyCredits = Math.max(0, 5 - updatedCredits.daily_credits_used);
      const availableMonthlyCredits = credits.subscription_type === 'pro' 
        ? Math.max(0, 100 - updatedCredits.monthly_credits_used) 
        : 0;

      if (availableDailyCredits === 0 && availableMonthlyCredits === 0) {
        logStep("No credits available", { 
          userId: user.id, 
          dailyUsed: updatedCredits.daily_credits_used,
          monthlyUsed: updatedCredits.monthly_credits_used,
          subscriptionType: credits.subscription_type
        });
        return new Response(JSON.stringify({
          success: false,
          message: "No credits available",
          needsUpgrade: credits.subscription_type === 'free'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }

      // Consume a credit (prefer monthly for Pro users if available)
      if (credits.subscription_type === 'pro' && availableMonthlyCredits > 0) {
        updatedCredits.monthly_credits_used += 1;
        logStep("Monthly credit consumed", { userId: user.id, newUsed: updatedCredits.monthly_credits_used });
      } else {
        updatedCredits.daily_credits_used += 1;
        logStep("Daily credit consumed", { userId: user.id, newUsed: updatedCredits.daily_credits_used });
      }

      // Update the database
      const { error: updateError } = await supabaseClient
        .from('user_credits')
        .update(updatedCredits)
        .eq('user_id', user.id);

      if (updateError) {
        logStep("Error updating credits", { error: updateError });
        throw new Error(`Failed to update credits: ${updateError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        dailyCreditsUsed: updatedCredits.daily_credits_used,
        monthlyCreditsUsed: updatedCredits.monthly_credits_used,
        subscriptionType: credits.subscription_type,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Invalid action: ${action}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in manage-credits", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});