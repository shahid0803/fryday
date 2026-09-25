import type { SceneObject, SceneState, ToolArgumentRecord, ToolDefinition, ToolResult } from '../types/scene'

export type { SceneObject, SceneSnapshot, SceneState, ToolArgumentRecord, ToolDefinition, ToolResult } from '../types/scene'

export const INITIAL_SCENE_NAME = 'Mountain Bike'

const OBJECT_ALIASES: Record<string, string[]> = {
  frame: ['frame', 'bike frame', 'main frame'],
  'front-wheel': ['front wheel', 'front tyre', 'front tire', 'front-tire', 'front tires', 'front tyres'],
  'rear-wheel': ['rear wheel', 'rear tyre', 'rear tire', 'rear-tire', 'rear tires', 'rear tyres', 'back wheel', 'back tyre', 'back tire'],
  handlebar: ['handlebar', 'steering', 'bar'],
  seat: ['seat', 'saddle'],
  pedals: ['pedals', 'pedal'],
  chain: ['chain'],
  engine: ['engine', 'motor', 'e-motor', 'electric motor'],
}

export function insertGeneratedAsset(
  scene: SceneState,
  asset: { id: string; name: string; modelUrl: string; thumbnailUrl?: string },
): { scene: SceneState; objectId: string } {
  const baseId = normalizeText(asset.id).replace(/\s+/g, '-') || 'generated-asset'
  let objectId = baseId
  let suffix = 2
  while (scene.objects.some((object) => object.id === objectId)) {
    objectId = `${baseId}-${suffix}`
    suffix += 1
  }
  const result = applySceneTool(scene, 'createObject', {
    objectId,
    name: asset.name,
    type: 'generated-model',
    assetUrl: asset.modelUrl,
    thumbnailUrl: asset.thumbnailUrl,
    position: [0, 0.8, 0],
    scale: [1, 1, 1],
  })
  return { scene: result.scene, objectId }
}

const initialObjects: SceneObject[] = [
  { id: 'frame', name: 'Frame', type: 'frame', visible: true, position: [0, 0.9, 0], scale: [1, 1, 1], rotation: [0, 0, 0] },
  { id: 'front-wheel', name: 'Front Wheel', type: 'wheel', visible: true, position: [1.9, 0.55, 0], scale: [1, 1, 1], rotation: [0, 0, 0] },
  { id: 'rear-wheel', name: 'Rear Wheel', type: 'wheel', visible: true, position: [-1.9, 0.55, 0], scale: [1, 1, 1], rotation: [0, 0, 0] },
  { id: 'handlebar', name: 'Handlebar', type: 'component', visible: true, position: [1.6, 1.9, 0], scale: [1, 1, 1], rotation: [0, 0, -0.25] },
  { id: 'seat', name: 'Seat', type: 'component', visible: true, position: [0.15, 1.8, 0], scale: [1, 1, 1], rotation: [0, 0, 0] },
  { id: 'pedals', name: 'Pedals', type: 'component', visible: true, position: [0, 0.2, 0], scale: [1, 1, 1], rotation: [0, 0, 0] },
  { id: 'chain', name: 'Chain', type: 'component', visible: true, position: [0, 0.6, 0], scale: [1, 1, 1], rotation: [0, 0, 0] },
]

