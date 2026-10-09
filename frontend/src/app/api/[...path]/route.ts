import { NextRequest, NextResponse } from "next/server";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const route = path.join("/");
  if (!/^(auth\/(login|logout|session)|health\/(live|ready)|accounts(?:\/[A-Za-z0-9_-]+(?:\/(evidence|recommendation))?)?|graph\/(answer|evidence)|data\/status|plans(?:\/[A-Za-z0-9_-]+)?|decisions|feedback(?:\/[A-Za-z0-9_-]+(?:\/replies)?)?|actions(?:\/[A-Za-z0-9_-]+(?:\/history)?)?)$/.test(route)) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!["GET", "POST", "PATCH"].includes(request.method)) return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
  const origin = request.headers.get("origin");
  if (request.method !== "GET" && origin !== (process.env.PUBLIC_ORIGIN ?? request.nextUrl.origin)) return NextResponse.json({ error: "ORIGIN_FORBIDDEN" }, { status: 403 });
  let body: Uint8Array | undefined;
  if (request.method !== "GET") {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    if (reader) for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16_384) { await reader.cancel(); return NextResponse.json({ error: "BODY_TOO_LARGE" }, { status: 413 }); }
      chunks.push(value);
    }
    body = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  }
  try {
    const base = process.env.BACKEND_URL ?? "http://127.0.0.1:8080";
    const response = await fetch(`${base}/api/${route}${request.nextUrl.search}`, {
      method: request.method, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(route === "graph/answer" ? 190_000 : 15_000),
      headers: { "content-type": "application/json", cookie: request.headers.get("cookie") ?? "", ...(origin ? { origin } : {}) },
      body: body ? new TextDecoder().decode(body) : undefined,
    });
    const result = new NextResponse(await response.text(), { status: response.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
    for (const name of ["set-cookie", "retry-after"]) { const value = response.headers.get(name); if (value) result.headers.set(name, value); }
    return result;
  } catch { return NextResponse.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 }); }
}
export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
