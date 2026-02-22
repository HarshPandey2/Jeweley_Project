"use client";

import { useState, useCallback } from "react";
import { Upload, ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import type { JewelryRecord } from "@/lib/api";
import { uploadJewelry } from "@/lib/api";

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".xlsx", ".xls"];

function isSupportedFile(file: File): boolean {
  const name = (file.name || "").toLowerCase();
  const byExt = SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  return SUPPORTED_MIME_TYPES.has(file.type) || byExt;
}

export default function UploadZone() {
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<JewelryRecord | null | "error">(null);

  const doUpload = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);
    setResult(null);
    const record = await uploadJewelry(file, (p) => setProgress(p));
    setUploading(false);
    setProgress(100);
    if (record) {
      setResult(record);
    } else {
      setResult("error");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const file = e.dataTransfer.files?.[0];
      if (file && isSupportedFile(file)) {
        doUpload(file);
      } else {
        setResult("error");
      }
    },
    [doUpload]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
  }, []);

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isSupportedFile(file)) {
        doUpload(file);
      } else if (file) {
        setResult("error");
      }
      e.target.value = "";
    },
    [doUpload]
  );

  return (
    <div className="space-y-6">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative rounded-2xl border-2 border-dashed transition-all ${
          drag
            ? "border-luxury-gold bg-luxury-gold/10"
            : "border-slate-600 bg-slate-800/20 hover:border-slate-500"
        } ${uploading ? "pointer-events-none opacity-90" : ""}`}
      >
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls,image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={onFileInput}
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          disabled={uploading}
        />
        <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
          {uploading ? (
            <>
              <div className="mb-4 h-12 w-12 animate-pulse rounded-full border-2 border-luxury-gold border-t-transparent" />
              <p className="text-sm font-medium text-slate-300">
                Extracting data... (AI/OCR/Text Parser)
              </p>
              <div className="mt-4 w-full max-w-xs overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-2 rounded-full bg-luxury-gold transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{Math.round(progress)}%</p>
            </>
          ) : (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-700/50">
                <Upload className="h-8 w-8 text-luxury-gold" />
              </div>
              <p className="text-lg font-medium text-white">Drop your specification sheet here</p>
              <p className="mt-1 text-sm text-slate-400">
                or click to browse - JPEG, PNG, WebP, PDF, XLSX, or XLS
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <ImageIcon className="h-3.5 w-3.5" />
                AI extraction with OCR/Text fallback. Review Required shows when confidence is low.
              </p>
            </>
          )}
        </div>
      </div>

      {result && (
        <div
          className={`rounded-xl border p-4 ${
            result === "error"
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-emerald-500/30 bg-emerald-500/10"
          }`}
        >
          {result === "error" ? (
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <div>
                <p className="font-medium text-amber-200">Upload could not be completed</p>
                <p className="text-sm text-amber-200/80">
                  File was not supported or parsing failed. Check Products to review and edit.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-medium text-emerald-200">
                  {result.status === "Completed" ? "Extraction completed" : "Review required"}
                </p>
                <p className="text-sm text-emerald-200/80">
                  Confidence: {Math.round((result.confidence_score ?? 0) * 100)}% - Source: {result.source}
                </p>
                <a
                  href={`/products/${result.id}`}
                  className="mt-2 inline-block text-sm font-medium text-luxury-gold hover:underline"
                >
                  View product -&gt;
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
