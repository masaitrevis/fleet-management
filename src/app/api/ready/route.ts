import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Kubernetes-style readiness probe.
 * Returns 200 if the app is ready to accept traffic.
 * Checks: DB connection, Prisma client initialized.
 */
export async function GET() {
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  const ready = database;
  const status = ready ? 'ready' : 'not_ready';
  const httpStatus = ready ? 200 : 503;

  return NextResponse.json(
    {
      status,
      checks: { database },
      timestamp: new Date().toISOString(),
    },
    { status: httpStatus }
  );
}
