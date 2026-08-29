import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "kp_admin_session";

function secret() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD ist nicht gesetzt");
  return password;
}

export function adminSessionToken(): string {
  return crypto.createHmac("sha256", secret()).update("kp-trainer-admin").digest("hex");
}

export function isValidAdminToken(token: string | undefined | null): boolean {
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const expected = Buffer.from(adminSessionToken());
  const given = Buffer.from(token);
  if (expected.length !== given.length) return false;
  return crypto.timingSafeEqual(expected, given);
}
