import { expect, test } from "@playwright/test";

// The landing at / is public, so its icons must load for signed-out visitors (never the sign-in redirect).
const ASSETS: { path: string; type: RegExp }[] = [
  { path: "/favicon.svg", type: /image\/svg\+xml/ },
  { path: "/favicon.ico", type: /image\/(x-icon|vnd\.microsoft\.icon)/ },
  { path: "/apple-touch-icon-180.png", type: /image\/png/ },
];

test("the Stigi favicons load signed-out @brand", async ({ request, baseURL }) => {
  for (const asset of ASSETS) {
    const response = await request.get(`${baseURL}${asset.path}`, { maxRedirects: 0 });
    expect(response.status(), `GET ${asset.path} signed-out`).toBe(200);
    expect(response.headers()["content-type"] ?? "", `content-type of ${asset.path}`).toMatch(asset.type);
    expect((await response.body()).length, `body of ${asset.path}`).toBeGreaterThan(100);
  }
});