export const sceneToolDefinitions: ToolDefinition[] = [
  {
    name: 'transformObject',
    description: 'Apply position, rotation, and scale after a completed transform interaction.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string' },
        position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
        rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
        scale: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      },
      required: ['objectId', 'position', 'rotation', 'scale'],
    },
  },
  {
    name: 'createObject',
    description: 'Create a new object in the scene.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Unique identifier for the object.' },
        name: { type: 'string', description: 'Display name for the object.' },
        type: { type: 'string', description: 'Object category used by the scene engine.' },
        position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
        scale: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      },
      required: ['objectId', 'name', 'type'],
    },
  },
  {
    name: 'removeObject',
    description: 'Remove an object from the scene.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Object identifier to remove.' },
      },
      required: ['objectId'],
    },
  },
  {
    name: 'hideObject',
    description: 'Hide an object without removing it from the scene graph.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Object identifier to hide.' },
      },
      required: ['objectId'],
    },
  },
  {
    name: 'showObject',
    description: 'Show a previously hidden object.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Object identifier to show.' },
      },
      required: ['objectId'],
    },
  },
  {
    name: 'moveObject',
    description: 'Move an existing object in the scene.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Object identifier to move.' },
        position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      },
      required: ['objectId', 'position'],
    },
  },
  {
    name: 'rotateObject',
    description: 'Rotate an existing object.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Object identifier to rotate.' },
        rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      },
      required: ['objectId', 'rotation'],
    },
  },
  {
    name: 'scaleObject',
    description: 'Scale an existing object.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Object identifier to scale.' },
        scale: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      },
      required: ['objectId', 'scale'],
    },
  },
  {
    name: 'selectObject',
    description: 'Select a scene object.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Object identifier to select.' },
      },
      required: ['objectId'],
    },
  },
  {
    name: 'resetScene',
    description: 'Reset the scene back to the default mountain bike layout.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'undoScene',
    description: 'Restore the previous scene state.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'getSceneState',
    description: 'Return the current scene context and objects.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'addMotor',
    description: 'Add an engine or motor to the current bike scene.',
    parameters: {
      type: 'object',
      properties: {
        objectId: { type: 'string', description: 'Engine identifier, usually engine.' },
      },
      required: [],
    },
  },
]

export function createInitialScene(): SceneState {
  return {
    scene: INITIAL_SCENE_NAME,
    selectedId: 'frame',
    objects: initialObjects.map((object) => ({ ...object, position: [...object.position] as [number, number, number], scale: [...object.scale] as [number, number, number], rotation: [...object.rotation] as [number, number, number] })),
    history: [],
  }
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ')
}

export function cloneSceneObjects(objects: SceneObject[]): SceneObject[] {
  return objects.map((object) => ({
    ...object,
    position: [...object.position] as [number, number, number],
    scale: [...object.scale] as [number, number, number],
    rotation: [...object.rotation] as [number, number, number],
  }))
}

export function cloneSceneState(scene: SceneState): SceneState {
  return {
    scene: scene.scene,
    selectedId: scene.selectedId,
    objects: cloneSceneObjects(scene.objects),
    history: scene.history.map((snapshot) => ({
      scene: snapshot.scene,
      selectedId: snapshot.selectedId,
      objects: cloneSceneObjects(snapshot.objects),
    })),
  }
}

function sceneSnapshot(scene: SceneState) {
  return {
    scene: scene.scene,
    selectedId: scene.selectedId,
    objects: cloneSceneObjects(scene.objects),
  }
}

export function getSceneContext(scene: SceneState): { scene: string; objects: Array<{ id: string; name: string; type: string; visible: boolean }> } {
  return {
    scene: scene.scene,
    objects: scene.objects.map((object) => ({
      id: object.id,
      name: object.name,
      type: object.type,
      visible: object.visible,
    })),
  }
}

export function resolveObjectId(value: string, scene: SceneState): string | null {
  const target = normalizeText(value)

  for (const object of scene.objects) {
    if (normalizeText(object.id) === target || normalizeText(object.name) === target) {
      return object.id
    }

    const aliases = OBJECT_ALIASES[object.id] ?? []
    if (aliases.some((alias) => normalizeText(alias) === target)) {
      return object.id
    }

    if (aliases.some((alias) => target.includes(normalizeText(alias)))) {
      return object.id
    }
  }

  return null
}

function pushSceneHistory(scene: SceneState): SceneState {
  return { ...scene, history: [sceneSnapshot(scene), ...scene.history].slice(0, 20) }
}

function parseArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null
  if (!value.every((entry) => typeof entry === 'number')) return null
  return value as number[]
}

