import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { createTextTo3DProvider } from './3d'
import type { TextTo3DRequest } from './3d/types'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 3001)
const generationProvider = createTextTo3DProvider()
const generationRequests = new Map<string, number[]>()

app.use(cors())
app.use(express.json())

function allowGeneration(ip: string): boolean {
  const now = Date.now()
  const recent = (generationRequests.get(ip) ?? []).filter((timestamp) => now - timestamp < 60_000)
  if (recent.length >= 10) {
    generationRequests.set(ip, recent)
    return false
  }
  recent.push(now)
  generationRequests.set(ip, recent)
  return true
}

function getProviderOrFail(res: express.Response) {
  if (generationProvider) return generationProvider
  res.status(503).json({
    ok: false,
    error: '3D generation is not configured. Set MESHY_API_KEY on the server.',
  })
  return null
}

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
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        modalities: ['text', 'audio'],
      }),
    })
    const payload = (await response.json()) as { error?: { message?: string } }
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        mode: 'error',
        error: payload?.error?.message ?? 'Unable to create OpenAI realtime session.',
      })
    }
    return res.status(200).json({ ok: true, mode: 'realtime', session: payload })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Realtime session initialization failed.'
    return res.status(500).json({ ok: false, mode: 'error', error: message })
  }
})

app.post('/api/3d/text-to-3d', async (req, res) => {
  if (!allowGeneration(req.ip ?? 'unknown')) {
    return res.status(429).json({ ok: false, error: 'Generation rate limit exceeded. Try again shortly.' })
  }
  const provider = getProviderOrFail(res)
  if (!provider) return

  const body = req.body as Partial<TextTo3DRequest>
  if (typeof body.prompt !== 'string' || body.prompt.trim().length < 3 || body.prompt.length > 1000) {
    return res.status(400).json({ ok: false, error: 'prompt must be between 3 and 1000 characters.' })
  }
  if (body.mode === 'refine' && typeof body.previewTaskId !== 'string') {
    return res.status(400).json({ ok: false, error: 'previewTaskId is required for refine tasks.' })
  }

  try {
    const task = await provider.createTask({
      prompt: body.prompt.trim(),
      mode: body.mode,
      previewTaskId: body.previewTaskId,
      texturePrompt: body.texturePrompt,
    })
    return res.status(202).json({ ok: true, task })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create 3D generation task.'
    return res.status(502).json({ ok: false, error: message })
  }
})

app.get('/api/3d/tasks/:taskId', async (req, res) => {
  const provider = getProviderOrFail(res)
  if (!provider) return
  try {
    const task = await provider.getTask(req.params.taskId)
    return res.json({ ok: true, task })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to read 3D generation task.'
    return res.status(502).json({ ok: false, error: message })
  }
})

app.post('/api/3d/tasks/:taskId/cancel', async (req, res) => {
  const provider = getProviderOrFail(res)
  if (!provider) return
  try {
    const task = await provider.cancelTask(req.params.taskId)
    return res.json({ ok: true, task })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to cancel 3D generation task.'
    return res.status(502).json({ ok: false, error: message })
  }
})

app.listen(port, () => {
  console.log(`Realtime API ready on http://localhost:${port}`)
})
