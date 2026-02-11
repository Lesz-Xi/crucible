import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    try {
        // Test importing the bridge service
        const { OpenClawBridgeService } = await import('@/lib/services/openclaw-bridge');

        return NextResponse.json({
            success: true,
            message: 'Import successful',
            service: typeof OpenClawBridgeService,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }, { status: 500 });
    }
}
