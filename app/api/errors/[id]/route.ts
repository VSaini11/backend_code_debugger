import { NextRequest, NextResponse } from 'next/server';
import { getErrorById, deleteError } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const error = getErrorById(id);

    if (!error) {
      return NextResponse.json(
        { error: 'Error not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(error);
  } catch (error) {
    console.error('Error fetching error detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteError(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Error not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting error record:', error);
    return NextResponse.json(
      { error: 'Failed to delete error' },
      { status: 500 }
    );
  }
}
