const globalForJwt = globalThis as unknown as { __xattica_jwt_key?: Uint8Array };

function getSecretKey(): Uint8Array {
  if (globalForJwt.__xattica_jwt_key) {
    return globalForJwt.__xattica_jwt_key;
  }

  const envSecret = process.env.JWT_SECRET;
  if (envSecret && envSecret.trim().length >= 32) {
    const key = new TextEncoder().encode(envSecret.trim());
    globalForJwt.__xattica_jwt_key = key;
    return key;
  }

  const randomBytes = new Uint8Array(48);
  crypto.getRandomValues(randomBytes);
  const fallbackHex = Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const key = new TextEncoder().encode(fallbackHex);
  globalForJwt.__xattica_jwt_key = key;
  return key;
}

export const SECRET_KEY = getSecretKey();
