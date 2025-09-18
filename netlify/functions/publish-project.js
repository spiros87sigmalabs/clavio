// netlify/functions/publish-project.js
const { getStore } = require("@netlify/blobs");

const HEADERS_BASE = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};

exports.handler = async function (event, context) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { 
      statusCode: 200, 
      headers: HEADERS_BASE, 
      body: JSON.stringify({ message: "CORS OK" })
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: HEADERS_BASE,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Validate request body
    if (!event.body) {
      return { 
        statusCode: 400, 
        headers: HEADERS_BASE, 
        body: JSON.stringify({ error: "No body provided" }) 
      };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: HEADERS_BASE,
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }

    const { html_content, project_name, project_id } = requestData;
    
    if (!html_content || !project_name) {
      return { 
        statusCode: 400, 
        headers: HEADERS_BASE, 
        body: JSON.stringify({ error: "Missing html_content or project_name" }) 
      };
    }

    // Initialize Netlify Blobs store - ΣΩΣΤΟΣ ΤΡΟΠΟΣ
    let store;
    try {
      // Χρησιμοποίησε το site ID από το context
      const siteId = context.site?.id || process.env.NETLIFY_SITE_ID;
      
      if (!siteId) {
        throw new Error("Site ID not available");
      }

      store = getStore({
        name: "published-projects",
        siteID: siteId,
        token: context.token || process.env.NETLIFY_AUTH_TOKEN
      });

      console.log("Store initialized successfully");
    } catch (storeError) {
      console.error("Store initialization error:", storeError);
      return {
        statusCode: 500,
        headers: HEADERS_BASE,
        body: JSON.stringify({ 
          error: "Failed to initialize storage: " + storeError.message 
        })
      };
    }

    // Generate project ID and filename
    const id = project_id || Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    
    const friendlyName = project_name
      .toLowerCase()
      .replace(/[^a-z0-9α-ωά-ώ\s]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    const filename = `${friendlyName}-${id}.html`;

    // Store the HTML content
    try {
      await store.set(filename, html_content, {
        metadata: {
          projectName: project_name,
          createdAt: new Date().toISOString(),
          projectId: id
        }
      });

      console.log(`Successfully stored project: ${filename}`);
    } catch (storeSetError) {
      console.error("Error storing content:", storeSetError);
      return {
        statusCode: 500,
        headers: HEADERS_BASE,
        body: JSON.stringify({ 
          error: "Failed to store content: " + storeSetError.message 
        })
      };
    }

    // Construct the public URL using our serve function
    const siteUrl = process.env.URL || `https://${context.site?.name || 'your-site'}.netlify.app`;
    const publicUrl = `${siteUrl}/projects/${filename}`;
    const fallbackUrl = `${siteUrl}/.netlify/functions/serve-project?file=${filename}`;

    const response = {
      id,
      project_name,
      public_url: publicUrl,
      fallback_url: fallbackUrl,
      filename,
      message: project_id ? "Project updated successfully!" : "Project published successfully!",
      action: project_id ? "updated" : "created",
      timestamp: new Date().toISOString()
    };

    console.log("Success response:", response);

    return {
      statusCode: 200,
      headers: HEADERS_BASE,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error("❌ Unexpected error in publish-project:", error);
    
    return {
      statusCode: 500,
      headers: HEADERS_BASE,
      body: JSON.stringify({ 
        error: "Internal server error: " + (error.message || String(error)),
        timestamp: new Date().toISOString()
      }),
    };
  }
};