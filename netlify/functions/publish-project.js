// netlify/functions/publish-project.js
// CommonJS style but uses dynamic import for @netlify/blobs
const headersBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

exports.handler = async function (event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: headersBase, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: headersBase,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: headersBase,
        body: JSON.stringify({ error: "No body provided" }),
      };
    }

    const { html_content, project_name, project_id } = JSON.parse(event.body);

    if (!html_content || !project_name) {
      return {
        statusCode: 400,
        headers: headersBase,
        body: JSON.stringify({ error: "Missing html_content or project_name" }),
      };
    }

    // ΔYNAMICALLY import @netlify/blobs so we don't use `import` at top-level
    const blobsModule = await import("@netlify/blobs");
    // createClient is exported; depending on package, it should be available here
    const { createClient } = blobsModule;
    if (typeof createClient !== "function") {
      // fallback: maybe default export holds factory
      if (typeof blobsModule.default === "function") {
        // default is factory
        var client = blobsModule.default({ auth: process.env.NETLIFY_AUTH_TOKEN });
      } else {
        throw new Error("Could not initialise @netlify/blobs client (createClient not found)");
      }
    } else {
      var client = createClient({ auth: process.env.NETLIFY_AUTH_TOKEN });
    }

    // friendly filename
    const friendlyName = project_name
      .toLowerCase()
      .replace(/[^a-z0-9α-ωά-ώ]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const id = project_id || Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    const filename = `${friendlyName}-${id}.html`;

    // upload to blobs
    const blob = await client.put({
      key: filename,
      body: html_content,
      visibility: "public",
      type: "text/html",
    });

    const publicUrl = blob?.url || blob?.Location || null;
    if (!publicUrl) {
      throw new Error("No public URL returned from blob storage");
    }

    return {
      statusCode: 200,
      headers: { ...headersBase, "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        project_name,
        public_url: publicUrl,
        message: project_id ? "Project updated successfully!" : "Project published successfully!",
        action: project_id ? "updated" : "created",
      }),
    };
  } catch (error) {
    console.error("❌ publish-project error:", error);
    return {
      statusCode: 500,
      headers: headersBase,
      body: JSON.stringify({ error: error.message || String(error) }),
    };
  }
};
