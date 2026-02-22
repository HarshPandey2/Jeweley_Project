"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, FileSearch } from "lucide-react";
import { fetchJewelry, updateJewelry, type JewelryRecord, type JewelryData } from "@/lib/api";

const FIELDS: { key: keyof JewelryData; label: string; type?: string }[] = [
  { key: "ring_size", label: "Ring size" },
  { key: "gold_weight_14kt_gm", label: "Gold 14K (gm)", type: "number" },
  { key: "gold_weight_18kt_gm", label: "Gold 18K (gm)", type: "number" },
  { key: "gold_weight_22kt_gm", label: "Gold 22K (gm)", type: "number" },
  { key: "silver_weight_gm", label: "Silver (gm)", type: "number" },
  { key: "platinum_weight_gm", label: "Platinum (gm)", type: "number" },
  { key: "diamond_weight_ct", label: "Diamond (ct)", type: "number" },
  { key: "diamond_count", label: "Diamond count", type: "number" },
  { key: "diamond_shape", label: "Diamond shape" },
  { key: "stone_weight_ct", label: "Stone (ct)", type: "number" },
  { key: "stone_count", label: "Stone count", type: "number" },
  { key: "stone_type", label: "Stone type" },
  { key: "dimensions_mm", label: "Dimensions (mm)" },
  { key: "length_mm", label: "Length (mm)", type: "number" },
  { key: "width_mm", label: "Width (mm)", type: "number" },
  { key: "height_mm", label: "Height (mm)", type: "number" },
];

type FileKind = "image" | "pdf" | "excel" | "unknown";

function toInputValue(v: string | number | null | undefined | unknown): string {
  if (v == null) return "";
  return String(v);
}

function inferFileKind(record: JewelryRecord | null): FileKind {
  const raw = record?.image_filename || record?.image_url || "";
  const normalized = raw.split("?")[0].toLowerCase();
  if (normalized.endsWith(".pdf")) return "pdf";
  if (normalized.endsWith(".xlsx") || normalized.endsWith(".xls")) return "excel";
  if (
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".jpeg") ||
    normalized.endsWith(".png") ||
    normalized.endsWith(".webp")
  ) {
    return "image";
  }
  return "unknown";
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<JewelryRecord | null>(null);
  const [form, setForm] = useState<JewelryData>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchJewelry(id).then((r) => {
      setRecord(r || null);
      if (r?.extracted_data) setForm(r.extracted_data);
      setLoading(false);
    });
  }, [id]);

  const fileKind = useMemo(() => inferFileKind(record), [record]);

  const handleChange = (key: keyof JewelryData, value: string) => {
    setForm((prev) => {
      const next = { ...prev };
      const field = FIELDS.find((f) => f.key === key);
      if (field?.type === "number") {
        const n = value === "" ? undefined : parseFloat(value);
        (next as Record<string, unknown>)[key] = n;
      } else {
        (next as Record<string, unknown>)[key] = value === "" ? undefined : value;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const updated = await updateJewelry(id, form);
    setSaving(false);
    if (updated) {
      setRecord(updated);
      setForm(updated.extracted_data || {});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-luxury-gold border-t-transparent" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-8">
        <p className="text-slate-400">Product not found.</p>
        <Link href="/products" className="mt-4 inline-block text-luxury-gold hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
              record.status === "Completed"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {record.source === "AI" ? <Sparkles className="h-3.5 w-3.5" /> : <FileSearch className="h-3.5 w-3.5" />}
            {record.status} - {record.source}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-luxury-gold px-4 py-2 text-sm font-medium text-luxury-dark hover:bg-luxury-gold-light disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 overflow-hidden">
          <div className="border-b border-slate-700/50 px-4 py-3 text-sm font-medium text-slate-400">
            Original file
          </div>
          <div className="relative aspect-square bg-slate-800">
            {!record.image_url ? (
              <div className="flex h-full items-center justify-center text-slate-500">No file</div>
            ) : fileKind === "image" ? (
              <Image
                src={record.image_url}
                alt="Specification sheet"
                fill
                className="object-contain p-4"
                unoptimized
              />
            ) : fileKind === "pdf" ? (
              <iframe
                src={record.image_url}
                className="h-full w-full"
                title="Specification PDF"
              />
            ) : fileKind === "excel" ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-slate-300">Excel preview is not supported in browser.</p>
                <a
                  href={record.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-luxury-gold hover:underline"
                >
                  Open file
                </a>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-slate-300">Preview not available for this file type.</p>
                <a
                  href={record.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-luxury-gold hover:underline"
                >
                  Open file
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 overflow-hidden">
          <div className="border-b border-slate-700/50 px-4 py-3 text-sm font-medium text-slate-400">
            Extracted form (editable)
          </div>
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {FIELDS.map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                <input
                  type={type || "text"}
                  value={toInputValue((form as Record<string, unknown>)[key])}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-luxury-gold/50"
                  placeholder="-"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {record.review_required && (
        <p className="mt-4 text-sm text-amber-400/90">
          This record may need manual review. Edit the form and save.
        </p>
      )}
    </div>
  );
}
