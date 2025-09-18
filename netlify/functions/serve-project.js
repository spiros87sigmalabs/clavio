// netlify/functions/serve-project.js
const { getStore } = require("@netlify/blobs");

exports.handler = async function (event, context) {
  console.log("serve-project function called");
  console.log("Method:", event.httpMethod);
  console.log("Query params:", event.queryStringParameters);
  console.log("Path:", event.path);

  // Handle CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };

  if (event.httpMethod === "OPTIONS") {
    return { 
      statusCode: 200, 
      headers: corsHeaders, 
      body: ""
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: "Method not allowed - only GET requests are supported"
    };
  }

  try {
    // Get filename from query parameter
    const filename = event.queryStringParameters?.file;
    
    if (!filename) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8"
        },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Missing File Parameter</title>
            <style>body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }</style>
          </head>
          <body>
            <h1>Missing File Parameter</h1>
            <p>Please provide a 'file' parameter in the URL.</p>
            <p>Example: /.netlify/functions/serve-project?file=example.html</p>
          </body>
          </html>
        `
      };
    }

    console.log("Attempting to serve file:", filename);

    // Try to initialize Netlify Blobs store
    let store;
    try {
      const siteId = context.site?.id || process.env.NETLIFY_SITE_ID;
      const token = context.token || process.env.NETLIFY_AUTH_TOKEN;
      
      console.log("Site ID available:", !!siteId);
      console.log("Token available:", !!token);
      
      if (!siteId) {
        throw new Error("Site ID not available. Please set NETLIFY_SITE_ID environment variable.");
      }
      
      store = getStore({
        name: "published-projects",
        siteID: siteId,
        token: token
      });
      console.log("Store initialized successfully");
    } catch (storeError) {
      console.error("Store initialization failed:", storeError);
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8"
        },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Storage Error</title>
            <style>body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; color: #e74c3c; }</style>
          </head>
          <body>
            <h1>Storage Initialization Error</h1>
            <p>Could not connect to the storage system.</p>
            <p>Error: ${storeError.message}</p>
          </body>
          </html>
        `
      };
    }

    // Try to get the content
    let content;
    try {
      content = await store.get(filename);
      console.log("Content retrieved:", content ? "Yes" : "No");
    } catch (getError) {
      console.error("Error getting content:", getError);
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8"
        },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Retrieval Error</title>
            <style>body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; color: #e74c3c; }</style>
          </head>
          <body>
            <h1>Content Retrieval Error</h1>
            <p>Could not retrieve the requested file.</p>
            <p>File: ${filename}</p>
            <p>Error: ${getError.message}</p>
          </body>
          </html>
        `
      };
    }

    if (!content) {
      return {
        statusCode: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8"
        },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Project Not Found</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .error { color: #e74c3c; }
              .info { color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1 class="error">Project Not Found</h1>
            <p>The project "${filename}" could not be found.</p>
            <p>It may have been deleted or the URL is incorrect.</p>
            <div class="info">
              <p><strong>Debugging info:</strong></p>
              <p>Site ID: ${context.site?.id || 'Unknown'}</p>
              <p>Store: published-projects</p>
            </div>
          </body>
          </html>
        `
      };
    }

    console.log("Successfully serving file:", filename);

    // Return the HTML content
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN"
      },
      body: content
    };

  } catch (error) {
    console.error("❌ Unexpected error in serve-project:", error);
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8"
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Server Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .error { color: #e74c3c; }
            .debug { background: #f8f8f8; padding: 10px; margin: 20px; text-align: left; font-family: monospace; }
          </style>
        </head>
        <body>
          <h1 class="error">Server Error</h1>
          <p>An unexpected error occurred while serving this project.</p>
          <div class="debug">
            <strong>Error Details:</strong><br>
            ${error.message || "Unknown error"}<br><br>
            <strong>Stack:</strong><br>
            ${error.stack || "No stack trace available"}
          </div>
        </body>
        </html>
      `
    };
  }
};