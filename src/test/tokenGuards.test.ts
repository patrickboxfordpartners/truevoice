import { describe, expect, it } from "vitest";
import { advanceTokenWindow } from "../../convex/lib/tokenWindow";
import { shouldRetryXaiStatus, xaiRetryDelayMs } from "../../convex/lib/xai";

describe("advanceTokenWindow", () => {
  it("starts a window when none exists", () => {
    expect(advanceTokenWindow(null, 1_000, 60_000, 2)).toEqual({
      allowed: true,
      windowStart: 1_000,
      count: 1,
    });
  });

  it("increments inside the window and then denies", () => {
    expect(advanceTokenWindow({ windowStart: 1_000, count: 1 }, 2_000, 60_000, 2)).toEqual({
      allowed: true,
      windowStart: 1_000,
      count: 2,
    });
    expect(advanceTokenWindow({ windowStart: 1_000, count: 2 }, 3_000, 60_000, 2)).toEqual({
      allowed: false,
      windowStart: 1_000,
      count: 2,
    });
  });

  it("opens a new window after the interval", () => {
    expect(advanceTokenWindow({ windowStart: 1_000, count: 2 }, 61_000, 60_000, 2)).toEqual({
      allowed: true,
      windowStart: 61_000,
      count: 1,
    });
  });
});

describe("xAI retry policy", () => {
  it("retries rate limits and server errors", () => {
    expect(shouldRetryXaiStatus(429)).toBe(true);
    expect(shouldRetryXaiStatus(500)).toBe(true);
    expect(shouldRetryXaiStatus(503)).toBe(true);
    expect(shouldRetryXaiStatus(400)).toBe(false);
    expect(shouldRetryXaiStatus(401)).toBe(false);
    expect(shouldRetryXaiStatus(200)).toBe(false);
  });

  it("backs off from 500ms", () => {
    expect(xaiRetryDelayMs(0)).toBe(500);
    expect(xaiRetryDelayMs(1)).toBe(1000);
    expect(xaiRetryDelayMs(2)).toBe(2000);
  });
});
