import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params, "GET");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await params, "POST");
}

async function proxyRequest(
  req: NextRequest,
  params: { path: string[] },
  method: string
): Promise<NextResponse> {
  const { getToken } = await auth();
  const token = await getToken();

  const pathname = params.path.join("/");
  const search = req.nextUrl.search;
  const backendUrl = `${API_URL}/${pathname}${search}`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const body = method === "POST" ? await req.text() : undefined;

  const upstream = await fetch(backendUrl, { method, headers, body });

  const upstreamContentType = upstream.headers.get("content-type") ?? "application/octet-stream";

  // Stream file downloads directly
  if (upstreamContentType.includes("application/pdf")) {
    const blob = await upstream.arrayBuffer();
    const disposition = upstream.headers.get("content-disposition") ?? "attachment";
    return new NextResponse(blob, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
      },
    });
  }

  const data = await upstream.text();
  return new NextResponse(data, {
    status: upstream.status,
    headers: { "Content-Type": upstreamContentType },
  });
}
