import { Hono } from 'hono'
import { getCookie, deleteCookie } from 'hono/cookie'
import * as sql from 'mssql';
import 'dotenv/config';
import { db } from '../db';
import type { DatabaseError } from '../types';

const route_logout = new Hono()

async function delete_session(session_id: string) {
  try {
    const pool = await db.getPool();
    const result = await pool.request()
      .input('session_id', sql.VarChar, session_id)
      .query(`DELETE FROM sessions WHERE id = @session_id`);
    return result;
  } catch (err) {
    const dbError = err as DatabaseError;
    console.error('Failed to delete session:', dbError.message);
    throw dbError;
  }
}

route_logout.delete('/', async (c) => {
  try {
    const session_id = getCookie(c, 'session_id');
    if (session_id) {
      await delete_session(session_id);
    }
    deleteCookie(c, 'session_id');
    return c.body(null, 204);
  } catch (err) {
    console.error('Logout error:', err);
    return c.json({ message: 'Internal Server Error' }, 500);
  }
});

export default route_logout;