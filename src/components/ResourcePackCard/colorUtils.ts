/**
 * Extract dominant accent color from image data
 */
export function extractAccentColor(data: Uint8ClampedArray): string | undefined {
    if (data.length === 0) return undefined;
    const samples: Array<{ hex: string; saturation: number; lightness: number }> = [];
    const totalPixels = data.length / 4;
    const step = Math.max(1, Math.floor(totalPixels / 200));

    for (let i = 0; i < totalPixels; i += step) {
        const idx = i * 4;
        const alpha = data[idx + 3];
        if (alpha < 200) continue;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const { s, l } = rgbToHsl(r, g, b);
        samples.push({ hex: rgbToHex(r, g, b), saturation: s, lightness: l });
    }

    if (!samples.length) return undefined;
    samples.sort((a, b) => b.saturation - a.saturation);

    const primary = samples[0];
    const lightnessDelta = primary.lightness > 0.5 ? -0.15 : 0.15;
    return shiftLightness(primary.hex, lightnessDelta);
}

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("")}`;
}

/**
 * Convert RGB to HSL color space
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rNorm:
                h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
                break;
            case gNorm:
                h = (bNorm - rNorm) / d + 2;
                break;
            default:
                h = (rNorm - gNorm) / d + 4;
                break;
        }
        h /= 6;
    }

    return { h, s, l };
}

/**
 * Convert HSL to hex color string
 */
export function hslToHex(h: number, s: number, l: number): string {
    const hue2rgb = (p: number, q: number, t: number) => {
        let tNorm = t;
        if (tNorm < 0) tNorm += 1;
        if (tNorm > 1) tNorm -= 1;
        if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
        if (tNorm < 1 / 2) return q;
        if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
        return p;
    };

    let r: number;
    let g: number;
    let b: number;

    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return rgbToHex(
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
    );
}

/**
 * Shift lightness of hex color
 */
export function shiftLightness(hex: string, delta: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const { h, s, l } = rgbToHsl(r, g, b);
    const nextLightness = Math.max(0, Math.min(1, l + delta));
    return hslToHex(h, s, nextLightness);
}
