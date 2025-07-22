import { Hono } from 'hono'

import route_logout from './routes/logout'
import route_login from './routes/login'
import route_tickets from './routes/tickets'
import route_health from './routes/health'
import route_projects from './routes/projects'

const app = new Hono()

app.route('/health', route_health)
app.route('/sessions', route_login)
app.route('/sessions/me', route_logout)
app.route('/tickets/me', route_tickets)
app.route('/projects', route_projects)

export default app
