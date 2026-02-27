const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface JewelryData {
  ring_size?: string | null;
  gold_weight_14kt_gm?: number | null;
  gold_weight_18kt_gm?: number | null;
  gold_weight_22kt_gm?: number | null;
  silver_weight_gm?: number | null;
  platinum_weight_gm?: number | null;
  diamond_weight_ct?: number | null;
  diamond_count?: number | null;
  diamond_shape?: string | null;
  stone_weight_ct?: number | null;
  stone_count?: number | null;
  stone_type?: string | null;
  dimensions_mm?: string | null;
  length_mm?: number | null;
  width_mm?: number | null;
  height_mm?: number | null;
  metal_weights?: Record<string, any>[] | null;
  gem_details?: Record<string, any>[] | null;
}

export interface JewelryRecord {
  id: string;
  image_url: string;
  image_filename?: string | null;
  extracted_data: JewelryData;
  status: string;
  source: string;
  confidence_score: number;
  review_required: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  raw_text?: string | null;
}

export interface Stats {
  total: number;
  pending: number;
  completed: number;
  review_required: number;
  processing: number;
}

export interface ConfidencePoint {
  id: string;
  date: string | null;
  confidence: number;
  source: string;
}

export async function fetchStats(): Promise<Stats> {
  try {
    const res = await fetch(`${API_BASE}/api/jewelry/stats`, { cache: "no-store" });
    if (!res.ok) return { total: 0, pending: 0, completed: 0, review_required: 0, processing: 0 };
    return res.json();
  } catch {
    return { total: 0, pending: 0, completed: 0, review_required: 0, processing: 0 };
  }
}

export async function fetchConfidenceTrend(limit = 10): Promise<{ points: ConfidencePoint[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/jewelry/confidence-trend?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) return { points: [] };
    return res.json();
  } catch {
    return { points: [] };
  }
}

export async function fetchJewelryList(params?: { search?: string; status?: string }): Promise<{ items: JewelryRecord[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.status) sp.set("status", params.status);
  const q = sp.toString();
  const url = `${API_BASE}/api/jewelry${q ? `?${q}` : ""}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { items: [], total: 0 };
    return res.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export async function fetchJewelry(id: string): Promise<JewelryRecord | null> {
  try {
    const res = await fetch(`${API_BASE}/api/jewelry/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function uploadJewelry(file: File, onProgress?: (p: number) => void): Promise<{ record?: JewelryRecord; duplicate?: boolean; error?: boolean }> {
  const form = new FormData();
  form.append("file", file, file.name || "image.jpg");

  // Use same-origin proxy to avoid CORS and wrong API URL
  const uploadUrl = typeof window !== "undefined" ? "/api/upload" : `${API_BASE}/api/jewelry/upload`;

  if (typeof window !== "undefined" && onProgress) onProgress(10);

  try {
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: form,
    });
    if (onProgress) onProgress(90);

    if (res.status === 409) {
      if (onProgress) onProgress(100);
      return { duplicate: true };
    }

    const text = await res.text();
    let data: JewelryRecord | null = null;

    try {
      data = text ? (JSON.parse(text) as JewelryRecord) : null;
    } catch (parseErr) {
      console.error("Failed to parse upload response:", parseErr, "Response:", text.substring(0, 200));
      return { error: true };
    }

    if (!res.ok || !data) {
      console.warn("Upload failed:", res.status, data || text.substring(0, 200));
      return { error: true };
    }

    if (onProgress) onProgress(100);
    return { record: data };
  } catch (err) {
    console.error("Upload error:", err);
    return { error: true };
  }
}

export async function updateJewelry(id: string, data: JewelryData): Promise<JewelryRecord | null> {
  const res = await fetch(`${API_BASE}/api/jewelry/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}
