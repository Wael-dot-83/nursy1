import bcrypt from "bcryptjs";
import { env } from "../config/env";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(env.PASSWORD_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
