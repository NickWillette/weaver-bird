import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'
import { blockModelToThreeJs } from './modelConverter'
import type { BlockModel } from '@lib/tauri/blockModels'

describe('modelConverter', () => {
  describe('blockModelToThreeJs', () => {
    it('should create an orange placeholder cube when model has no elements', async () => {
      const model: BlockModel = {
        textures: {
          all: 'minecraft:block/dirt',
        },
        elements: [],
      }

      const mockTextureLoader = vi.fn().mockResolvedValue(null)
      const group = await blockModelToThreeJs(model, mockTextureLoader)

      expect(group).toBeInstanceOf(THREE.Group)
      expect(group.children.length).toBe(1)

      const mesh = group.children[0] as THREE.Mesh
      expect(mesh).toBeInstanceOf(THREE.Mesh)

      const material = mesh.material as THREE.MeshStandardMaterial
      expect(material.color.getHex()).toBe(0xff6b00) // Orange placeholder
    })

    it('should create an orange placeholder cube when model elements is undefined', async () => {
      const model: BlockModel = {
        textures: {
          all: 'minecraft:block/dirt',
        },
        // elements is undefined
      }

      const mockTextureLoader = vi.fn().mockResolvedValue(null)
      const group = await blockModelToThreeJs(model, mockTextureLoader)

      expect(group).toBeInstanceOf(THREE.Group)
      expect(group.children.length).toBe(1)

      const mesh = group.children[0] as THREE.Mesh
      const material = mesh.material as THREE.MeshStandardMaterial
      expect(material.color.getHex()).toBe(0xff6b00) // Orange placeholder
    })

    it('should create a simple cube model with one element', async () => {
      const model: BlockModel = {
        textures: {
          all: 'minecraft:block/dirt',
        },
        elements: [
          {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: {
              north: { texture: '#all' },
              south: { texture: '#all' },
              east: { texture: '#all' },
              west: { texture: '#all' },
              up: { texture: '#all' },
              down: { texture: '#all' },
            },
          },
        ],
      }

      const mockTexture = new THREE.Texture()
      const mockTextureLoader = vi.fn().mockResolvedValue(mockTexture)

      const group = await blockModelToThreeJs(model, mockTextureLoader)

      expect(group).toBeInstanceOf(THREE.Group)
      expect(group.children.length).toBe(1)

      // Verify texture loader was called for each face
      expect(mockTextureLoader).toHaveBeenCalledWith('minecraft:block/dirt')
      expect(mockTextureLoader).toHaveBeenCalledTimes(6) // 6 faces
    })

    it('should handle multi-element models', async () => {
      const model: BlockModel = {
        textures: {
          texture: 'minecraft:block/planks',
        },
        elements: [
          {
            from: [0, 0, 0],
            to: [16, 8, 16],
            faces: {
              north: { texture: '#texture' },
              south: { texture: '#texture' },
              east: { texture: '#texture' },
              west: { texture: '#texture' },
              up: { texture: '#texture' },
              down: { texture: '#texture' },
            },
          },
          {
            from: [0, 8, 0],
            to: [16, 16, 16],
            faces: {
              north: { texture: '#texture' },
              south: { texture: '#texture' },
              east: { texture: '#texture' },
              west: { texture: '#texture' },
              up: { texture: '#texture' },
              down: { texture: '#texture' },
            },
          },
        ],
      }

      const mockTexture = new THREE.Texture()
      const mockTextureLoader = vi.fn().mockResolvedValue(mockTexture)

      const group = await blockModelToThreeJs(model, mockTextureLoader)

      expect(group).toBeInstanceOf(THREE.Group)
      expect(group.children.length).toBe(2) // Two elements
    })

    it('should resolve texture variables correctly', async () => {
      const model: BlockModel = {
        textures: {
          all: '#base',
          base: 'minecraft:block/stone',
        },
        elements: [
          {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: {
              north: { texture: '#all' },
              south: { texture: '#all' },
              east: { texture: '#all' },
              west: { texture: '#all' },
              up: { texture: '#all' },
              down: { texture: '#all' },
            },
          },
        ],
      }

      const mockTexture = new THREE.Texture()
      const mockTextureLoader = vi.fn().mockResolvedValue(mockTexture)

      await blockModelToThreeJs(model, mockTextureLoader)

      // Should resolve #all -> #base -> minecraft:block/stone
      expect(mockTextureLoader).toHaveBeenCalledWith('minecraft:block/stone')
    })

    it('should handle missing textures gracefully', async () => {
      const model: BlockModel = {
        textures: {
          side: 'minecraft:block/planks',
        },
        elements: [
          {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: {
              north: { texture: '#side' },
              south: { texture: '#side' },
              east: { texture: '#missing' }, // Unresolved variable
              west: { texture: '#side' },
              up: { texture: '#side' },
              down: { texture: '#side' },
            },
          },
        ],
      }

      const mockTexture = new THREE.Texture()
      const mockTextureLoader = vi.fn().mockResolvedValue(mockTexture)

      const group = await blockModelToThreeJs(model, mockTextureLoader)

      expect(group).toBeInstanceOf(THREE.Group)
      expect(group.children.length).toBe(1)

      // Should only try to load the resolved texture
      expect(mockTextureLoader).toHaveBeenCalledWith('minecraft:block/planks')
      expect(mockTextureLoader).not.toHaveBeenCalledWith('#missing')
    })

    it('should create materials with proper Three.js configuration', async () => {
      const model: BlockModel = {
        textures: {
          all: 'minecraft:block/dirt',
        },
        elements: [
          {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: {
              north: { texture: '#all' },
            },
          },
        ],
      }

      const mockTexture = new THREE.Texture()
      const mockTextureLoader = vi.fn().mockResolvedValue(mockTexture)

      const group = await blockModelToThreeJs(model, mockTextureLoader)
      const mesh = group.children[0] as THREE.Mesh
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

      // Check that at least one material has the texture
      const texturedMaterial = materials.find(
        (mat) => mat instanceof THREE.MeshStandardMaterial && mat.map === mockTexture
      ) as THREE.MeshStandardMaterial

      expect(texturedMaterial).toBeDefined()
      expect(texturedMaterial.map).toBe(mockTexture)
      expect(texturedMaterial.roughness).toBe(0.8)
      expect(texturedMaterial.metalness).toBe(0.2)
      expect(texturedMaterial.transparent).toBe(true)
      expect(texturedMaterial.alphaTest).toBe(0.1)
    })

    it('should handle texture loader returning null', async () => {
      const model: BlockModel = {
        textures: {
          all: 'minecraft:block/missing',
        },
        elements: [
          {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: {
              north: { texture: '#all' },
            },
          },
        ],
      }

      const mockTextureLoader = vi.fn().mockResolvedValue(null)

      const group = await blockModelToThreeJs(model, mockTextureLoader)

      expect(group).toBeInstanceOf(THREE.Group)
      expect(group.children.length).toBe(1)

      // Should still create the mesh with magenta fallback materials
      const mesh = group.children[0] as THREE.Mesh
      expect(mesh).toBeInstanceOf(THREE.Mesh)
    })

    it('should handle elements with different face textures', async () => {
      const model: BlockModel = {
        textures: {
          top: 'minecraft:block/grass_block_top',
          side: 'minecraft:block/grass_block_side',
          bottom: 'minecraft:block/dirt',
        },
        elements: [
          {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: {
              up: { texture: '#top' },
              down: { texture: '#bottom' },
              north: { texture: '#side' },
              south: { texture: '#side' },
              east: { texture: '#side' },
              west: { texture: '#side' },
            },
          },
        ],
      }

      const mockTexture = new THREE.Texture()
      const mockTextureLoader = vi.fn().mockResolvedValue(mockTexture)

      await blockModelToThreeJs(model, mockTextureLoader)

      // Should load three different textures
      expect(mockTextureLoader).toHaveBeenCalledWith('minecraft:block/grass_block_top')
      expect(mockTextureLoader).toHaveBeenCalledWith('minecraft:block/grass_block_side')
      expect(mockTextureLoader).toHaveBeenCalledWith('minecraft:block/dirt')
    })
  })
})
