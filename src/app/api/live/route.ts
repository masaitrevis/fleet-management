import { NextResponse } from 'next/server';

/**
 * Kubernetes-style liveness probe.
 * FAST — no DB calls, just confirms the process is running.
 */
export function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: process.pid,
    },
    { status: 200 }
  );
}
