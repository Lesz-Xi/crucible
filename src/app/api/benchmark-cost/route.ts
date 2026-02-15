// Benchmark Cost Estimation API Route
import { NextRequest, NextResponse } from 'next/server';
import {
  BENCHMARK_SUITES,
  BenchmarkService,
  type BenchmarkSuite,
  type BenchmarkConfig
} from '@/lib/services/benchmark-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suite, config } = body as {
      suite: BenchmarkSuite;
      config?: BenchmarkConfig;
    };

    // Validate inputs
    if (!suite) {
      return NextResponse.json(
        { error: 'suite parameter required' },
        { status: 400 }
      );
    }

    const validSuites: readonly BenchmarkSuite[] = BENCHMARK_SUITES;
    if (!validSuites.includes(suite)) {
      return NextResponse.json(
        { error: `Invalid suite. Must be one of: ${validSuites.join(', ')}` },
        { status: 400 }
      );
    }

    // Check cost limit
    const maxCost = parseFloat(process.env.BENCHMARK_MAX_COST || '10.00');
    
    const service = new BenchmarkService();
    const estimate = await service.estimateCost(suite, config || {});

    if (estimate.estimatedCost > maxCost) {
      return NextResponse.json(
        {
          error: `Estimated cost ($${estimate.estimatedCost}) exceeds maximum allowed ($${maxCost})`,
          estimate
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ...estimate
    });

  } catch (error) {
    console.error('Cost estimation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Cost estimation failed'
      },
      { status: 500 }
    );
  }
}
