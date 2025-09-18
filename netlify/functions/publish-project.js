// netlify/functions/publish-project.js
// CommonJS friendly, dynamic import + robust client init for @netlify/blobs

const HEADERS_BASE = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: HEADERS_BASE, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: HEADERS_BASE,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, headers: HEADERS_BASE, body: JSON.stringify({ error: "No body provided" }) };
    }

    const { html_content, project_name, project_id } = JSON.parse(event.body);
    if (!html_content || !project_name) {
      return { statusCode: 400, headers: HEADERS_BASE, body: JSON.stringify({ error: "Missing html_content or project_name" }) };
    }

    // --- dynamic import of @netlify/blobs and robust client init ---
    let client;
    try {
      const blobsModule = await import("@netlify/blobs");
      // log available keys for debugging (will show in function logs)
      console.log("blobsModule keys:", Object.keys(blobsModule));

      // try common variants
      if (typeof blobsModule.createClient === "function") {
        client = blobsModule.createClient({ auth: process.env.NETLIFY_AUTH_TOKEN });
      } else if (blobsModule.default && typeof blobsModule.default.createClient === "function") {
        client = blobsModule.default.createClient({ auth: process.env.NETLIFY_AUTH_TOKEN });
      } else if (typeof blobsModule.default === "function") {
        // default export is a factory function
        client = blobsModule.default({ auth: process.env.NETLIFY_AUTH_TOKEN });
      } else if (typeof blobsModule.put === "function") {
        // very unlikely: module itself exposes put -> wrap it
        client = { put: blobsModule.put.bind(blobsModule) };
      } else {
        // fallback: also try to call createClient from nested default.default
        if (blobsModule.default && typeof blobsModule.default.default === "function") {
          client = blobsModule.default.default({ auth: process.env.NETLIFY_AUTH_TOKEN });
        }
      }
    } catch (impErr) {
      console.error("Error importing @netlify/blobs:", impErr);
      throw new Error("Failed to import @netlify/blobs: " + (impErr && impErr.message ? impErr.message : String(impErr)));
    }

    if (!client || typeof client.put !== "function") {
      console.error("Could not initialise @netlify/blobs client. client object:", client);
      throw new Error("Could not initialise @netlify/blobs client (createClient not found or client.put missing)");
    }

    // --- build friendly filename ---
    const friendlyName = project_name
      .toLowerCase()
      .replace(/[^a-z0-9α-ωά-ώ]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const id = project_id || Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    const filename = `${friendlyName}-${id}.html`;

    // --- upload to blobs ---
    const blob = await client.put({
      key: filename,
      body: html_content,
      visibility: "public",
      type: "text/html",
    });

    console.log("blob result:", blob);

    const publicUrl = blob?.url || blob?.Location || blob?.Key || null;
    if (!publicUrl) {
      // sometimes the returned shape differs; include blob for debugging
      throw new Error("No public URL returned from blob storage. blob: " + JSON.stringify(blob));
    }

    return {
      statusCode: 200,
      headers: { ...HEADERS_BASE, "Content-Type": "application/json" },
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
      headers: HEADERS_BASE,
      body: JSON.stringify({ error: error.message || String(error) }),
    };
  }
};
