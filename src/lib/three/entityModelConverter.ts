/**
 * Converts entity model definitions to Three.js geometry
 *
 * Entity models differ from block models in several ways:
 * - UV coordinates are in absolute texture pixels, not 0-16 normalized
 * - Models have hierarchical bone structure with pivot points
 * - Textures are typically 64x64 (or larger) rather than 16x16
 */
import * as THREE from "three";
import type { EntityModel, EntityBone, EntityCuboid } from "@lib/entityModels";

const MINECRAFT_UNIT = 16; // Minecraft uses 16 pixels per block unit

/**
 * Convert an entity model to a Three.js Group
 *
 * @param model - The entity model definition
 * @param texture - The loaded texture for the entity
 * @returns Three.js Group containing the entity geometry
 */
export function entityModelToThreeJs(
  model: EntityModel,
  texture: THREE.Texture | null,
): THREE.Group {
  console.log("=== [entityModelConverter] Converting Entity Model to Three.js ===");
  console.log("[entityModelConverter] Entity type:", model.type);
  console.log("[entityModelConverter] Texture size:", model.textureSize);
  console.log("[entityModelConverter] Bone count:", model.bones.length);

  const group = new THREE.Group();

  // Configure texture for pixel-perfect rendering
  if (texture) {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  }

  // Convert each bone to Three.js geometry
  for (const bone of model.bones) {
    const boneGroup = convertBone(bone, model.textureSize, texture);
    group.add(boneGroup);
  }

  // Center the model - entity models are defined with origin at bottom center
  // Offset by -8 pixels (-0.5 blocks) to center horizontally
  group.position.set(0, 0, 0);

  console.log(`[entityModelConverter] ✓ Conversion complete. Group has ${countMeshes(group)} meshes`);
  console.log("================================================================");

  return group;
}

/**
 * Convert a bone (and its children) to Three.js geometry
 */
function convertBone(
  bone: EntityBone,
  textureSize: [number, number],
  texture: THREE.Texture | null,
): THREE.Group {
  const boneGroup = new THREE.Group();
  boneGroup.name = bone.name;

  console.log(`[entityModelConverter] Converting bone: ${bone.name}`);
  console.log(`[entityModelConverter] - Pivot: [${bone.pivot.join(", ")}]`);
  console.log(`[entityModelConverter] - Cuboids: ${bone.cuboids.length}`);

  // Convert each cuboid in this bone
  for (let i = 0; i < bone.cuboids.length; i++) {
    const cuboid = bone.cuboids[i];
    const mesh = createCuboidMesh(cuboid, textureSize, texture);
    if (mesh) {
      boneGroup.add(mesh);
    }
  }

  // Convert child bones
  if (bone.children) {
    for (const child of bone.children) {
      const childGroup = convertBone(child, textureSize, texture);
      boneGroup.add(childGroup);
    }
  }

  // Apply bone rotation if specified
  if (bone.rotation) {
    const [rx, ry, rz] = bone.rotation;
    boneGroup.rotation.set(
      THREE.MathUtils.degToRad(rx),
      THREE.MathUtils.degToRad(ry),
      THREE.MathUtils.degToRad(rz),
    );
  }

  // Set pivot point (bones rotate around their pivot)
  // In Three.js, we need to offset the geometry relative to the pivot
  const [px, py, pz] = bone.pivot;
  boneGroup.position.set(
    px / MINECRAFT_UNIT - 0.5, // Center horizontally
    py / MINECRAFT_UNIT,       // Keep Y as-is (0 at bottom)
    pz / MINECRAFT_UNIT - 0.5, // Center on Z
  );

  return boneGroup;
}

/**
 * Create a Three.js mesh for a single cuboid
 */
