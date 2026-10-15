export interface User {
  id: string;
  displayName: string;
}

/** Look up a user from the application's user store. */
export async function findUser(id: string): Promise<User> {
  return { id, displayName: "Ada Lovelace" };
}
