import { greetingForUser } from "../application/greetingService.ts";

export async function handleGreetingRequest(id: string): Promise<string> {
  return greetingForUser(id);
}
