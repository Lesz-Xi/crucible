import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime for WebSocket support
export const runtime = 'nodejs';

/**
 * GET /api/openclaw/status
 * 
 * Returns the connection status of the OpenClaw Gateway bridge.
 * Used for health checks and diagnostics.
 */
export async function GET(req: NextRequest) {
    try {
        // Dynamic import to avoid bundling issues with 'ws' package
        const { OpenClawBridgeService } = await import('@/lib/services/openclaw-bridge');
        const bridge = OpenClawBridgeService.getInstance();

        // Attempt to connect if not already connected
        try {
            await bridge.connect();
        } catch (err) {
            // Connection failed, but we still return status (may show connected: false)
            console.warn('[OpenClawStatus] Connection attempt failed:', err);
        }

        const status = bridge.getStatus();

        return NextResponse.json({
            success: true,
            status,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
