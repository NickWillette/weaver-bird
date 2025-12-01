/**
 * Entity Geometry Utilities
 * 
 * Converts JEM (JSON Entity Model) structures to RenderedFace objects
 * for CSS-based isometric rendering in MinecraftCSSBlock.
 * 
 * This bridges the gap between:
 * - JEM's ParsedBox format (from jemLoader.ts)
 * - RenderedFace format (used by MinecraftCSSBlock)
 */

import type { ParsedEntityModel, ParsedPart, ParsedBox } from "@lib/emf/jemLoader";
import type { RenderedElement, RenderedFace, NormalizedUV } from "@components/MinecraftCSSBlock/types";

/**
 * Pixels per block in Minecraft coordinate space
 */
const PIXELS_PER_UNIT = 16;

/**
 * Convert JEM UV coordinates to normalized UV for rendering
 * 
 * JEM UVs are in pixel coordinates [u1, v1, u2, v2]
 * We need to normalize to [0-1] range and calculate width/height
 */
function normalizeJEMUV(
    uv: [number, number, number, number],
    textureSize: [number, number],
): NormalizedUV {
    const [u1, v1, u2, v2] = uv;
    const [texWidth, texHeight] = textureSize;

    // Convert to 0-1 range
    const normU1 = u1 / texWidth;
    const normV1 = v1 / texHeight;
    const normU2 = u2 / texWidth;
    const normV2 = v2 / texHeight;

    const width = Math.abs(normU2 - normU1);
    const height = Math.abs(normV2 - normV1);

    return {
        u: Math.min(normU1, normU2),
        v: Math.min(normV1, normV2),
        width,
        height,
        flipX: normU2 < normU1 ? -1 : 1,
        flipY: normV2 < normV1 ? -1 : 1,
    };
}

/**
 * Generate a pre-baked CSS transform string for a face
 * (Same as blockGeometry.worker.ts for consistency)
 */
