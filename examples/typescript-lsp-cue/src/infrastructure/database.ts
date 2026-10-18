import type { User } from "../domain/user.ts";

export interface Database {
  findUser(id: string): Promise<User>;
}

export const database: Database = {
  async findUser(id: string): Promise<User> {
    return { id, displayName: "Ada Lovelace" };
  },
};
