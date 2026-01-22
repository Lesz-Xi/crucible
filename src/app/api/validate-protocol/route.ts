// API Route: Validate Protocol
// Executes Python protocol code in a secure Pyodide sandbox

import { NextRequest, NextResponse } from 'next/server';
import { validateProtocol, testPyodide } from '@/lib/services/protocol-validator';

export const maxDuration = 60; // Allow up to 60s for complex simulations

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { protocolCode, test } = body;
    
    // Test mode - verify Pyodide is working
    if (test) {
      const isWorking = await testPyodide();
      return NextResponse.json({ 
        success: isWorking, 
        message: isWorking ? 'Pyodide is operational' : 'Pyodide test failed' 
      });
    }
    
    // Validate required input
    if (!protocolCode || typeof protocolCode !== 'string') {
      return NextResponse.json(
        { error: 'protocolCode is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Basic security check - reject obviously malicious code
    const dangerousPatterns = [
      'import os',
      'import subprocess',
      'import socket',
      '__import__',
      'eval(',
      'exec(',
      'open(',
      'file(',
    ];
    
    const lowerCode = protocolCode.toLowerCase();
    for (const pattern of dangerousPatterns) {
      if (lowerCode.includes(pattern.toLowerCase())) {
        return NextResponse.json(
          { error: `Potentially unsafe code detected: ${pattern}` },
          { status: 400 }
        );
      }
    }
    
    // Execute in sandbox
    console.log('[API] Validating protocol...');
    const result = await validateProtocol(protocolCode);
    
    console.log(`[API] Validation complete: success=${result.success}, time=${result.executionTimeMs}ms`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[API] Protocol validation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Validation failed' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: 'protocol-validator',
    status: 'ready',
    sandbox: 'pyodide',
    maxDuration: maxDuration
  });
}