function generateFaceTransform(
    faceType: "top" | "left" | "right",
    x: number,
    y: number,
    z: number,
): string {
    const baseTransform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px)`;

    switch (faceType) {
        case "top":
            return `${baseTransform} rotateX(90deg)`;
        case "left":
            return baseTransform;
        case "right":
            return `${baseTransform} rotateY(90deg)`;
    }
}

/**
 * Check if a face should be rendered based on camera angle
 * At 135° isometric view, we only render up, north, and west faces
 */
function shouldRenderFace(faceDirection: string): boolean {
    return (
        faceDirection === "up" ||
        faceDirection === "north" ||
        faceDirection === "west"
    );
}

/**
 * Convert a single JEM box to RenderedFace array
 * 
 * @param box - Parsed JEM box with UV coordinates for each face
 * @param partOrigin - The origin point of the parent part (in pixels)
 * @param textureSize - Texture dimensions [width, height]
 * @param textureUrl - URL of the entity texture
 * @param scale - Scale factor for rendering
 * @returns Array of renderable faces
 */
export function convertJEMBoxToFaces(
    box: ParsedBox,
    partOrigin: [number, number, number],
    textureSize: [number, number],
    textureUrl: string,
    scale: number,
): RenderedFace[] {
    const faces: RenderedFace[] = [];
    const { from, to, uv } = box;

    // Calculate box dimensions in pixels
    const width = to[0] - from[0];
    const height = to[1] - from[1];
    const depth = to[2] - from[2];

    // Calculate box center in absolute coordinates
    const centerX = (from[0] + to[0]) / 2;
    const centerY = (from[1] + to[1]) / 2;
    const centerZ = (from[2] + to[2]) / 2;

    // Make relative to part origin (in Minecraft units)
    const relativeX = (centerX - partOrigin[0]) / PIXELS_PER_UNIT;
    const relativeY = (centerY - partOrigin[1]) / PIXELS_PER_UNIT;
    const relativeZ = (centerZ - partOrigin[2]) / PIXELS_PER_UNIT;

    // Scale to rendering space
    const scaledX = relativeX * scale;
    const scaledY = relativeY * scale;
    const scaledZ = relativeZ * scale;

    // Up face (top)
    // Check if UV defines a valid region (not all zeros AND has area)
    const hasValidUpUV = uv.up[2] > uv.up[0] || uv.up[3] > uv.up[1];
    if (shouldRenderFace("up") && hasValidUpUV) {
        const topX = scaledX;
        const topY = -(scaledY + (height / 2 / PIXELS_PER_UNIT) * scale);
        const topZ = scaledZ;

        faces.push({
            type: "top",
            textureUrl,
            x: topX,
            y: topY,
            z: topZ,
            width: (width / PIXELS_PER_UNIT) * scale,
            height: (depth / PIXELS_PER_UNIT) * scale,
            uv: normalizeJEMUV(uv.up, textureSize),
            zIndex: Math.round(relativeY * 10 + 100),
            brightness: 1.0,
            transform: generateFaceTransform("top", topX, topY, topZ),
        });
    }

    // North face (front in isometric view)
    const hasValidNorthUV = uv.north[2] > uv.north[0] || uv.north[3] > uv.north[1];
    if (shouldRenderFace("north") && hasValidNorthUV) {
        const northX = scaledX;
        const northY = -scaledY;
        const northZ = scaledZ - (depth / 2 / PIXELS_PER_UNIT) * scale;

        faces.push({
            type: "left",
            textureUrl,
            x: northX,
            y: northY,
            z: northZ,
            width: (width / PIXELS_PER_UNIT) * scale,
            height: (height / PIXELS_PER_UNIT) * scale,
            uv: normalizeJEMUV(uv.north, textureSize),
            zIndex: Math.round(relativeY * 10 + 40),
            brightness: 0.8,
            transform: generateFaceTransform("left", northX, northY, northZ),
        });
    }

    // West face (right side in isometric view)
    const hasValidWestUV = uv.west[2] > uv.west[0] || uv.west[3] > uv.west[1];
    if (shouldRenderFace("west") && hasValidWestUV) {
        const westX = scaledX - (width / 2 / PIXELS_PER_UNIT) * scale;
        const westY = -scaledY;
        const westZ = scaledZ;

        faces.push({
            type: "right",
            textureUrl,
            x: westX,
            y: westY,
            z: westZ,
            width: (depth / PIXELS_PER_UNIT) * scale,
            height: (height / PIXELS_PER_UNIT) * scale,
            uv: normalizeJEMUV(uv.west, textureSize),
            zIndex: Math.round(relativeY * 10 - 10),
            brightness: 0.6,
            transform: generateFaceTransform("right", westX, westY, westZ),
        });
    }

    // East face (could be visible in some cases)
    const hasValidEastUV = uv.east[2] > uv.east[0] || uv.east[3] > uv.east[1];
    if (hasValidEastUV) {
        const eastX = scaledX + (width / 2 / PIXELS_PER_UNIT) * scale;
        const eastY = -scaledY;
        const eastZ = scaledZ;

        faces.push({
            type: "right",
            textureUrl,
            x: eastX,
            y: eastY,
            z: eastZ,
            width: (depth / PIXELS_PER_UNIT) * scale,
            height: (height / PIXELS_PER_UNIT) * scale,
            uv: normalizeJEMUV(uv.east, textureSize),
            zIndex: Math.round(relativeY * 10),
            brightness: 0.6,
            transform: generateFaceTransform("right", eastX, eastY, eastZ),
        });
    }

    // South face (back, usually not visible)
    const hasValidSouthUV = uv.south[2] > uv.south[0] || uv.south[3] > uv.south[1];
    if (hasValidSouthUV) {
        const southX = scaledX;
        const southY = -scaledY;
        const southZ = scaledZ + (depth / 2 / PIXELS_PER_UNIT) * scale;

        faces.push({
            type: "left",
            textureUrl,
            x: southX,
            y: southY,
            z: southZ,
            width: (width / PIXELS_PER_UNIT) * scale,
            height: (height / PIXELS_PER_UNIT) * scale,
            uv: normalizeJEMUV(uv.south, textureSize),
            zIndex: Math.round(relativeY * 10 + 50),
            brightness: 0.8,
            transform: generateFaceTransform("left", southX, southY, southZ),
        });
    }

    // Down face (bottom)
    const hasValidDownUV = uv.down[2] > uv.down[0] || uv.down[3] > uv.down[1];
    if (hasValidDownUV) {
        const downX = scaledX;
        const downY = -(scaledY - (height / 2 / PIXELS_PER_UNIT) * scale);
        const downZ = scaledZ;

        faces.push({
            type: "top",
            textureUrl,
            x: downX,
            y: downY,
            z: downZ,
            width: (width / PIXELS_PER_UNIT) * scale,
            height: (depth / PIXELS_PER_UNIT) * scale,
            uv: normalizeJEMUV(uv.down, textureSize),
            zIndex: Math.round((relativeY - height / 2 / PIXELS_PER_UNIT) * 10 - 100),
            brightness: 0.5,
            transform: generateFaceTransform("top", downX, downY, downZ),
        });
    }

    return faces;
}

/**
 * Convert a JEM part (with multiple boxes and potential children) to faces
 * 
 * @param part - Parsed JEM part
 * @param textureSize - Texture dimensions [width, height]
 * @param textureUrl - URL of the entity texture
 * @param scale - Scale factor for rendering
 * @returns Array of renderable faces from this part and its children
 */
export function convertJEMPartToFaces(
    part: ParsedPart,
    textureSize: [number, number],
    textureUrl: string,
    scale: number,
): RenderedFace[] {
    const faces: RenderedFace[] = [];

    // Process boxes in this part
    for (const box of part.boxes) {
        const boxFaces = convertJEMBoxToFaces(
            box,
            part.origin,
            textureSize,
            textureUrl,
            scale,
        );
        faces.push(...boxFaces);
    }

    // Recursively process child parts
    for (const child of part.children) {
        const childFaces = convertJEMPartToFaces(
            child,
            textureSize,
            textureUrl,
            scale,
        );
        faces.push(...childFaces);
    }

    return faces;
}

/**
 * Calculate bounding box for all parts in an entity model
 */
function calculateEntityBounds(model: ParsedEntityModel): {
    min: [number, number, number];
    max: [number, number, number];
    center: [number, number, number];
} {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    const processPart = (part: ParsedPart) => {
        for (const box of part.boxes) {
            minX = Math.min(minX, box.from[0], box.to[0]);
            minY = Math.min(minY, box.from[1], box.to[1]);
            minZ = Math.min(minZ, box.from[2], box.to[2]);
            maxX = Math.max(maxX, box.from[0], box.to[0]);
            maxY = Math.max(maxY, box.from[1], box.to[1]);
            maxZ = Math.max(maxZ, box.from[2], box.to[2]);
        }

        for (const child of part.children) {
            processPart(child);
        }
    };

    for (const part of model.parts) {
        processPart(part);
    }

    return {
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
        center: [
            (minX + maxX) / 2,
            (minY + maxY) / 2,
            (minZ + maxZ) / 2,
        ],
    };
}

/**
 * Convert a complete JEM entity model to RenderedElement array
 * 
 * This is the main entry point for entity rendering.
 * 
 * @param model - Parsed entity model
 * @param textureUrl - URL of the entity texture
 * @param scale - Scale factor for rendering (same as blocks)
 * @returns Array of RenderedElements ready for MinecraftCSSBlock
 */
export function convertJEMModelToFaces(
    model: ParsedEntityModel,
    textureUrl: string,
    scale: number,
): RenderedElement[] {
    // Calculate entity center for proper positioning
    // Entities use absolute pixel coordinates, not block-relative (0-16)
    // We need to center them like we do for blocks (around 8,8,8)
    const bounds = calculateEntityBounds(model);
    const entityCenter: [number, number, number] = [
        bounds.center[0] / PIXELS_PER_UNIT,
        bounds.center[1] / PIXELS_PER_UNIT,
        bounds.center[2] / PIXELS_PER_UNIT,
    ];

    console.log('[EntityGeometry] Entity bounds:', bounds);
    console.log('[EntityGeometry] Entity center (units):', entityCenter);

    // CRITICAL: Entities are in absolute pixel coordinates and can be much larger than 16x16x16
    // Blocks use a scale factor directly, but entities need additional adjustment
    // Apply an additional scale multiplier to match block sizes
    // Reduced from 16.0 to 12.0 based on user feedback ("slightly too large")
    const ENTITY_SCALE_MULTIPLIER = 12.0;
    const adjustedScale = scale * ENTITY_SCALE_MULTIPLIER;

    console.log('[EntityGeometry] Scale:', scale, '→ Adjusted:', adjustedScale);

    // Create a modified model with adjusted part origins
    // to center the entity at 0,0,0 like blocks
    const allFaces: RenderedFace[] = [];

    // Helper to adjust part origin for centering
    const processPartWithOffset = (part: ParsedPart): RenderedFace[] => {
        // Adjust the part origin to center the entity
        // We set the origin to the center of the bounding box
        // This effectively shifts the model so its center is at (0,0,0) relative to the origin
        // Note: We subtract the center to shift the model "back" to the origin
        // Y_OFFSET: Add a small offset to push the model down if it's too high (user feedback)
        const Y_OFFSET_ADJUSTMENT = 4; // 4 pixels = 0.25 units
        const adjustedOrigin: [number, number, number] = [
            part.origin[0] - bounds.center[0],
            part.origin[1] - bounds.center[1] + Y_OFFSET_ADJUSTMENT,
            part.origin[2] - bounds.center[2],
        ];

        const faces: RenderedFace[] = [];

        // Process boxes with adjusted origin
        for (const box of part.boxes) {
            const boxFaces = convertJEMBoxToFaces(
                box,
                adjustedOrigin,
                model.textureSize,
                textureUrl,
                adjustedScale, // Use adjusted scale for proper sizing
            );
            faces.push(...boxFaces);
        }

        // Recursively process children
        for (const child of part.children) {
            const childFaces = processPartWithOffset(child);
            faces.push(...childFaces);
        }

        return faces;
    };

    // Process each top-level part
    for (const part of model.parts) {
        const partFaces = processPartWithOffset(part);
        allFaces.push(...partFaces);
    }

    // Return as a single RenderedElement
    return [{ faces: allFaces }];
}
