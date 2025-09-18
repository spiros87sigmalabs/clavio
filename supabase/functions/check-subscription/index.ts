import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, ensuring local state is inactive/free");

      // Ensure a subscriptions row exists and is inactive
      const { data: existingSub, error: getSubErr } = await supabaseClient
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (getSubErr) {
        logStep("Error checking existing subscription row", { error: getSubErr });
      }

      if (existingSub) {
        const { error: updateErr } = await supabaseClient
          .from('subscriptions')
          .update({ status: 'inactive' })
          .eq('user_id', user.id);
        if (updateErr) logStep("Error updating subscription to inactive", { error: updateErr });
      } else {
        const { error: insertErr } = await supabaseClient
          .from('subscriptions')
          .insert({ user_id: user.id, status: 'inactive' });
        if (insertErr) logStep("Error inserting inactive subscription row", { error: insertErr });
      }

      // Ensure a user_credits row exists and is free
      const { data: existingCredits, error: getCredsErr } = await supabaseClient
        .from('user_credits')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (getCredsErr) {
        logStep("Error checking existing credits row", { error: getCredsErr });
      }

      if (existingCredits) {
        const { error: updateCredsErr } = await supabaseClient
          .from('user_credits')
          .update({ subscription_type: 'free' })
          .eq('user_id', user.id);
        if (updateCredsErr) logStep("Error updating credits to free", { error: updateCredsErr });
      } else {
        const { error: insertCredsErr } = await supabaseClient
          .from('user_credits')
          .insert({ user_id: user.id, subscription_type: 'free' });
        if (insertCredsErr) logStep("Error inserting free credits row", { error: insertCredsErr });
      }

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      const periodEndSec = subscription?.current_period_end;
      const periodStartSec = subscription?.current_period_start;
      subscriptionEnd = typeof periodEndSec === 'number' ? new Date(periodEndSec * 1000).toISOString() : null;
      const subscriptionStartIso = typeof periodStartSec === 'number' ? new Date(periodStartSec * 1000).toISOString() : null;
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      // Get product ID from the subscription
      productId = subscription.items.data[0]?.price?.product ?? null;
      logStep("Determined subscription product", { productId });

      // Ensure a subscriptions row exists then update/insert
      const { data: existingSub, error: getSubErr } = await supabaseClient
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (getSubErr) logStep("Error checking existing subscription row", { error: getSubErr });

      if (existingSub) {
        const { error: updateErr } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_product_id: productId,
            current_period_start: subscriptionStartIso,
            current_period_end: subscriptionEnd,
          })
          .eq('user_id', user.id);
        if (updateErr) logStep("Error updating subscription", { error: updateErr });
      } else {
        const { error: insertErr } = await supabaseClient
          .from('subscriptions')
          .insert({
            user_id: user.id,
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_product_id: productId,
            current_period_start: subscriptionStartIso,
            current_period_end: subscriptionEnd,
          });
        if (insertErr) logStep("Error inserting subscription", { error: insertErr });
      }

      // Ensure user_credits row exists then update/insert to pro
      const { data: existingCredits, error: getCredsErr } = await supabaseClient
        .from('user_credits')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (getCredsErr) logStep("Error checking existing credits row", { error: getCredsErr });

      if (existingCredits) {
        const { error: updateCredsErr } = await supabaseClient
          .from('user_credits')
          .update({ subscription_type: 'pro' })
          .eq('user_id', user.id);
        if (updateCredsErr) logStep("Error updating credits", { error: updateCredsErr });
      } else {
        const { error: insertCredsErr } = await supabaseClient
          .from('user_credits')
          .insert({ user_id: user.id, subscription_type: 'pro' });
        if (insertCredsErr) logStep("Error inserting credits", { error: insertCredsErr });
      }
    } else {
      logStep("No active subscription found");

      // Ensure a subscriptions row exists then set to inactive
      const { data: existingSub, error: getSubErr } = await supabaseClient
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (getSubErr) logStep("Error checking existing subscription row", { error: getSubErr });

      if (existingSub) {
        const { error: updateErr } = await supabaseClient
          .from('subscriptions')
          .update({ status: 'inactive', stripe_customer_id: customerId })
          .eq('user_id', user.id);
        if (updateErr) logStep("Error updating subscription", { error: updateErr });
      } else {
        const { error: insertErr } = await supabaseClient
          .from('subscriptions')
          .insert({ user_id: user.id, status: 'inactive', stripe_customer_id: customerId });
        if (insertErr) logStep("Error inserting subscription", { error: insertErr });
      }

      // Ensure user_credits row exists then set to free
      const { data: existingCredits, error: getCredsErr } = await supabaseClient
        .from('user_credits')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (getCredsErr) logStep("Error checking existing credits row", { error: getCredsErr });

      if (existingCredits) {
        const { error: updateCredsErr } = await supabaseClient
          .from('user_credits')
          .update({ subscription_type: 'free' })
          .eq('user_id', user.id);
        if (updateCredsErr) logStep("Error updating credits", { error: updateCredsErr });
      } else {
        const { error: insertCredsErr } = await supabaseClient
          .from('user_credits')
          .insert({ user_id: user.id, subscription_type: 'free' });
        if (insertCredsErr) logStep("Error inserting credits", { error: insertCredsErr });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});