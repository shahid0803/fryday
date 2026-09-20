import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'online' })
})

app.post('/api/realtime/session', async (_req, res) => {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return res.status(200).json({
      ok: true,
      mode: 'mock',
      message: 'OPENAI_API_KEY not configured. Local mock mode is active.',
      session: null,
    })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        modalities: ['text', 'audio'],
      }),
    })

    const payload = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        mode: 'error',
        error: payload?.error?.message ?? 'Unable to create OpenAI realtime session.',
      })
    }

    return res.status(200).json({
      ok: true,
      mode: 'realtime',
      session: payload,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Realtime session initialization failed.'
    return res.status(500).json({
      ok: false,
      mode: 'error',
      error: message,
    })
  }
})

app.listen(port, () => {
  console.log(`Realtime API ready on http://localhost:${port}`)
})
