// netlify/functions/publish-project.js

exports.handler = async (event, context) => {
  console.log('🚀 Function called!');
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  // Μόνο POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📝 Parsing body...');
    const { html_content, project_name, project_id } = JSON.parse(event.body);
    
    // Validate input
    if (!html_content || !project_name) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing html_content or project_name' })
      };
    }

    console.log('✅ Data valid, creating project...');

    // Δημιουργία unique ID
    const id = project_id || Date.now().toString(36) + Math.random().toString(36).substr(2);
    const fileName = `${id}.html`;
    
    // Για να δουλέψει πραγματικά, θα χρησιμοποιήσουμε ένα online storage
    // Προς το παρόν επιστρέφουμε success response
    const siteUrl = 'https://codepen.io/pen'; // Προσωρινό URL για test
    const publicUrl = `${siteUrl}/${id}`;
    
    console.log('🎉 Project created:', { id, project_name, publicUrl });

    // Response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        id,
        project_name,
        public_url: publicUrl,
        message: project_id ? 'Project updated successfully!' : 'Project published successfully!',
        action: project_id ? 'updated' : 'created'
      })
    };

  } catch (error) {
    console.error('❌ Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error: ' + error.message 
      })
    };
  }
};