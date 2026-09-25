import type {
  SceneCommand,
  SceneContext,
  SceneObject,
  SceneState,
  ToolArgumentRecord,
  ToolDefinition,
  ToolResult,
} from '../types/scene'

export type {
  SceneCommand,
  SceneContext,
  SceneContextObject,
  SceneObject,
  SceneSnapshot,
  SceneState,
  ToolArgumentRecord,
  ToolDefinition,
  ToolResult,
} from '../types/scene'

export const INITIAL_SCENE_NAME = 'Mountain Bike'

const OBJECT_ALIASES: Record<string, string[]> = {
  frame: ['frame', 'bike frame', 'main frame', 'chassis', 'body', 'bicycle frame'],
  'front-wheel': [
    'front wheel',
    'front tyre',
    'front tire',
    'front-tire',
    'front-wheel',
    'front wheels',
    'front tyres',
    'front tires',
  ],
  'rear-wheel': [
    'rear wheel',
    'rear tyre',
    'rear tire',
    'rear-tire',
    'rear-wheel',
    'rear wheels',
    'rear tyres',
    'rear tires',
    'back wheel',
    'back tyre',
    'back tire',
    'back wheels',
    'back tyres',
  ],
  handlebar: ['handlebar', 'handlebars', 'steering', 'bar', 'bars', 'handle bar'],
  seat: ['seat', 'saddle', 'bike seat', 'bike saddle'],
  pedals: ['pedals', 'pedal', 'crank', 'bike pedals'],
  chain: ['chain', 'drive chain', 'bike chain'],
  engine: ['engine', 'motor', 'e-motor', 'electric motor', 'battery motor'],
}

const GROUP_ALIASES: Record<string, string[]> = {
  'both tyres': ['front-wheel', 'rear-wheel'],
  'both tires': ['front-wheel', 'rear-wheel'],
  'both wheels': ['front-wheel', 'rear-wheel'],
  'all tyres': ['front-wheel', 'rear-wheel'],
  'all tires': ['front-wheel', 'rear-wheel'],
  'all wheels': ['front-wheel', 'rear-wheel'],
  'the tyres': ['front-wheel', 'rear-wheel'],
  'the tires': ['front-wheel', 'rear-wheel'],
  'the wheels': ['front-wheel', 'rear-wheel'],
  tyres: ['front-wheel', 'rear-wheel'],
  tires: ['front-wheel', 'rear-wheel'],
  wheels: ['front-wheel', 'rear-wheel'],
  'pair of wheels': ['front-wheel', 'rear-wheel'],
  'pair of tyres': ['front-wheel', 'rear-wheel'],
  'pair of tires': ['front-wheel', 'rear-wheel'],
  drivetrain: ['pedals', 'chain'],
  'pedals and chain': ['pedals', 'chain'],
}

