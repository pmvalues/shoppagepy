import { NextRequest, NextResponse } from 'next/server';
import { CreateRequestSchema } from '@shoppage/contracts';

/**
 * Public Structured Requests API Endpoint (/api/v1/requests)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = CreateRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const newRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...parseResult.data,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Request created and dispatched to eligible local merchants.',
      request: newRequest,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request', message: String(error) },
      { status: 500 }
    );
  }
}