export function applySceneTool(scene: SceneState, toolName: string, args: ToolArgumentRecord = {}): { scene: SceneState; result: ToolResult } {
  scene = cloneSceneState(scene)

  if (toolName === 'getSceneState') {
    return {
      scene,
      result: {
        success: true,
        action: 'getSceneState',
        message: 'Scene context retrieved.',
        details: { sceneContext: getSceneContext(scene) },
      },
    }
  }

  if (toolName === 'resetScene') {
    const reset = createInitialScene()
    reset.history = [sceneSnapshot(scene)]
    return {
      scene: reset,
      result: { success: true, action: 'resetScene', message: 'Scene reset to the default Mountain Bike layout.' },
    }
  }

  if (toolName === 'undoScene') {
    if (scene.history.length === 0) {
      return {
        scene,
        result: { success: false, action: 'undoScene', error: 'There is no previous scene state to restore.' },
      }
    }

    const [previous, ...remaining] = scene.history
    const restored: SceneState = {
      scene: previous.scene,
      selectedId: previous.selectedId,
      objects: cloneSceneObjects(previous.objects),
      history: remaining,
    }

    return {
      scene: restored,
      result: { success: true, action: 'undoScene', message: 'Previous scene state restored.' },
    }
  }

  if (toolName === 'createObject') {
    const objectId = typeof args.objectId === 'string' ? args.objectId : null
    const name = typeof args.name === 'string' ? args.name : null
    const type = typeof args.type === 'string' ? args.type : null

    if (!objectId || !name || !type) {
      return { scene, result: { success: false, action: 'createObject', error: 'createObject requires objectId, name, and type.' } }
    }

    if (scene.objects.some((entry) => entry.id === objectId)) {
      return { scene, result: { success: false, action: 'createObject', objectId, error: `Object ${objectId} already exists.` } }
    }

    scene = pushSceneHistory(scene)
    const position = parseArray(args.position) ?? [0, 0, 0]
    const scale = parseArray(args.scale) ?? [1, 1, 1]
    const assetUrl = typeof args.assetUrl === 'string' ? args.assetUrl : undefined
    const thumbnailUrl = typeof args.thumbnailUrl === 'string' ? args.thumbnailUrl : undefined

    scene.objects = [
      ...scene.objects,
      {
        id: objectId,
        name,
        type,
        visible: true,
        position: [position[0] ?? 0, position[1] ?? 0, position[2] ?? 0] as [number, number, number],
        scale: [scale[0] ?? 1, scale[1] ?? 1, scale[2] ?? 1] as [number, number, number],
        rotation: [0, 0, 0],
        assetUrl,
        thumbnailUrl,
        generated: Boolean(assetUrl),
      },
    ]
    scene.selectedId = objectId

    return { scene, result: { success: true, action: 'createObject', objectId, message: `${name} created.` } }
  }

  if (toolName === 'addMotor') {
    const existingEngine = scene.objects.find((entry) => entry.id === 'engine')
    if (existingEngine) {
      scene.selectedId = 'engine'
      return { scene, result: { success: true, action: 'addMotor', objectId: 'engine', message: 'Engine already in scene.' } }
    }

    return applySceneTool(scene, 'createObject', {
      objectId: 'engine',
      name: 'Engine',
      type: 'engine',
      position: [0.2, 0.8, 0],
      scale: [0.9, 0.9, 0.9],
    })
  }

  const objectId = typeof args.objectId === 'string' ? args.objectId : null
  if (!objectId) {
    return { scene, result: { success: false, action: toolName, error: `Tool ${toolName} requires an objectId.` } }
  }

  const resolvedId = resolveObjectId(objectId, scene) ?? objectId
  const target = scene.objects.find((entry) => entry.id === resolvedId)

  if (!target) {
    return {
      scene,
      result: { success: false, action: toolName, objectId: resolvedId, error: `Object ${resolvedId} was not found.` },
    }
  }

  if (toolName === 'removeObject') {
    scene = pushSceneHistory(scene)
    scene.objects = scene.objects.filter((entry) => entry.id !== resolvedId)
    scene.selectedId = scene.objects[0]?.id ?? 'frame'
    return { scene, result: { success: true, action: 'removeObject', objectId: resolvedId, message: `${target.name} removed.` } }
  }

  if (toolName === 'hideObject') {
    scene = pushSceneHistory(scene)
    target.visible = false
    return { scene, result: { success: true, action: 'hideObject', objectId: resolvedId, message: `${target.name} hidden.` } }
  }

  if (toolName === 'showObject') {
    scene = pushSceneHistory(scene)
    target.visible = true
    return { scene, result: { success: true, action: 'showObject', objectId: resolvedId, message: `${target.name} shown.` } }
  }

  if (toolName === 'transformObject') {
    const position = parseArray(args.position)
    const rotation = parseArray(args.rotation)
    const scale = parseArray(args.scale)
    if (!position || !rotation || !scale) {
      return { scene, result: { success: false, action: 'transformObject', objectId: resolvedId, error: 'transformObject requires position, rotation, and scale arrays.' } }
    }
    scene = pushSceneHistory(scene)
    target.position = [position[0] ?? 0, position[1] ?? 0, position[2] ?? 0] as [number, number, number]
    target.rotation = [rotation[0] ?? 0, rotation[1] ?? 0, rotation[2] ?? 0] as [number, number, number]
    target.scale = [scale[0] ?? 1, scale[1] ?? 1, scale[2] ?? 1] as [number, number, number]
    scene.selectedId = resolvedId
    return { scene, result: { success: true, action: 'transformObject', objectId: resolvedId, message: `${target.name} transformed.` } }
  }

  if (toolName === 'moveObject') {
    const nextPosition = parseArray(args.position)
    if (!nextPosition) {
      return { scene, result: { success: false, action: 'moveObject', objectId: resolvedId, error: 'moveObject requires a 3-item position array.' } }
    }

    scene = pushSceneHistory(scene)
    target.position = [nextPosition[0] ?? 0, nextPosition[1] ?? 0, nextPosition[2] ?? 0] as [number, number, number]
    scene.selectedId = resolvedId
    return { scene, result: { success: true, action: 'moveObject', objectId: resolvedId, message: `${target.name} moved.` } }
  }

  if (toolName === 'rotateObject') {
    const nextRotation = parseArray(args.rotation)
    if (!nextRotation) {
      return { scene, result: { success: false, action: 'rotateObject', objectId: resolvedId, error: 'rotateObject requires a 3-item rotation array.' } }
    }
    scene = pushSceneHistory(scene)
    target.rotation = [nextRotation[0] ?? 0, nextRotation[1] ?? 0, nextRotation[2] ?? 0] as [number, number, number]
    scene.selectedId = resolvedId
    return { scene, result: { success: true, action: 'rotateObject', objectId: resolvedId, message: `${target.name} rotated.` } }
  }

  if (toolName === 'scaleObject') {
    const nextScale = parseArray(args.scale)
    if (!nextScale) {
      return { scene, result: { success: false, action: 'scaleObject', objectId: resolvedId, error: 'scaleObject requires a 3-item scale array.' } }
    }
    scene = pushSceneHistory(scene)
    target.scale = [nextScale[0] ?? 1, nextScale[1] ?? 1, nextScale[2] ?? 1] as [number, number, number]
    scene.selectedId = resolvedId
    return { scene, result: { success: true, action: 'scaleObject', objectId: resolvedId, message: `${target.name} scaled.` } }
  }

  if (toolName === 'selectObject') {
    scene.selectedId = resolvedId
    return {
      scene,
      result: { success: true, action: 'selectObject', objectId: resolvedId, message: `${target.name} selected.` },
    }
  }

  return {
    scene,
    result: { success: false, action: toolName, objectId: resolvedId, error: `Unsupported tool action: ${toolName}.` },
  }
}