const initialObjects: SceneObject[] = [
  {
    id: 'frame',
    name: 'Frame',
    type: 'frame',
    visible: true,
    position: [0, 0.9, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    metadata: { category: 'structure', material: 'aluminum' },
  },
  {
    id: 'front-wheel',
    name: 'Front Wheel',
    type: 'wheel',
    visible: true,
    parentId: 'frame',
    position: [1.9, 0.55, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    metadata: { placement: 'front', diameter: 29 },
  },
  {
    id: 'rear-wheel',
    name: 'Rear Wheel',
    type: 'wheel',
    visible: true,
    parentId: 'frame',
    position: [-1.9, 0.55, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    metadata: { placement: 'rear', diameter: 29 },
  },
  {
    id: 'handlebar',
    name: 'Handlebar',
    type: 'component',
    visible: true,
    parentId: 'frame',
    position: [1.6, 1.9, 0],
    rotation: [0, 0, -0.25],
    scale: [1, 1, 1],
    metadata: { placement: 'cockpit' },
  },
  {
    id: 'seat',
    name: 'Seat',
    type: 'component',
    visible: true,
    parentId: 'frame',
    position: [0.15, 1.8, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    metadata: { placement: 'saddle' },
  },
  {
    id: 'pedals',
    name: 'Pedals',
    type: 'component',
    visible: true,
    parentId: 'frame',
    position: [0, 0.2, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    metadata: { placement: 'drivetrain' },
  },
  {
    id: 'chain',
    name: 'Chain',
    type: 'component',
    visible: true,
    parentId: 'frame',
    position: [0, 0.6, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    metadata: { placement: 'drivetrain' },
  },
]

export const sceneToolDefinitions: ToolDefinition[] = [
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
        rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
        scale: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
        parentId: { type: 'string', description: 'Parent object identifier for hierarchy.' },
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
    name: 'removeObjects',
    description: 'Remove multiple objects from the scene simultaneously.',
    parameters: {
      type: 'object',
      properties: {
        objectIds: { type: 'array', items: { type: 'string' }, description: 'Array of object IDs to remove.' },
      },
      required: ['objectIds'],
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
    name: 'hideObjects',
    description: 'Hide multiple objects simultaneously.',
    parameters: {
      type: 'object',
      properties: {
        objectIds: { type: 'array', items: { type: 'string' }, description: 'Array of object IDs to hide.' },
      },
      required: ['objectIds'],
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
    name: 'showObjects',
    description: 'Show multiple previously hidden objects simultaneously.',
    parameters: {
      type: 'object',
      properties: {
        objectIds: { type: 'array', items: { type: 'string' }, description: 'Array of object IDs to show.' },
      },
      required: ['objectIds'],
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
    objects: initialObjects.map((object) => ({
      ...object,
      position: [...object.position] as [number, number, number],
      rotation: [...object.rotation] as [number, number, number],
      scale: [...object.scale] as [number, number, number],
      metadata: object.metadata ? { ...object.metadata } : undefined,
    })),
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
    rotation: [...object.rotation] as [number, number, number],
    scale: [...object.scale] as [number, number, number],
    metadata: object.metadata ? { ...object.metadata } : undefined,
  }))
}

function cloneSceneState(scene: SceneState): SceneState {
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

export function pushSceneHistory(scene: SceneState): void {
  scene.history = [
    {
      scene: scene.scene,
      selectedId: scene.selectedId,
      objects: cloneSceneObjects(scene.objects),
    },
    ...scene.history,
  ].slice(0, 25)
}

function parseArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null
  if (!value.every((entry) => typeof entry === 'number')) return null
  return value as number[]
}

function vectorsEqual(a: [number, number, number], b: [number, number, number], epsilon = 0.0001): boolean {
  return Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon && Math.abs(a[2] - b[2]) < epsilon
}

/**
 * Concise structured scene context for AI reasoning.
 * Omits vertex/geometry arrays to keep token payload minimal and high-signal.
 */
export function getSceneContext(scene: SceneState): SceneContext {
  return {
    scene: scene.scene,
    selectedId: scene.selectedId,
    objectCount: scene.objects.length,
    visibleCount: scene.objects.filter((o) => o.visible).length,
    objects: scene.objects.map((object) => ({
      id: object.id,
      name: object.name,
      type: object.type,
      visible: object.visible,
      parentId: object.parentId,
      position: [...object.position] as [number, number, number],
      rotation: [...object.rotation] as [number, number, number],
      scale: [...object.scale] as [number, number, number],
      metadata: object.metadata ? { ...object.metadata } : undefined,
    })),
  }
}

/**
 * Resolves a natural-language reference into a single object ID.
 */
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

/**
 * Resolves natural language references into one or more object IDs.
 * Handles plural queries like "both tyres", "wheels", "all components", etc.
 */
export function resolveTargetObjects(value: string, scene: SceneState): string[] {
  const target = normalizeText(value)
  if (!target) return []

  // Check group aliases
  for (const [groupKey, members] of Object.entries(GROUP_ALIASES)) {
    if (target === normalizeText(groupKey) || target.includes(normalizeText(groupKey))) {
      const existing = members.filter((id) => scene.objects.some((obj) => obj.id === id))
      if (existing.length > 0) return existing
    }
  }

  // Check object type / category (e.g. "wheel" -> ['front-wheel', 'rear-wheel'])
  const byType = scene.objects.filter((obj) => normalizeText(obj.type) === target).map((obj) => obj.id)
  if (byType.length > 0) return byType

  // Check single object resolver
  const single = resolveObjectId(value, scene)
  if (single) return [single]

  return []
}

/**
 * CENTRAL COMMAND BUS: executeSceneCommand
 * All manual controls, text commands, AI tool calls, and generation insertions
 * converge through this single source of truth.
 */
export function executeSceneCommand(
  scene: SceneState,
  command: SceneCommand
): { scene: SceneState; result: ToolResult } {
  scene = cloneSceneState(scene)
  switch (command.type) {
    case 'selectObject': {
      const resolvedId = resolveObjectId(command.objectId, scene) ?? command.objectId
      const target = scene.objects.find((obj) => obj.id === resolvedId)
      if (!target) {
        return {
          scene,
          result: { success: false, action: 'selectObject', objectId: resolvedId, error: `Object ${resolvedId} was not found.` },
        }
      }
      scene.selectedId = resolvedId
      return {
        scene,
        result: { success: true, action: 'selectObject', objectId: resolvedId, message: `${target.name} selected.` },
      }
    }

    case 'moveObject': {
      const resolvedId = resolveObjectId(command.objectId, scene) ?? command.objectId
      const target = scene.objects.find((obj) => obj.id === resolvedId)
      if (!target) {
        return {
          scene,
          result: { success: false, action: 'moveObject', objectId: resolvedId, error: `Object ${resolvedId} was not found.` },
        }
      }
      const newPos = command.position
      if (!vectorsEqual(target.position, newPos)) {
        pushSceneHistory(scene)
        target.position = [newPos[0], newPos[1], newPos[2]]
      }
      scene.selectedId = resolvedId
      return {
        scene,
        result: { success: true, action: 'moveObject', objectId: resolvedId, message: `${target.name} moved to [${newPos.join(', ')}].` },
      }
    }

    case 'rotateObject': {
      const resolvedId = resolveObjectId(command.objectId, scene) ?? command.objectId
      const target = scene.objects.find((obj) => obj.id === resolvedId)
      if (!target) {
        return {
          scene,
          result: { success: false, action: 'rotateObject', objectId: resolvedId, error: `Object ${resolvedId} was not found.` },
        }
      }
      const newRot = command.rotation
      if (!vectorsEqual(target.rotation, newRot)) {
        pushSceneHistory(scene)
        target.rotation = [newRot[0], newRot[1], newRot[2]]
      }
      scene.selectedId = resolvedId
      return {
        scene,
        result: { success: true, action: 'rotateObject', objectId: resolvedId, message: `${target.name} rotated to [${newRot.join(', ')}].` },
      }
    }

    case 'scaleObject': {
      const resolvedId = resolveObjectId(command.objectId, scene) ?? command.objectId
      const target = scene.objects.find((obj) => obj.id === resolvedId)
      if (!target) {
        return {
          scene,
          result: { success: false, action: 'scaleObject', objectId: resolvedId, error: `Object ${resolvedId} was not found.` },
        }
      }
      const newScale = command.scale
      if (!vectorsEqual(target.scale, newScale)) {
        pushSceneHistory(scene)
        target.scale = [newScale[0], newScale[1], newScale[2]]
      }
      scene.selectedId = resolvedId
      return {
        scene,
        result: { success: true, action: 'scaleObject', objectId: resolvedId, message: `${target.name} scaled to [${newScale.join(', ')}].` },
      }
    }

    case 'setTransform': {
      const resolvedId = resolveObjectId(command.objectId, scene) ?? command.objectId
      const target = scene.objects.find((obj) => obj.id === resolvedId)
      if (!target) {
        return {
          scene,
          result: { success: false, action: 'setTransform', objectId: resolvedId, error: `Object ${resolvedId} was not found.` },
        }
      }
      let changed = false
      if (command.position && !vectorsEqual(target.position, command.position)) {
        changed = true
      }
      if (command.rotation && !vectorsEqual(target.rotation, command.rotation)) {
        changed = true
      }
      if (command.scale && !vectorsEqual(target.scale, command.scale)) {
        changed = true
      }

      if (changed) {
        pushSceneHistory(scene)
        if (command.position) target.position = [command.position[0], command.position[1], command.position[2]]
        if (command.rotation) target.rotation = [command.rotation[0], command.rotation[1], command.rotation[2]]
        if (command.scale) target.scale = [command.scale[0], command.scale[1], command.scale[2]]
      }
      scene.selectedId = resolvedId
      return {
        scene,
        result: { success: true, action: 'setTransform', objectId: resolvedId, message: `${target.name} transform updated.` },
      }
    }

    case 'hideObject': {
      const resolvedId = resolveObjectId(command.objectId, scene) ?? command.objectId
      const target = scene.objects.find((obj) => obj.id === resolvedId)
      if (!target) {
        return {
          scene,
          result: { success: false, action: 'hideObject', objectId: resolvedId, error: `Object ${resolvedId} was not found.` },
        }
      }
      if (target.visible) {
        pushSceneHistory(scene)
        target.visible = false
      }
      return {
        scene,
        result: { success: true, action: 'hideObject', objectId: resolvedId, message: `${target.name} hidden.` },
      }
    }

    case 'showObject': {
      const resolvedId = resolveObjectId(command.objectId, scene) ?? command.objectId
      const target = scene.objects.find((obj) => obj.id === resolvedId)
      if (!target) {
        return {
          scene,
          result: { success: false, action: 'showObject', objectId: resolvedId, error: `Object ${resolvedId} was not found.` },
        }
      }
      if (!target.visible) {
        pushSceneHistory(scene)
        target.visible = true
      }
      return {
        scene,
        result: { success: true, action: 'showObject', objectId: resolvedId, message: `${target.name} shown.` },
      }
    }

    case 'removeObject': {
      const resolvedId = resolveObjectId(command.objectId, scene) ?? command.objectId
      const target = scene.objects.find((obj) => obj.id === resolvedId)
      if (!target) {
        return {
          scene,
          result: { success: false, action: 'removeObject', objectId: resolvedId, error: `Object ${resolvedId} was not found.` },
        }
      }
      pushSceneHistory(scene)
      scene.objects = scene.objects.filter((obj) => obj.id !== resolvedId)
      if (scene.selectedId === resolvedId) {
        scene.selectedId = scene.objects[0]?.id ?? 'frame'
      }
      return {
        scene,
        result: { success: true, action: 'removeObject', objectId: resolvedId, message: `${target.name} removed.` },
      }
    }

    case 'hideObjects': {
      const targetIds = command.objectIds.map((id) => resolveObjectId(id, scene) ?? id)
      const validTargets = scene.objects.filter((obj) => targetIds.includes(obj.id) && obj.visible)
      if (validTargets.length === 0) {
        return {
          scene,
          result: { success: false, action: 'hideObjects', objectIds: targetIds, error: 'No matching visible objects found to hide.' },
        }
      }
      pushSceneHistory(scene)
      validTargets.forEach((obj) => {
        obj.visible = false
      })
      const names = validTargets.map((o) => o.name).join(', ')
      return {
        scene,
        result: {
          success: true,
          action: 'hideObjects',
          objectIds: validTargets.map((o) => o.id),
          message: `Hidden ${validTargets.length} objects (${names}).`,
        },
      }
    }

    case 'showObjects': {
      const targetIds = command.objectIds.map((id) => resolveObjectId(id, scene) ?? id)
      const validTargets = scene.objects.filter((obj) => targetIds.includes(obj.id) && !obj.visible)
      if (validTargets.length === 0) {
        return {
          scene,
          result: { success: false, action: 'showObjects', objectIds: targetIds, error: 'No matching hidden objects found to show.' },
        }
      }
      pushSceneHistory(scene)
      validTargets.forEach((obj) => {
        obj.visible = true
      })
      const names = validTargets.map((o) => o.name).join(', ')
      return {
        scene,
        result: {
          success: true,
          action: 'showObjects',
          objectIds: validTargets.map((o) => o.id),
          message: `Shown ${validTargets.length} objects (${names}).`,
        },
      }
    }

    case 'removeObjects': {
      const targetIds = command.objectIds.map((id) => resolveObjectId(id, scene) ?? id)
      const validTargets = scene.objects.filter((obj) => targetIds.includes(obj.id))
      if (validTargets.length === 0) {
        return {
          scene,
          result: { success: false, action: 'removeObjects', objectIds: targetIds, error: 'No matching objects found to remove.' },
        }
      }
      pushSceneHistory(scene)
      const removedIds = validTargets.map((o) => o.id)
      scene.objects = scene.objects.filter((obj) => !removedIds.includes(obj.id))
      if (removedIds.includes(scene.selectedId)) {
        scene.selectedId = scene.objects[0]?.id ?? 'frame'
      }
      const names = validTargets.map((o) => o.name).join(', ')
      return {
        scene,
        result: {
          success: true,
          action: 'removeObjects',
          objectIds: removedIds,
          message: `Removed ${removedIds.length} objects (${names}).`,
        },
      }
    }

    case 'createObject': {
      if (!command.objectId || !command.name) {
        return {
          scene,
          result: { success: false, action: 'createObject', error: 'createObject requires objectId and name.' },
        }
      }
      if (scene.objects.some((obj) => obj.id === command.objectId)) {
        return {
          scene,
          result: { success: false, action: 'createObject', objectId: command.objectId, error: `Object ${command.objectId} already exists.` },
        }
      }
      pushSceneHistory(scene)
      const newObject: SceneObject = {
        id: command.objectId,
        name: command.name,
        type: command.objectType ?? 'component',
        visible: true,
        position: command.position ? [command.position[0], command.position[1], command.position[2]] : [0, 0, 0],
        rotation: command.rotation ? [command.rotation[0], command.rotation[1], command.rotation[2]] : [0, 0, 0],
        scale: command.scale ? [command.scale[0], command.scale[1], command.scale[2]] : [1, 1, 1],
        parentId: command.parentId,
        metadata: command.metadata ? { ...command.metadata } : undefined,
        assetUrl: command.assetUrl,
        thumbnailUrl: command.thumbnailUrl,
        generated: command.generated ?? Boolean(command.assetUrl),
      }
      scene.objects = [...scene.objects, newObject]
      scene.selectedId = command.objectId
      return {
        scene,
        result: { success: true, action: 'createObject', objectId: command.objectId, message: `${command.name} created.` },
      }
    }

    case 'insertGeneratedAsset': {
      const asset = command.asset
      const baseId = normalizeText(asset.id).replace(/\s+/g, '-') || 'generated-asset'
      let objectId = baseId
      let suffix = 2
      while (scene.objects.some((object) => object.id === objectId)) {
        objectId = `${baseId}-${suffix}`
        suffix += 1
      }
      pushSceneHistory(scene)
      const newObject: SceneObject = {
        id: objectId,
        name: asset.name,
        type: 'generated-model',
        visible: true,
        position: asset.position ? [asset.position[0], asset.position[1], asset.position[2]] : [0, 0.8, 0],
        rotation: asset.rotation ? [asset.rotation[0], asset.rotation[1], asset.rotation[2]] : [0, 0, 0],
        scale: asset.scale ? [asset.scale[0], asset.scale[1], asset.scale[2]] : [1, 1, 1],
        assetUrl: asset.modelUrl,
        thumbnailUrl: asset.thumbnailUrl,
        generated: true,
      }
      scene.objects = [...scene.objects, newObject]
      scene.selectedId = objectId
      return {
        scene,
        result: { success: true, action: 'insertGeneratedAsset', objectId, message: `${asset.name} added to scene.` },
      }
    }

    case 'resetScene': {
      pushSceneHistory(scene)
      const fresh = createInitialScene()
      fresh.history = scene.history
      return {
        scene: fresh,
        result: { success: true, action: 'resetScene', message: 'Scene reset to default mountain bike layout.' },
      }
    }

    case 'undoScene': {
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

    default: {
      const exhaustiveCheck: never = command
      return {
        scene,
        result: { success: false, error: `Unhandled command type: ${(exhaustiveCheck as { type: string }).type}` },
      }
    }
  }
}

/**
 * Adapter mapping legacy tool calls into the unified executeSceneCommand architecture.
 * Fully preserves backward compatibility for existing tests and external consumers.
 */
export function applySceneTool(
  scene: SceneState,
  toolName: string,
  args: ToolArgumentRecord = {}
): { scene: SceneState; result: ToolResult } {
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
    return executeSceneCommand(scene, { type: 'resetScene' })
  }

  if (toolName === 'undoScene') {
    return executeSceneCommand(scene, { type: 'undoScene' })
  }

  if (toolName === 'addMotor') {
    const existing = scene.objects.find((obj) => obj.id === 'engine')
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

  if (toolName === 'removeObjects') {
    const ids = Array.isArray(args.objectIds) ? (args.objectIds as string[]) : []
    return executeSceneCommand(scene, { type: 'removeObjects', objectIds: ids })
  }

  if (toolName === 'hideObjects') {
    const ids = Array.isArray(args.objectIds) ? (args.objectIds as string[]) : []
    return executeSceneCommand(scene, { type: 'hideObjects', objectIds: ids })
  }

  if (toolName === 'showObjects') {
    const ids = Array.isArray(args.objectIds) ? (args.objectIds as string[]) : []
    return executeSceneCommand(scene, { type: 'showObjects', objectIds: ids })
  }

  if (toolName === 'createObject') {
    const objectId = typeof args.objectId === 'string' ? args.objectId : null
    const name = typeof args.name === 'string' ? args.name : null
    const type = typeof args.type === 'string' ? args.type : null
    if (!objectId || !name || !type) {
      return { scene, result: { success: false, action: 'createObject', error: 'createObject requires objectId, name, and type.' } }
    }
    const pos = parseArray(args.position)
    const rot = parseArray(args.rotation)
    const scl = parseArray(args.scale)
    return executeSceneCommand(scene, {
      type: 'createObject',
      objectId,
      name,
      objectType: type,
      position: pos ? [pos[0], pos[1], pos[2]] : undefined,
      rotation: rot ? [rot[0], rot[1], rot[2]] : undefined,
      scale: scl ? [scl[0], scl[1], scl[2]] : undefined,
      parentId: typeof args.parentId === 'string' ? args.parentId : undefined,
      assetUrl: typeof args.assetUrl === 'string' ? args.assetUrl : undefined,
      thumbnailUrl: typeof args.thumbnailUrl === 'string' ? args.thumbnailUrl : undefined,
    })
  }

  const objectId = typeof args.objectId === 'string' ? args.objectId : null
  if (!objectId) {
    return { scene, result: { success: false, action: toolName, error: `Tool ${toolName} requires an objectId.` } }
  }

  if (toolName === 'removeObject') {
    return executeSceneCommand(scene, { type: 'removeObject', objectId })
  }
  if (toolName === 'hideObject') {
    return executeSceneCommand(scene, { type: 'hideObject', objectId })
  }
  if (toolName === 'showObject') {
    return executeSceneCommand(scene, { type: 'showObject', objectId })
  }
  if (toolName === 'selectObject') {
    return executeSceneCommand(scene, { type: 'selectObject', objectId })
  }
  if (toolName === 'moveObject') {
    const pos = parseArray(args.position)
    if (!pos) {
      return { scene, result: { success: false, action: 'moveObject', objectId, error: 'moveObject requires a 3-item position array.' } }
    }
    return executeSceneCommand(scene, { type: 'moveObject', objectId, position: [pos[0], pos[1], pos[2]] })
  }
  if (toolName === 'rotateObject') {
    const rot = parseArray(args.rotation)
    if (!rot) {
      return { scene, result: { success: false, action: 'rotateObject', objectId, error: 'rotateObject requires a 3-item rotation array.' } }
    }
    return executeSceneCommand(scene, { type: 'rotateObject', objectId, rotation: [rot[0], rot[1], rot[2]] })
  }
  if (toolName === 'scaleObject') {
    const scl = parseArray(args.scale)
    if (!scl) {
      return { scene, result: { success: false, action: 'scaleObject', objectId, error: 'scaleObject requires a 3-item scale array.' } }
    }
    return executeSceneCommand(scene, { type: 'scaleObject', objectId, scale: [scl[0], scl[1], scl[2]] })
  }

  return {
    scene,
    result: { success: false, action: toolName, objectId, error: `Unsupported tool action: ${toolName}.` },
  }
}