function createCuboidMesh(
  cuboid: EntityCuboid,
  textureSize: [number, number],
  texture: THREE.Texture | null,
): THREE.Mesh | null {
  const [ox, oy, oz] = cuboid.origin;
  const [sx, sy, sz] = cuboid.size;

  // Calculate size in Three.js units
  const width = sx / MINECRAFT_UNIT;
  const height = sy / MINECRAFT_UNIT;
  const depth = sz / MINECRAFT_UNIT;

  console.log(`[entityModelConverter] Creating cuboid: origin [${ox}, ${oy}, ${oz}], size [${sx}, ${sy}, ${sz}]`);

  // Create box geometry
  const geometry = new THREE.BoxGeometry(width, height, depth);

  // Apply UV coordinates for each face
  applyEntityUVs(geometry, cuboid, textureSize);

  // Create material
  let material: THREE.Material;
  if (texture) {
    material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      roughness: 0.8,
      metalness: 0.2,
    });
  } else {
    // Fallback material when texture is missing
    material = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown placeholder
      roughness: 0.8,
      metalness: 0.2,
    });
  }

  const mesh = new THREE.Mesh(geometry, material);

  // Position the mesh
  // Origin is bottom-left-back corner, so we need to offset to center
  const centerX = (ox + sx / 2) / MINECRAFT_UNIT - 0.5;
  const centerY = (oy + sy / 2) / MINECRAFT_UNIT;
  const centerZ = (oz + sz / 2) / MINECRAFT_UNIT - 0.5;
  mesh.position.set(centerX, centerY, centerZ);

  // Enable shadows
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/**
 * Apply entity UV coordinates to box geometry
 *
 * Entity UVs are specified as [u, v] for the top-left corner of each face
 * in texture pixels. The face size is determined by the cuboid dimensions.
 */
function applyEntityUVs(
  geometry: THREE.BoxGeometry,
  cuboid: EntityCuboid,
  textureSize: [number, number],
): void {
  const [texWidth, texHeight] = textureSize;
  const [, , ] = cuboid.origin;
  const [sx, sy, sz] = cuboid.size;

  const uvAttr = geometry.attributes.uv;
  if (!uvAttr) return;

  // Map face names to Three.js box face indices
  // Three.js order: [right(+X), left(-X), top(+Y), bottom(-Y), front(+Z), back(-Z)]
  // Minecraft: east, west, up, down, south, north
  const faceConfigs: { name: keyof typeof cuboid.uv; index: number; width: number; height: number }[] = [
    { name: "east", index: 0, width: sz, height: sy },   // right face (+X) shows Z×Y
    { name: "west", index: 1, width: sz, height: sy },   // left face (-X) shows Z×Y
    { name: "up", index: 2, width: sx, height: sz },     // top face (+Y) shows X×Z
    { name: "down", index: 3, width: sx, height: sz },   // bottom face (-Y) shows X×Z
    { name: "south", index: 4, width: sx, height: sy },  // front face (+Z) shows X×Y
    { name: "north", index: 5, width: sx, height: sy },  // back face (-Z) shows X×Y
  ];

  for (const config of faceConfigs) {
    const faceUV = cuboid.uv[config.name];
    if (!faceUV) continue;

    const [u, v] = faceUV;
    const faceWidth = config.width;
    const faceHeight = config.height;

    // Convert pixel coordinates to 0-1 UV space
    // Entity textures have (0,0) at top-left, Three.js at bottom-left
    const u1 = u / texWidth;
    const v1 = 1 - v / texHeight;                    // Top of face
    const u2 = (u + faceWidth) / texWidth;
    const v2 = 1 - (v + faceHeight) / texHeight;     // Bottom of face

    // Set UV coordinates for the 4 vertices of this face
    const baseIndex = config.index * 4;

    // Three.js BoxGeometry vertex layout per face:
    // 2---3  (v1 - top)
    // |   |
    // 0---1  (v2 - bottom)
    uvAttr.setXY(baseIndex + 0, u1, v2); // Bottom-left
    uvAttr.setXY(baseIndex + 1, u2, v2); // Bottom-right
    uvAttr.setXY(baseIndex + 2, u1, v1); // Top-left
    uvAttr.setXY(baseIndex + 3, u2, v1); // Top-right
  }

  uvAttr.needsUpdate = true;
}

/**
 * Count total meshes in a group (for debugging)
 */
function countMeshes(group: THREE.Group): number {
  let count = 0;
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      count++;
    }
  });
  return count;
}

/**
 * Helper to create a texture loader for entity textures
 *
 * Entity textures follow a different path pattern than block textures.
 * They're located at: assets/minecraft/textures/entity/{type}/{variant}.png
 */
export function getEntityTexturePath(
  entityType: string,
  textureName: string = "normal",
): string {
  // Map entity types to their texture paths
  const pathMap: Record<string, string> = {
    chest: `entity/chest/${textureName}`,
    trapped_chest: "entity/chest/trapped",
    ender_chest: "entity/chest/ender",
    shulker_box: `entity/shulker/shulker${textureName === "normal" ? "" : `_${textureName}`}`,
  };

  return pathMap[entityType] || `entity/${entityType}/${textureName}`;
}
