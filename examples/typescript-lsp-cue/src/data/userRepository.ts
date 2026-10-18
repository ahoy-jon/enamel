import type { User } from "../domain/user.ts";
import { database } from "../infrastructure/database.ts";

export async function findUser(id: string): Promise<User> {
  return database.findUser(id);
}
