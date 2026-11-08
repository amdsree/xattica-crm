import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    "JWT_SECRET is not configured. Set a random value of at least 32 characters in .env before starting the server."
  );
}

const SECRET_KEY = new TextEncoder().encode(rawSecret);

const ALLOWED_ROLES = new Set([
  "SUPER_ADMIN",
  "BRANCH_MANAGER",
  "INHOUSE_TECH",
  "FIELD_TECH",
]);

export const SESSION_COOKIE_NAME = "xattica_session";
export const ADMIN_BRANCH_VIEW_COOKIE = "xattica_admin_branch_view";

export type Role =
  | "SUPER_ADMIN"
  | "BRANCH_MANAGER"
  | "INHOUSE_TECH"
  | "FIELD_TECH";

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  role: Role;
  branchId: string;
  branchCode: string;
  branchName: string;
}

function isSessionPayload(
  payload: JWTPayload
): payload is JWTPayload & SessionPayload {
  return (
    typeof payload.userId === "string" &&
    typeof payload.username === "string" &&
    typeof payload.name === "string" &&
    typeof payload.branchId === "string" &&
    typeof payload.branchCode === "string" &&
    typeof payload.branchName === "string" &&
    typeof payload.role === "string" &&
    ALLOWED_ROLES.has(payload.role)
  );
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return isSessionPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getAdminBranchView(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_BRANCH_VIEW_COOKIE)?.value || null;
}

/**
 * Cookies must be marked Secure whenever the app is served over HTTPS, but a
 * Secure cookie is discarded by browsers when the shop runs this app over
 * plain HTTP on the LAN. Follow the protocol of the incoming request instead
 * of assuming production always means HTTPS.
 */
export function isSecureRequest(req: NextRequest): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim().toLowerCase() === "https";
  }
  return req.nextUrl.protocol === "https:";
}
