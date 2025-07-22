
import { getCookie } from 'hono/cookie'
import type { Context, Next } from 'hono'
import * as sql from 'mssql';
import { db } from './db';
import type { DatabaseError } from './types';

async function get_session(session_id: string) {
    try {
        const pool = await db.getPool();
        const result = await pool.request()
            .input('session_id', sql.VarChar, session_id)
            .query(`SELECT sessions.*, tickets.student_id FROM sessions 
                    INNER JOIN tickets ON sessions.ticket_id = tickets.id 
                    WHERE sessions.id = @session_id AND sessions.exp > DATEADD(HOUR, 0, GETDATE())`);
        return result;
    } catch (err) {
        const dbError = err as DatabaseError;
        console.error('Failed to get session:', dbError.message);
        throw dbError;
    }
}

export const requireLogin = async (c: Context, next: Next) => {
    const session_id = getCookie(c, 'session_id');
    if (!session_id) {
        return c.json({ message: 'UnAuthorized' }, 401);
    }
    try {
        const session_result = await get_session(session_id);
        if (session_result.recordset.length === 0) {
            return c.json({ message: 'Invalid or expired session' }, 401);
        }
        c.set('session', session_result.recordset[0]);
        await next();
    } catch (err) {
        return c.json({ message: 'Internal Server Error' }, 500);
    }
};
