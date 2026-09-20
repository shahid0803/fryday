import { applySceneTool, createInitialScene, getSceneContext, resolveObjectId } from '../scene/sceneTools'
import type { SceneState, ToolDefinition, ToolResult } from '../types/scene'

export const toolCatalog: ToolDefinition[] = [
  {
    name: 'createObject',
    description: 'Create a new object in the scene.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
      },
      required: ['objectId', 'name', 'type'],
    },
  },
  {
    name: 'removeObject',
    description: 'Remove an object from the current 3D scene.',
    parameters: {
      type: 'object',
      properties: { objectId: { type: 'string' } },
      required: ['objectId'],
    },
  },
  {
    name: 'hideObject',
    description: 'Hide an existing object.',
    parameters: {
      type: 'object',
      properties: { objectId: { type: 'string' } },
      required: ['objectId'],
    },
  },
  {
    name: 'showObject',
    description: 'Show a hidden object.',
    parameters: {
      type: 'object',
      properties: { objectId: { type: 'string' } },
      required: ['objectId'],
    },
  },
  {
    name: 'moveObject',
    description: 'Move an object to a new position.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string' },
        position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      },
      required: ['objectId', 'position'],
    },
  },
  {
    name: 'rotateObject',
    description: 'Rotate an object.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string' },
        rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      },
      required: ['objectId', 'rotation'],
    },
  },
  {
    name: 'scaleObject',
    description: 'Scale an object up or down.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string' },
        scale: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      },
      required: ['objectId', 'scale'],
    },
  },
  {
    name: 'selectObject',
    description: 'Select an object in the scene.',
    parameters: {
      type: 'object',
      properties: { objectId: { type: 'string' } },
      required: ['objectId'],
    },
  },
  {
    name: 'undoScene',
    description: 'Undo the previous scene modification.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'resetScene',
    description: 'Reset the scene to the default bike layout.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getSceneState',
    description: 'Return the current scene state for the assistant.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'addMotor',
    description: 'Add an engine to the bike scene.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
]

export function getSceneToolContext(scene: SceneState): { scene: string; objects: Array<{ id: string; name: string; type: string; visible: boolean }> } {
  return getSceneContext(scene)
}

function describeTargetObject(text: string, scene: SceneState): string | null {
  const normalized = text.replace(/[^a-z0-9]+/g, ' ').toLowerCase().trim()

  for (const object of scene.objects) {
    const aliases = [
      object.id,
      object.name,
      object.type,
      ...[
        object.id.replace(/-/g, ' '),
        object.name.toLowerCase(),
      ],
    ]

    if (aliases.some((alias) => normalized.includes(alias.toLowerCase()))) {
      return object.id
    }

    if (object.id === 'rear-wheel' && /rear|back|behind/.test(normalized)) {
      return 'rear-wheel'
    }

    if (object.id === 'front-wheel' && /front|front wheel|front tyre|front tire/.test(normalized)) {
      return 'front-wheel'
    }
  }
  return null
  return null
}

export function parseTextCommand(text: string, scene: SceneState): { scene: SceneState; result: ToolResult } {
  const normalized = text.trim().toLowerCase()

  if (!normalized) {
    return {
      scene,
      result: { success: false, action: 'unsupported', error: 'No command provided.' },
    }
  }

  if (/(create|build).*(mountain bike|bike)/.test(normalized)) {
    const reset = createInitialScene()
    return {
      scene: reset,
      result: { success: true, action: 'createObject', objectId: 'frame', message: 'Mountain bike created.' },
    }
  }

  if (/(undo|revert).*(that|last|scene)/.test(normalized)) {
    return applySceneTool(scene, 'undoScene', {})
  }

  if (/(reset|clear).*(scene|workspace)/.test(normalized)) {
    return applySceneTool(scene, 'resetScene', {})
  }

  if (/(add|install).*(engine|motor)/.test(normalized) || /(engine|motor)/.test(normalized) && /(add|install)/.test(normalized)) {
    return applySceneTool(scene, 'addMotor', {})
  }

  if (/(make|scale|bigger|larger|smaller|reduce).*(engine|motor)/.test(normalized)) {
    const engineId = resolveObjectId('engine', scene) ?? 'engine'
    const isLarger = /(bigger|larger|scale up|up)/.test(normalized)
    const scale = isLarger ? [1.2, 1.2, 1.2] : [0.72, 0.72, 0.72]
    return applySceneTool(scene, 'scaleObject', { objectId: engineId, scale })
  }

  if (/(move|put|shift).*(engine|motor).*(forward|front|ahead|higher|up)/.test(normalized)) {
    const engineId = resolveObjectId('engine', scene) ?? 'engine'
    const nextPosition = [0.8, 1.1, 0]
    const targetObject = scene.objects.find((entry: { id: string }) => entry.id === engineId)
    if (targetObject) {
      return applySceneTool(scene, 'moveObject', { objectId: engineId, position: nextPosition })
    }
  }

  if (/(remove|delete|take off|takeoff|hide).*(wheel|tyre|tire|rear|front|back)/.test(normalized)) {
    const targetId = describeTargetObject(normalized, scene)
    if (targetId) {
      return applySceneTool(scene, 'removeObject', { objectId: targetId })
    }
    return {
      scene,
      result: { success: false, action: 'removeObject', error: 'I could not identify which wheel or tyre to remove.' },
    }
  }

  if (/(remove|delete|take off|takeoff|hide).*(engine|motor)/.test(normalized)) {
    const targetId = resolveObjectId('engine', scene) ?? 'engine'
    return applySceneTool(scene, 'removeObject', { objectId: targetId })
  }

  if (/(make it|make the bike|scale|bigger|larger|smaller).*(bike|frame)/.test(normalized)) {
    return applySceneTool(scene, 'scaleObject', { objectId: 'frame', scale: [1.18, 1.18, 1.18] })
  }

  const targetId = describeTargetObject(normalized, scene)
  if (targetId) {
    return applySceneTool(scene, 'selectObject', { objectId: targetId })
  }

  return {
    scene,
    result: { success: false, action: 'unsupported', error: 'The command is not currently supported by the scene tool layer.' },
  }
}
