"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, FileSearch, Download } from "lucide-react";
import * as XLSX from "xlsx";
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

  const handleDownloadExcel = () => {
    // 1. Core Fields
    const coreData = FIELDS.map((f) => ({
      Field: f.label,
      Value: toInputValue((form as Record<string, unknown>)[f.key])
    }));
    const wb = XLSX.utils.book_new();
    const wsCore = XLSX.utils.json_to_sheet(coreData);
    XLSX.utils.book_append_sheet(wb, wsCore, "Extracted Details");

    // 2. Metal Weights
    if (form.metal_weights && form.metal_weights.length > 0) {
      const wsMetals = XLSX.utils.json_to_sheet(form.metal_weights);
      XLSX.utils.book_append_sheet(wb, wsMetals, "Metal Weights");
    }

    // 3. Gem Details
    if (form.gem_details && form.gem_details.length > 0) {
      const wsGems = XLSX.utils.json_to_sheet(form.gem_details);
      XLSX.utils.book_append_sheet(wb, wsGems, "Gem Details");
    }

    XLSX.writeFile(wb, `Jewelry_Spec_${id.slice(-6)}.xlsx`);
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
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide ${record.status === "Completed"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
              }`}
          >
            {record.source === "AI" ? <Sparkles className="h-4 w-4" /> : <FileSearch className="h-4 w-4" />}
            {record.status} • {record.source}
          </span>
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 hover:shadow-lg hover:-translate-y-0.5"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-luxury-gold to-luxury-gold-dark px-5 py-2.5 text-sm font-bold text-luxury-dark shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(212,175,55,0.4)] hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-3xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="border-b border-white/5 px-6 py-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
            <span className="text-sm font-semibold tracking-wide text-slate-300">Original File Preview</span>
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

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-3xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="border-b border-white/5 px-6 py-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.6)]" />
            <span className="text-sm font-semibold tracking-wide text-slate-300">Extracted Form Data</span>
          </div>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto style-scrollbar">
            {FIELDS.map(({ key, label, type }) => (
              <div key={key} className="group/input">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 transition-colors group-hover/input:text-luxury-gold">{label}</label>
                <input
                  type={type || "text"}
                  value={toInputValue((form as Record<string, unknown>)[key])}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-luxury-gold/60 focus:bg-black/40 focus:ring-2 focus:ring-luxury-gold/20"
                  placeholder="—"
                />
              </div>
            ))}

            {/* Dynamic Tables */}
            {form.metal_weights && form.metal_weights.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-sm font-bold tracking-wider text-white mb-4">Metal Weights (Extracted)</h3>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase tracking-widest bg-black/30 border-b border-white/10">
                      <tr>
                        {Object.keys(form.metal_weights[0]).map((key) => (
                          <th key={key} className="px-4 py-2">{key.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {form.metal_weights.map((row, idx) => (
                        <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          {Object.values(row).map((val, vIdx) => (
                            <td key={vIdx} className="px-4 py-2">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {form.gem_details && form.gem_details.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-sm font-bold tracking-wider text-white mb-4">Gem Details (Extracted)</h3>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase tracking-widest bg-black/30 border-b border-white/10">
                      <tr>
                        {Object.keys(form.gem_details[0]).map((key) => (
                          <th key={key} className="px-4 py-2">{key.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {form.gem_details.map((row, idx) => (
                        <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          {Object.values(row).map((val, vIdx) => (
                            <td key={vIdx} className="px-4 py-2">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
