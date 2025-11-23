'use server';
import { NextRequest, NextResponse } from 'next/server';

const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY!;

interface Tags {
  main_category: string;
  specific_item: string;
  color: string;
  material: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const { image, mediaType } = await request.json();

    if (!CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: image
                }
              },
              {
                type: 'text',
                text: `Analyze this image and provide tags in the following JSON format (respond with ONLY valid JSON, no other text):

{
  "main_category": "the primary category (e.g., furniture, clothing, food, electronics, etc.)",
  "specific_item": "the specific item name",
  "color": "primary color(s)",
  "material": "material composition",
  "description": "a casual 2-line description"
}`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    // LOG THE FULL RESPONSE
    console.log('Full Claude response:', JSON.stringify(data, null, 2));
    
    if (data.content && data.content[0] && data.content[0].text) {
      const text = data.content[0].text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const tags: Tags = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      
      return NextResponse.json({ tags });
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error generating tags:', error);
    return NextResponse.json(
      { error: 'Failed to generate tags' },
      { status: 500 }
    );
  }
}