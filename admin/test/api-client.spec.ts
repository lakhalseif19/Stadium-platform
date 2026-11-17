import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../src/api/client";

describe("admin API client", () => {
  beforeEach(() => {
    localStorage.clear();
    api.setToken(null);
    vi.restoreAllMocks();
  });

  it("persists the access token and sends it as a bearer token", async () => {
    api.setToken("access-token");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    await expect(api.get("/health")).resolves.toEqual({ ok: true });
    expect(localStorage.getItem("stadium_token")).toBe("access-token");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/v1/health");
    expect(new Headers(options?.headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
  });

  it("surfaces the server error message instead of treating failed HTTP as success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Unavailable" }), { status: 503 }),
    );

    await expect(api.get("/payments")).rejects.toThrow("Unavailable");
  });
});
