import { Hono } from 'hono'
import { requireLogin } from '../middleware';
import { db } from '../db';
import * as sql from 'mssql';
import * as jwt from 'jsonwebtoken';
import { getCookie } from 'hono/cookie';
import { DatabaseError } from '../types';

const route_tickets = new Hono();

async function get_session_info(session_id: string) {
    try {
        const pool = await db.getPool();
        const result = await pool.request()
            .input('session_id', sql.VarChar, session_id)
            .query(`SELECT ticket_id FROM sessions WHERE id = @session_id`);
        return result;
    } catch (err) {
        const dbError = err as DatabaseError;
        console.error('Failed to get session info:', dbError.message);
        throw dbError;
    }
}

async function get_ticket(ticket_id: string) {
    try {
        const pool = await db.getPool();
        const result = await pool.request()
            .input('ticket_id', sql.VarChar, ticket_id)
            .query(`SELECT student_id,class,status,number,project FROM tickets WHERE id = @ticket_id`);
        return result;
    } catch (err) {
        const dbError = err as DatabaseError;
        console.error('Failed to get ticket:', dbError.message);
        throw dbError;
    }
}

async function get_googlewallet(ticket_id: string, student_id: number) {
    let class_id = process.env.GL_CLASS! + '.kaisei-ticket-prod';
    let object_id = process.env.GL_CLASS! + '.' + ticket_id.replace(/[^\w.-]/g, '_');
    let google_email = Buffer.from(process.env.GL_MAIL!, 'base64').toString();
    let google_auth = Buffer.from(process.env.GL_KEY!, 'base64').toString().replace(/\\n/g, '\n');
    
    const wallet_object = {
        "id": object_id,
        "classId": class_id,
        "state": "ACTIVE",
        "barcode": {
          "type": "QR_CODE",
          "value": ticket_id,
          "renderEncoding": "UTF_8"
        },
        "ticketNumber": student_id.toString(),
    };

    const claims = {
        iss: google_email,
        aud: 'google',
        typ: 'savetowallet',
        payload: {
            eventTicketObjects: [
                wallet_object
            ]
        }
    };

    const token = jwt.sign(claims, google_auth, { algorithm: 'RS256' });
    const wallet_url = `https://pay.google.com/gp/v/save/${token}`;

    return wallet_url;
}



route_tickets.get('/', requireLogin, async (c) => {
    const session_id = getCookie(c, 'session_id');
    if (!session_id) {
        return c.json({ message: 'UnAuthorized No Session' }, 401);
    }
    try {
        const session_result = await get_session_info(session_id);
        if (session_result.recordset.length == 0) {
            return c.json({ message: 'UnAuthorized Invaild Session' }, 401);
        }

        const ticket_id = session_result.recordset[0].ticket_id;
        const ticket_result = await get_ticket(ticket_id);
        const student_id = ticket_result.recordset[0].student_id;
        const ticket_class = ticket_result.recordset[0].class;
        const manage_id = "25A" + student_id.toString();
        const wallet = await get_googlewallet(ticket_id, student_id);
        if (ticket_result.recordset[0].class == 0) {
            let ticket_project = ticket_result.recordset[0].project;
            try {
                ticket_project = JSON.parse(ticket_project);
            } catch {
                
            }
            return c.json({
                ticket_class: ticket_class,
                ticket_status: ticket_result.recordset[0].status,
                ticket_manage: manage_id,
                ticket_wallet: wallet,
                ticket_id: ticket_id,
                ticket_num: ticket_result.recordset[0].number,
                ticket_project: ticket_project,
            }, 200);
        }
        return c.json({
            ticket_class: ticket_class,
            ticket_status: ticket_result.recordset[0].status,
            ticket_manage: manage_id,
            ticket_wallet: wallet,
            ticket_id: ticket_id,
            ticket_num: 0,
            ticket_project: ticket_result.recordset[0].project,
        }, 200);

    } catch (err) {
        return c.json({ message: 'Internal Server Error' }, 500);
    }
});

export default route_tickets;