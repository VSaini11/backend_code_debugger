import { NextRequest, NextResponse } from 'next/server';
import { getAllErrors, getRecentErrors, saveError } from '@/lib/db';
import { analyzeError } from '@/lib/analyzer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');

    let errors;
    if (limit) {
      errors = getRecentErrors(parseInt(limit));
    } else {
      errors = getAllErrors();
    }

    return NextResponse.json(errors);
  } catch (error) {
    console.error('Error fetching errors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { errorMessage, errorType, stackTrace, context } = body;

    if (!errorMessage || !errorType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Analyze the error using FastAPI backend with Gemini AI
    const analysis = await analyzeError(errorMessage, errorType, stackTrace || '', context || '');

    // Save with analysis
    const savedError = saveError({
      errorMessage,
      errorType,
      stackTrace: stackTrace || '',
      context: context || '',
      analysis,
    });

    return NextResponse.json(savedError, { status: 201 });
  } catch (error) {
    console.error('Error creating error record:', error);
    return NextResponse.json(
      { error: 'Failed to create error record' },
      { status: 500 }
    );
  }
}
