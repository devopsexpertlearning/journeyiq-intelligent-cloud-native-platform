import { NextRequest, NextResponse } from 'next/server';

// Map API routes to backend service URLs (using Docker service names)
const SERVICE_MAP: Record<string, string> = {
    'auth': process.env.AUTH_SERVICE_URL || 'http://journeyiq-auth:8000',
    'user': process.env.USER_SERVICE_URL || 'http://journeyiq-user:8000',
    'search': process.env.SEARCH_SERVICE_URL || 'http://journeyiq-search:8000',
    'pricing': process.env.PRICING_SERVICE_URL || 'http://journeyiq-pricing:8000',
    'inventory': process.env.INVENTORY_SERVICE_URL || 'http://journeyiq-inventory:8000',
    'booking': process.env.BOOKING_SERVICE_URL || 'http://journeyiq-booking:8000',
    'payment': process.env.PAYMENT_SERVICE_URL || 'http://journeyiq-payment:8000',
    'ticketing': process.env.TICKETING_SERVICE_URL || 'http://journeyiq-ticketing:8000',
    'notification': process.env.NOTIFICATION_SERVICE_URL || 'http://journeyiq-notification:8000',
    'review': process.env.REVIEW_SERVICE_URL || 'http://journeyiq-review:8000',
    'analytics': process.env.ANALYTICS_SERVICE_URL || 'http://journeyiq-analytics:8000',
    'ai': process.env.AI_SERVICE_URL || 'http://journeyiq-ai-agent:8000',
    'iot': process.env.IOT_SERVICE_URL || 'http://journeyiq-iot:8000',
    'admin': process.env.ADMIN_SERVICE_URL || 'http://journeyiq-admin:8000',
};

type RouteContext = {
    params: Promise<{ slug: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
    const params = await context.params;
    return proxyRequest(request, params.slug, 'GET');
}

export async function POST(request: NextRequest, context: RouteContext) {
    const params = await context.params;
    return proxyRequest(request, params.slug, 'POST');
}

export async function PUT(request: NextRequest, context: RouteContext) {
    const params = await context.params;
    return proxyRequest(request, params.slug, 'PUT');
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    const params = await context.params;
    return proxyRequest(request, params.slug, 'DELETE');
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    const params = await context.params;
    return proxyRequest(request, params.slug, 'PATCH');
}

async function proxyRequest(request: NextRequest, slug: string[], method: string) {
    try {
        // Extract service name and path
        // e.g., /api/search/locations -> service: search, path: /locations
        const [service, ...pathParts] = slug;
        const path = '/' + pathParts.join('/');

        // Get backend service URL
        const serviceUrl = SERVICE_MAP[service];
        if (!serviceUrl) {
            return NextResponse.json(
                { error: `Unknown service: ${service}` },
                { status: 404 }
            );
        }

        // Build target URL
        const targetUrl = new URL(path, serviceUrl);

        // Copy query parameters
        const searchParams = request.nextUrl.searchParams;
        searchParams.forEach((value, key) => {
            targetUrl.searchParams.append(key, value);
        });

        // Prepare headers
        const headers: HeadersInit = {};
        request.headers.forEach((value, key) => {
            // Skip host header
            if (key.toLowerCase() !== 'host') {
                headers[key] = value;
            }
        });

        // Prepare request options
        const options: RequestInit = {
            method,
            headers,
        };

        // Add body for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            const body = await request.text();
            if (body) {
                options.body = body;
            }
        }

        // Make the proxied request
        const response = await fetch(targetUrl.toString(), options);

        // Get response body
        const responseBody = await response.text();

        // Return proxied response
        return new NextResponse(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json',
            },
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Proxy request failed', details: String(error) },
            { status: 500 }
        );
    }
}
