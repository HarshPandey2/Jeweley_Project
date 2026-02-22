import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    // Create new FormData with the file
    const backendForm = new FormData();
    backendForm.append("file", file, file.name || "image.jpg");

    console.log(`[PROXY] Forwarding to ${BACKEND}/api/jewelry/upload`);
    
    const res = await fetch(`${BACKEND}/api/jewelry/upload`, {
      method: "POST",
      body: backendForm,
    });

    const text = await res.text();
    console.log(`[PROXY] Backend status: ${res.status}, response length: ${text.length}`);
    
    if (!res.ok) {
      console.error(`[PROXY] Backend error: ${res.status} - ${text.substring(0, 200)}`);
    }
    
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.error("[PROXY] Parse error:", parseErr);
      return NextResponse.json(
        { detail: "Invalid response from backend" },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[PROXY] Exception:", err);
    return NextResponse.json(
      { detail: "Upload failed", error: String(err) },
      { status: 502 }
    );
  }
}
