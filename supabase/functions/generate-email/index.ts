// Supabase Edge Function: generate-email
// Handles LLM API calls for email generation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  prompt: string;
  systemPrompt: string;
  provider: "anthropic" | "openai" | "deepseek";
  brandId: string;
  emailType: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, systemPrompt, provider, brandId, emailType }: GenerateRequest = await req.json();

    // Get API keys from environment
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");

    let response;
    let model: string;
    let usage: { prompt_tokens?: number; completion_tokens?: number } = {};

    if (provider === "anthropic" && anthropicKey) {
      model = "claude-sonnet-4-20250514";
      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await anthropicResponse.json();
      
      if (!anthropicResponse.ok) {
        throw new Error(data.error?.message || "Anthropic API error");
      }

      response = JSON.parse(data.content[0].text);
      usage = {
        prompt_tokens: data.usage?.input_tokens,
        completion_tokens: data.usage?.output_tokens,
      };

    } else if (provider === "openai" && openaiKey) {
      model = "gpt-4o";
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      const data = await openaiResponse.json();
      
      if (!openaiResponse.ok) {
        throw new Error(data.error?.message || "OpenAI API error");
      }

      response = JSON.parse(data.choices[0].message.content);
      usage = {
        prompt_tokens: data.usage?.prompt_tokens,
        completion_tokens: data.usage?.completion_tokens,
      };

    } else if (provider === "deepseek" && deepseekKey) {
      model = "deepseek-chat";
      const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      const data = await deepseekResponse.json();
      
      if (!deepseekResponse.ok) {
        throw new Error(data.error?.message || "DeepSeek API error");
      }

      response = JSON.parse(data.choices[0].message.content);
      usage = {
        prompt_tokens: data.usage?.prompt_tokens,
        completion_tokens: data.usage?.completion_tokens,
      };

    } else {
      throw new Error(`No API key configured for provider: ${provider}`);
    }

    // Log the generation (optional)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get user from auth header
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        
        if (user) {
          await supabase.from("generation_logs").insert({
            brand_id: brandId,
            user_id: user.id,
            email_type: emailType,
            provider,
            model,
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
          });
        }
      }
    } catch (logError) {
      console.error("Failed to log generation:", logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({
        ...response,
        model,
        usage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
