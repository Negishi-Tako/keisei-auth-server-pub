import { Hono } from 'hono'

const route_health = new Hono()

route_health.get('/', (c) => {
  return c.json({ status: 'ok' })
})

export default route_health