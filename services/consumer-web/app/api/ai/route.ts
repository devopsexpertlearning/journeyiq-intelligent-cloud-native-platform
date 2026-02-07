import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, user_id } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        const aiServiceUrl = process.env.NEXT_PUBLIC_AI_AGENT_URL || 'http://localhost:8012';

        const response = await fetch(`${aiServiceUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                user_id: user_id || 'anonymous'
            }),
        });

        if (!response.ok) {
            throw new Error(`AI service error: ${response.statusText}`);
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('AI API error:', error);
        return NextResponse.json(
            { error: 'Failed to communicate with AI service' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        service: 'AI Agent API',
        endpoints: {
            chat: 'POST /api/ai',
        }
    });
}
