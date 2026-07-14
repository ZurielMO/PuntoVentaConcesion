import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/server/backend-client";
import { FORWARD_HEADERS } from "@/lib/server/proxy-headers";

async function handleProxy(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
) {
  const { path } = await params;
  const targetPath = path.join("/");
  const search = request.nextUrl.search;

  const headers: Record<string, string> = {};
  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");
    const body = isMultipart
      ? await request.arrayBuffer()
      : await request.text();
    const hasBody =
      typeof body === "string" ? body.length > 0 : body.byteLength > 0;
    if (hasBody) init.body = body;
  }

  const backendRes = await proxyToBackend(`${targetPath}${search}`, init);
  const status = backendRes.status;

  // NextResponse no admite cuerpo en 204/205/304 (Fetch API).
  if (status === 204 || status === 205 || status === 304) {
    return new NextResponse(null, { status });
  }

  const responseBody = await backendRes.text();
  const responseHeaders: Record<string, string> = {};
  const backendContentType = backendRes.headers.get("Content-Type");
  if (backendContentType) {
    responseHeaders["Content-Type"] = backendContentType;
  }
  const requestId = backendRes.headers.get("x-request-id");
  if (requestId) responseHeaders["x-request-id"] = requestId;

  return new NextResponse(responseBody, {
    status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context.params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context.params);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context.params);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context.params);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context.params);
}
