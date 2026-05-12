import { query } from '../config/database';

export interface User {
  id: number;
  openid: string;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
}

export const userService = {
  async findOrCreateByOpenid(openid: string, nickname?: string, avatarUrl?: string): Promise<User> {
    const existing = await query<User>(
      'SELECT * FROM users WHERE openid = $1',
      [openid]
    );

    if (existing.length > 0) {
      return existing[0];
    }

    const result = await query<User>(
      `INSERT INTO users (openid, nickname, avatar_url) VALUES ($1, $2, $3) RETURNING *`,
      [openid, nickname || null, avatarUrl || null]
    );

    return result[0];
  },

  async getById(id: number): Promise<User | null> {
    const rows = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },
};
