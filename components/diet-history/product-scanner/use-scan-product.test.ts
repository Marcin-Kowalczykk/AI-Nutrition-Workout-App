import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScanProduct } from "./use-scan-product";

vi.mock("@/lib/supabase/get-access-token", () => ({
  getAccessToken: vi.fn().mockResolvedValue("token"),
}));

const mockFetch = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

const makeFile = () => new File(["x"], "label.jpg", { type: "image/jpeg" });

describe("useScanProduct", () => {
  it("starts in idle state", () => {
    const { result } = renderHook(() => useScanProduct());
    expect(result.current.scanState).toBe("idle");
    expect(result.current.apiResult).toBeNull();
  });

  it("transitions to result state with per-100g only response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        kcal_per_100g: 415,
        protein_per_100g: 8.5,
        carbs_per_100g: 52,
        fat_per_100g: 18,
        whole_product: null,
      }),
    });
    const { result } = renderHook(() => useScanProduct());
    await act(async () => { await result.current.analyze(makeFile()); });
    expect(result.current.scanState).toBe("result");
    expect(result.current.apiResult?.whole_product).toBeNull();
  });

  it("transitions to result state with whole_product present", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        kcal_per_100g: 415,
        protein_per_100g: 8.5,
        carbs_per_100g: 52,
        fat_per_100g: 18,
        whole_product: { grams: 200, kcal: 830, protein: 17, carbs: 104, fat: 36 },
      }),
    });
    const { result } = renderHook(() => useScanProduct());
    await act(async () => { await result.current.analyze(makeFile()); });
    expect(result.current.scanState).toBe("result");
    expect(result.current.apiResult?.whole_product?.grams).toBe(200);
  });

  it("transitions to limit_reached on 429", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    const { result } = renderHook(() => useScanProduct());
    await act(async () => { await result.current.analyze(makeFile()); });
    expect(result.current.scanState).toBe("limit_reached");
  });

  it("transitions to error on 422", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 422 });
    const { result } = renderHook(() => useScanProduct());
    await act(async () => { await result.current.analyze(makeFile()); });
    expect(result.current.scanState).toBe("error");
  });

  it("reset returns to idle", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 422 });
    const { result } = renderHook(() => useScanProduct());
    await act(async () => { await result.current.analyze(makeFile()); });
    act(() => { result.current.reset(); });
    expect(result.current.scanState).toBe("idle");
    expect(result.current.apiResult).toBeNull();
  });
});
