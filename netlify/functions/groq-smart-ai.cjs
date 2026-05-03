const https = require('https');

function makeGroqRequest(payload, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

exports.handler = async function(event, context) {
  try {
    // ...
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      // ...
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message })
      };
    }
    const { query, messages = [], systemPrompt } = body;

    // ...
    if (!query || !query.trim()) {
      // ...
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query is required' })
      };
    }
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // ...
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Groq API key not configured' })
      };
    }
    const groqMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
      { role: 'user', content: query }
    ];
    const payload = {
      model: 'openai/gpt-oss-120b',
      messages: groqMessages,
      temperature: 0.2,
      max_tokens: 2000,
    };
    // ...
    
    const response = await makeGroqRequest(payload, apiKey);
    // ...
    
    if (response.status !== 200) {
      // ...
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Groq API request failed', details: response.data })
      };
    }
    
    const data = response.data;
    // ...
    const aiMessage = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || 'Üzgünüm, yanıt oluşturamadım.';
    return {
      statusCode: 200,
      body: JSON.stringify({ message: aiMessage })
    };
  } catch (error) {
    // ...
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal error' })
    };
  }
};