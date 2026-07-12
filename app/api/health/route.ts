import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const start = Date.now();
  try {
    // Perform a minimal query ping to verify postgres connection pool connectivity
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      latencyMs: latency,
      uptime: process.uptime(),
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB",
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Database verification failed",
      },
      { status: 503 }
    );
  }
}
