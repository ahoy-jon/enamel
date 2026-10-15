import { displayName } from "../domain/user.ts";
import { findUser } from "../data/userRepository.ts";

export async function greetingForUser(id: string): Promise<string> {
  const user = await findUser(id);
  return `Hello, ${displayName(user)}!`;
}
