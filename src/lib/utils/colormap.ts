/**
 * Shared Colormap Sampling Logic
 *
 * Used by both the main thread (sync fallback) and Web Worker.
 */

export interface ColormapColor {
    r: number;
    g: number;
    b: number;
}

export interface SampleRequest {
    x: number;
    y: number;
}

export interface SampleResult {
    grassColor: ColormapColor | null;
    foliageColor: ColormapColor | null;
}

/**
 * Cache for loaded colormap image data
 */
const colormapCache = new Map<string, ImageData>();

/**
 * Load a colormap image and extract its pixel data
 */
export async function loadColormapImageData(url: string): Promise<ImageData> {
    // Check cache first
    const cached = colormapCache.get(url);
    if (cached) {
        return cached;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Cache the result
                colormapCache.set(url, imageData);
                resolve(imageData);
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error(`Failed to load colormap: ${url}`));
        };

        img.src = url;
    });
}

/**
 * Sample a color from colormap image data at specific coordinates
 */
export function sampleColorFromImageData(
    imageData: ImageData,
    x: number,
    y: number,
): ColormapColor {
    // Clamp coordinates to image bounds
    const clampedX = Math.max(0, Math.min(imageData.width - 1, Math.floor(x)));
    const clampedY = Math.max(0, Math.min(imageData.height - 1, Math.floor(y)));

    const index = (clampedY * imageData.width + clampedX) * 4;

    return {
        r: imageData.data[index],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2],
    };
}

/**
 * Clear the colormap cache
 */
export function clearColormapCache(): void {
    colormapCache.clear();
}
