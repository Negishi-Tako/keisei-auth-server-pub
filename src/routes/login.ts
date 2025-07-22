import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import type { Context } from 'hono'
import * as sql from 'mssql';
import 'dotenv/config';
import { nanoid } from 'nanoid';
import * as crypto from 'crypto';
import { db } from '../db';
import type { LoginRequest, AuthLogEntry, DatabaseError } from '../types';

const route_login = new Hono()

class LoginService {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOGIN_ATTEMPT_WINDOW_HOURS = 1;
  private static readonly SESSION_EXPIRY_HOURS = 5;

  private static getIp(c: Context): string {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    if (!ip) return 'unknown';

    const first_ip = ip.split(',')[0].trim();
    
    // IPv6 with port: [2001:db8::1]:12345
    const ipv6_match = first_ip.match(/^\[([a-fA-F0-9:]+)\](?::\d+)?$/);
    if (ipv6_match) return ipv6_match[1];
    
    // IPv4 with port: 192.0.2.1:12345
    const ipv4_match = first_ip.match(/^([0-9.]+)(?::\d+)?$/);
    if (ipv4_match) return ipv4_match[1];
    
    return first_ip;
  }

  private static async addAuthLog(log: AuthLogEntry): Promise<void> {
    try {
      const pool = await db.getPool();
      await pool.request()
        .input('studentid', sql.Int, log.studentId)
        .input('result', sql.TinyInt, log.result)
        .input('ip', sql.VarChar, log.ip)
        .query(`
          INSERT INTO authlog (student_id, result, ip, datetime) 
          VALUES (@studentid, @result, @ip, DATEADD(hour, 0, GETDATE()))
        `);
    } catch (err) {
      const dbError = err as DatabaseError;
      console.error('Failed to add auth log:', dbError.message);
      throw dbError;
    }
  }

  private static async checkLoginAttempts(studentId: number): Promise<boolean> {
    try {
      const pool = await db.getPool();
      const result = await pool.request()
        .input('studentid', sql.Int, studentId)
        .input('hours', sql.Int, this.LOGIN_ATTEMPT_WINDOW_HOURS)
        .query(`
          SELECT COUNT(*) AS count 
          FROM authlog 
          WHERE student_id = @studentid 
            AND datetime > DATEADD(hour, -@hours, GETDATE()) 
            AND result = 0
        `);
      
      return result.recordset[0].count < this.MAX_LOGIN_ATTEMPTS;
    } catch (err) {
      const dbError = err as DatabaseError;
      console.error('Failed to check login attempts:', dbError.message);
      throw dbError;
    }
  }

  private static async verifyCredentials(studentId: number, pin: string): Promise<number | null> {
    try {
      const pool = await db.getPool();
      const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
      const result = await pool.request()
        .input('studentid', sql.Int, studentId)
        .input('pin', sql.VarChar, pinHash)
        .query(`SELECT id FROM tickets WHERE student_id = @studentid AND pin = @pin`);
      
      return result.recordset.length > 0 ? result.recordset[0].id : null;
    } catch (err) {
      const dbError = err as DatabaseError;
      console.error('Failed to verify credentials:', dbError.message);
      throw dbError;
    }
  }

  private static async createSession(ticketId: number): Promise<string> {
    try {
      const sessionId = `${nanoid()}-${nanoid()}`;
      const pool = await db.getPool();
      await pool.request()
        .input('session_id', sql.VarChar, sessionId)
        .input('ticket_id', sql.VarChar, ticketId)
        .input('hours', sql.Int, this.SESSION_EXPIRY_HOURS)
        .query(`
          INSERT INTO sessions (id, ticket_id, exp) 
          VALUES (@session_id, @ticket_id, DATEADD(hour, @hours, GETDATE()))
        `);
      
      return sessionId;
    } catch (err) {
      const dbError = err as DatabaseError;
      console.error('Failed to create session:', dbError.message);
      throw dbError;
    }
  }

  public static async handleLogin(c: Context): Promise<Response> {
    try {
      const { studentid, pin } = await c.req.json<LoginRequest>();
      const ip = this.getIp(c);

      if (!studentid || !pin) {
        await this.addAuthLog({ studentId: studentid, result: false, ip });
        return c.json({ message: 'Bad Request' }, 400);
      }

      const canAttemptLogin = await this.checkLoginAttempts(studentid);
      if (!canAttemptLogin) {
        await this.addAuthLog({ studentId: studentid, result: false, ip });
        return c.json({ message: 'Too many requests' }, 429);
      }

      const ticketId = await this.verifyCredentials(studentid, pin);
      if (!ticketId) {
        await this.addAuthLog({ studentId: studentid, result: false, ip });
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const sessionId = await this.createSession(ticketId);
      await this.addAuthLog({ studentId: studentid, result: true, ip });

      setCookie(c, 'session_id', sessionId, {
        httpOnly: true,
        maxAge: 60 * 30,
        secure: true,
      });

      return c.json({ message: 'Authorized' }, 201);
    } catch (err) {
      console.error('Login error:', err);
      return c.json({ message: 'Internal Server Error' }, 500);
    }
  }
}

route_login.post('/', (c) => LoginService.handleLogin(c));

export default route_login;