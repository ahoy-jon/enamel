export interface User {
  id: string;
  displayName: string;
}

export function displayName(user: User): string {
  return user.displayName;
}
