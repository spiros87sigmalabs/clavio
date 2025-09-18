// netlify/functions/get-project.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event) => {
  const project_id = event.queryStringParameters?.id;
  if (!project_id) {
    return { statusCode: 400, body: "Missing project id" };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("html_content")
    .eq("id", project_id)
    .single();

  if (error || !data) {
    return { statusCode: 404, body: "Project not found" };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html", "Access-Control-Allow-Origin": "*" },
    body: data.html_content,
  };
};
