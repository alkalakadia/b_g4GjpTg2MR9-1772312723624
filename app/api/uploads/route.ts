import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export const maxDuration = 300 // allow up to 5 min for large file uploads

/**
 * POST /api/uploads?filename=my-file.pdf
 *
 * Receives the raw file body and streams it directly to Vercel Blob
 * server-side using put(). This avoids all CORS issues that arise with
 * the client-side upload approach.
 *
 * Client-side usage (upload-page.tsx):
 *   const res = await fetch(`/api/uploads?filename=${encodeURIComponent(file.name)}`, {
 *     method: "POST",
 *     body: file,
 *     headers: { "content-type": file.type },
 *   })
 *   const { url } = await res.json()  // public blob URL
 */
export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get("filename")

  if (!filename) {
    return NextResponse.json({ error: "filename query param is required" }, { status: 400 })
  }

  const contentType = request.headers.get("content-type") || "application/octet-stream"

  const allowed = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ]
  if (!allowed.includes(contentType)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${contentType}` },
      { status: 400 }
    )
  }

  try {
    const blob = await put(filename, request.body!, {
      access: "public",
      contentType,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    )
  }
}
