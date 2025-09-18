// netlify/functions/debug-storage.js
const { getStore } = require("@netlify/blobs");

exports.handler = async function (event, context) {
  try {
    const siteId = context.site?.id || process.env.NETLIFY_SITE_ID;
    const token = context.token || process.env.NETLIFY_AUTH_TOKEN;
    
    console.log("Debug - Site ID:", siteId);
    console.log("Debug - Token available:", !!token);
    
    if (!siteId) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: "No Site ID available",
          contextSiteId: context.site?.id,
          envSiteId: process.env.NETLIFY_SITE_ID
        })
      };
    }

    const store = getStore({
      name: "published-projects",
      siteID: siteId,
      token: token
    });

    // Try to list all files (if possible)
    let files = [];
    try {
      // Note: getStore might not have a list method, so we'll just try to get a specific file
      const testFile = "ccccc-mfptzo1pmtf0dg.html";
      const content = await store.get(testFile);
      files.push({
        name: testFile,
        exists: !!content,
        contentLength: content ? content.length : 0
      });
    } catch (e) {
      files.push({
        name: "ccccc-mfptzo1pmtf0dg.html",
        exists: false,
        error: e.message
      });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: siteId,
        tokenAvailable: !!token,
        storeName: "published-projects",
        files: files,
        contextInfo: {
          siteId: context.site?.id,
          siteName: context.site?.name,
          deployId: context.deploy?.id
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};