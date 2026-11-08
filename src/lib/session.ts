import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";

/**
 * Error with an HTTP status. Route handlers translate these into responses;
 * anything else becomes a generic 500 so internals are never leaked.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Authentication required");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "SUPER_ADMIN") {
    throw new HttpError(403, "Administrator access required");
  }
  return session;
}

export function isAdmin(session: SessionPayload): boolean {
  return session.role === "SUPER_ADMIN";
}

export interface JobBranchRef {
  originBranchId: string;
  servicingBranchId: string | null;
}

/** True when the session may see/modify a job belonging to these branches. */
export function canAccessJob(
  session: SessionPayload,
  job: JobBranchRef
): boolean {
  if (isAdmin(session)) return true;
  return (
    job.originBranchId === session.branchId ||
    job.servicingBranchId === session.branchId
  );
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[api]", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
