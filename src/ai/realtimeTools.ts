import {
  executeSceneCommand,
  getSceneContext,
  resolveObjectId,
  resolveTargetObjects,
} from '../scene/sceneTools'
import type { SceneContext, SceneState, ToolDefinition, ToolResult } from '../types/scene'

export const toolCatalog: ToolDefinition[] = [
  {
    name: 'generate3DModel',
    description: 'Generate a new conceptual 3D asset from a text prompt. Use only for genuinely new assets.',
    parameters: {
      type: 'object',
      properties: { prompt: { type: 'string', description: 'Description of the new 3D asset.' } },
      required: ['prompt'],
    },
  },
  {
    name: 'createObject',
    description: 'Create a new object in the scene.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
        position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
        rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
        scale: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
        parentId: { type: 'string' },
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
    name: 'removeObjects',
    description: 'Remove multiple objects from the scene simultaneously.',
    parameters: {
      type: 'object',
      properties: { objectIds: { type: 'array', items: { type: 'string' } } },
      required: ['objectIds'],
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
    name: 'hideObjects',
    description: 'Hide multiple objects simultaneously.',
    parameters: {
      type: 'object',
      properties: { objectIds: { type: 'array', items: { type: 'string' } } },
      required: ['objectIds'],
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
    name: 'showObjects',
    description: 'Show multiple hidden objects simultaneously.',
    parameters: {
      type: 'object',
      properties: { objectIds: { type: 'array', items: { type: 'string' } } },
      required: ['objectIds'],
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
    description: 'Return the current concise scene state for the assistant.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'addMotor',
    description: 'Add an engine to the bike scene.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
]

export function getSceneToolContext(scene: SceneState): SceneContext {
  return getSceneContext(scene)
}

function extractTargetQuery(text: string, actionKeywords: string[]): string {
  let cleaned = text.trim()
  for (const keyword of actionKeywords) {
    const regex = new RegExp(`^.*?\\b${keyword}\\b\\s*`, 'i')
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, '')
      break
    }
  }
  return cleaned.replace(/^(the|both|all|a|an)\s+/i, (match) => match)
}

export function parseTextCommand(text: string, scene: SceneState): { scene: SceneState; result: ToolResult } {
  const normalized = text.trim().toLowerCase()

  if (!normalized) {
    return {
      scene,
      result: { success: false, action: 'unsupported', error: 'No command provided.' },
    }
  }

  // 1. Undo / Revert (supports single word "undo" as well as "undo that", "revert", etc.)
  if (/^(undo|revert)(\s+(that|last|scene|action))?$/.test(normalized) || /(undo|revert).*(that|last|scene)/.test(normalized)) {
    return executeSceneCommand(scene, { type: 'undoScene' })
  }

  // 2. Reset / Clear Workspace
  if (/^(reset|clear)(\s+(scene|workspace|layout))?$/.test(normalized) || /(reset|clear).*(scene|workspace)/.test(normalized)) {
    return executeSceneCommand(scene, { type: 'resetScene' })
  }

  // 3. Create initial mountain bike
  if (/(create|build).*(mountain bike|bike)/.test(normalized)) {
    return executeSceneCommand(scene, { type: 'resetScene' })
  }

  // 4. Add motor / engine
  if (/(add|install|attach).*(engine|motor)/.test(normalized) || (/(engine|motor)/.test(normalized) && /(add|install)/.test(normalized))) {
    const existing = scene.objects.find((entry) => entry.id === 'engine')
    if (existing) {
      return executeSceneCommand(scene, { type: 'selectObject', objectId: 'engine' })
    }
    return executeSceneCommand(scene, {
      type: 'createObject',
      objectId: 'engine',
      name: 'Engine',
      objectType: 'engine',
      position: [0.2, 0.8, 0],
      rotation: [0, 0, 0],
      scale: [0.9, 0.9, 0.9],
      parentId: 'frame',
    })
  }

  // 5. Scale motor / engine
  if (/(make|scale|bigger|larger|smaller|reduce).*(engine|motor)/.test(normalized)) {
    const engineId = resolveObjectId('engine', scene) ?? 'engine'
    const isLarger = /(bigger|larger|scale up|up)/.test(normalized)
    const scale: [number, number, number] = isLarger ? [1.2, 1.2, 1.2] : [0.72, 0.72, 0.72]
    return executeSceneCommand(scene, { type: 'scaleObject', objectId: engineId, scale })
  }

  // 6. Move motor / engine
  if (/(move|put|shift).*(engine|motor).*(forward|front|ahead|higher|up)/.test(normalized)) {
    const engineId = resolveObjectId('engine', scene) ?? 'engine'
    return executeSceneCommand(scene, { type: 'moveObject', objectId: engineId, position: [0.8, 1.1, 0] })
  }

  // 7. Scale frame / bike
  if (/(make it|make the bike|scale|bigger|larger|smaller).*(bike|frame)/.test(normalized)) {
    return executeSceneCommand(scene, { type: 'scaleObject', objectId: 'frame', scale: [1.18, 1.18, 1.18] })
  }

  // 8. Remove / Delete / Detach objects (handles "remove both tyres", "delete rear wheel", "remove wheels")
  if (/(remove|delete|take off|takeoff|detach|eliminate)\b/.test(normalized)) {
    const query = extractTargetQuery(normalized, ['remove', 'delete', 'take off', 'takeoff', 'detach', 'eliminate'])
    const targets = resolveTargetObjects(query || normalized, scene)

    if (targets.length === 1 && targets[0]) {
      return executeSceneCommand(scene, { type: 'removeObject', objectId: targets[0] })
    }
    if (targets.length > 1) {
      return executeSceneCommand(scene, { type: 'removeObjects', objectIds: targets })
    }
    return {
      scene,
      result: { success: false, action: 'removeObject', error: 'I could not identify which object(s) to remove.' },
    }
  }

  // 9. Hide / Conceal objects (handles "hide both tyres", "hide front wheel")
  if (/(hide|conceal|invisible)\b/.test(normalized)) {
    const query = extractTargetQuery(normalized, ['hide', 'conceal', 'make invisible'])
    const targets = resolveTargetObjects(query || normalized, scene)

    if (targets.length === 1 && targets[0]) {
      return executeSceneCommand(scene, { type: 'hideObject', objectId: targets[0] })
    }
    if (targets.length > 1) {
      return executeSceneCommand(scene, { type: 'hideObjects', objectIds: targets })
    }
    return {
      scene,
      result: { success: false, action: 'hideObject', error: 'I could not identify which object(s) to hide.' },
    }
  }

  // 10. Show / Unhide / Reveal objects (handles "show both tyres", "unhide rear wheel")
  if (/(show|unhide|reveal|display|make visible)\b/.test(normalized)) {
    const query = extractTargetQuery(normalized, ['show', 'unhide', 'reveal', 'display', 'make visible'])
    const targets = resolveTargetObjects(query || normalized, scene)

    if (targets.length === 1 && targets[0]) {
      return executeSceneCommand(scene, { type: 'showObject', objectId: targets[0] })
    }
    if (targets.length > 1) {
      return executeSceneCommand(scene, { type: 'showObjects', objectIds: targets })
    }
    return {
      scene,
      result: { success: false, action: 'showObject', error: 'I could not identify which object(s) to show.' },
    }
  }

  // 11. Select object (e.g. "select rear wheel", "front tyre")
  const targets = resolveTargetObjects(normalized, scene)
  if (targets.length > 0 && targets[0]) {
    return executeSceneCommand(scene, { type: 'selectObject', objectId: targets[0] })
  }

  return {
    scene,
    result: { success: false, action: 'unsupported', error: 'The command is not currently supported by the scene tool layer.' },
  }
}
