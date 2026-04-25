import { RequestHandler } from 'express';

export const handleGroqChatGeneral: RequestHandler = async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured (GROQ_API_KEY)' });
    }

    const groqMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ];

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ 
        error: 'Groq API request failed',
        details: errorData 
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      return res.status(500).json({ error: 'No response from Groq API' });
    }

    res.json({
      success: true,
      message: assistantMessage
    });

  } catch (error) {
    console.error('💥 Groq chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
