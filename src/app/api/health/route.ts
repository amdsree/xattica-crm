import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json(
      { status: "healthy", database: "connected", userCount, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "healthy", database: "unreachable", error: String(error), timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }
}
