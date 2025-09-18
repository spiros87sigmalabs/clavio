import { createClient } from "@netlify/blobs";

const client = createClient({ auth: process.env.NETLIFY_AUTH_TOKEN });

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No body provided" }) };
    }

    const { html_content, project_name, project_id } = JSON.parse(event.body);

    if (!html_content || !project_name) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing html_content or project_name" }) };
    }

    // Φιλικό όνομα αρχείου
    const friendlyName = project_name
      .toLowerCase()
      .replace(/[^a-z0-9α-ωά-ώ]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const id = project_id || Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    const filename = `${friendlyName}-${id}.html`;

    // Αποθήκευση στο Netlify Blobs
    const blob = await client.put({
      key: filename,
      body: html_content,
      visibility: "public",
      type: "text/html",
    });

    const publicUrl = blob.url;

    return {
      statusCode: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        project_name,
        public_url: publicUrl,
        message: project_id ? "Project updated successfully!" : "Project published successfully!",
        action: project_id ? "updated" : "created",
      }),
    };
  } catch (error) {
    console.error("❌ Error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
}
