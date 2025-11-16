import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

const globalWithWindow = globalThis as typeof globalThis & {
  window?: Window & typeof globalThis & { __TAURI__?: unknown };
};

if (!globalWithWindow.window) {
  globalWithWindow.window = {} as Window & typeof globalThis;
}

globalWithWindow.window.__TAURI__ = {
  tauri: {
    invoke: vi.fn(),
  },
  core: {
    invoke: vi.fn(),
    convertFileSrc: vi.fn((path: string) => `asset://localhost/${path}`),
  },
};

afterEach(() => {
  vi.clearAllMocks();
});
