import { defineConfig, loadEnv } from 'vite'
import type { Connect, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { coach } from './api/ai/coach.ts'
import { shieldCoach } from './api/ai/shield.ts'
import { shieldMail } from './api/ai/shield-mail.ts'

function localCoach(env: Record<string, string>, route = '/api/ai/coach', handler = coach): Plugin {
  const register = (server: { middlewares: Connect.Server }) => {
    server.middlewares.use(route, async (req, res) => {
      try {
        const chunks: Buffer[] = []
        let length = 0
        for await (const chunk of req) {
          const data = Buffer.from(chunk)
          length += data.length
          if (length <= 1024) chunks.push(data)
        }
        if (length > 1024) { res.writeHead(413).end(); return }
        const method = req.method ?? 'GET'
        const response = await handler(new Request('http://localhost' + route, {
          method,
          headers: { 'Content-Type': req.headers['content-type'] ?? '' },
          body: method === 'GET' || method === 'HEAD' ? undefined : Buffer.concat(chunks).toString(),
        }), env)
        res.writeHead(response.status, Object.fromEntries(response.headers))
        res.end(await response.text())
      } catch {
        res.writeHead(503).end()
      }
    })
  }
  return { name: 'local-coach:' + route, configureServer: register, configurePreviewServer: register }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(), tailwind(),
    localCoach(loadEnv(mode, process.cwd(), 'GROQ_')),
    localCoach(loadEnv(mode, process.cwd(), 'GROQ_'), '/api/ai/shield-mail', shieldMail),
    localCoach(loadEnv(mode, process.cwd(), 'XAI_'), '/api/ai/shield', shieldCoach),
  ],
}))
