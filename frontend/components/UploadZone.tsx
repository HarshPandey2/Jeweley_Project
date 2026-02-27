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

interface UploadResult {
  file: File;
  record?: JewelryRecord;
  error?: boolean;
  duplicate?: boolean;
}

export default function UploadZone() {
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);

  const doUpload = useCallback(async (files: File[]) => {
    setUploading(true);
    setProgress(0);

    const newResults: UploadResult[] = files.map(file => ({ file }));
    setResults([...newResults]);

    let completed = 0;
    const CONCURRENCY = 5;

    const processFile = async (file: File, index: number) => {
      try {
        const res = await uploadJewelry(file);
        if (res?.record) {
          newResults[index].record = res.record;
        } else if (res?.duplicate) {
          newResults[index].duplicate = true;
        } else {
          newResults[index].error = true;
        }
      } catch (err) {
        newResults[index].error = true;
      }

      completed++;
      setProgress((completed / files.length) * 100);
      setResults([...newResults]);
    };

    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const chunk = files.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map((file, j) => processFile(file, i + j)));
    }

    setUploading(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const files = Array.from(e.dataTransfer.files || []);
      const validFiles = files.filter(isSupportedFile);

      if (validFiles.length > 0) {
        doUpload(validFiles);
      } else if (files.length > 0) {
        setResults(files.map(f => ({ file: f, error: true })));
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
      const files = Array.from(e.target.files || []);
      const validFiles = files.filter(isSupportedFile);

      if (validFiles.length > 0) {
        doUpload(validFiles);
      } else if (files.length > 0) {
        setResults(files.map(f => ({ file: f, error: true })));
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
        className={`relative rounded-2xl border-2 border-dashed transition-all ${drag
          ? "border-luxury-gold bg-luxury-gold/10"
          : "border-slate-600 bg-slate-800/20 hover:border-slate-500"
          } ${uploading ? "pointer-events-none opacity-90" : ""}`}
      >
        <input
          type="file"
          multiple
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
                Processing files...
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
              <p className="text-lg font-medium text-white">Drop your specification sheets here</p>
              <p className="mt-1 text-sm text-slate-400">
                or click to browse multiple files - JPEG, PNG, WebP, PDF, XLSX, or XLS
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <ImageIcon className="h-3.5 w-3.5" />
                Select multiple images to extract data individually without repeating product IDs.
              </p>
            </>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((res, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 ${res.duplicate
                ? "border-amber-500/30 bg-amber-500/10"
                : res.error
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-emerald-500/30 bg-emerald-500/10"
                }`}
            >
              <div className="flex items-center gap-3">
                {res.duplicate ? (
                  <AlertCircle className="h-5 w-5 min-w-[20px] text-amber-500" />
                ) : res.error ? (
                  <AlertCircle className="h-5 w-5 min-w-[20px] text-amber-400" />
                ) : (
                  <CheckCircle className="h-5 w-5 min-w-[20px] text-emerald-400" />
                )}

                <div className="flex-1 overflow-hidden">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className={`font-medium truncate ${res.duplicate
                      ? "text-amber-300"
                      : res.error
                        ? "text-amber-200"
                        : "text-emerald-200"
                      }`}>
                      {res.file.name}
                    </p>
                    {res.record && (
                      <span className="text-xs text-emerald-200/60 whitespace-nowrap">
                        ID: {res.record.id}
                      </span>
                    )}
                  </div>

                  {res.duplicate ? (
                    <p className="mt-0.5 text-sm text-yellow-200/80">
                      Duplicate image detected! Data not uploaded.
                    </p>
                  ) : res.error ? (
                    <p className="mt-0.5 text-sm text-amber-200/80">
                      Upload failed or file type not supported.
                    </p>
                  ) : res.record ? (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p className="text-sm text-emerald-200/80">
                        {res.record.status === "Processing" ? "Uploaded, extracting data..." : res.record.status === "Completed" ? "Extraction completed" : "Review required"}
                      </p>
                      <p className="text-xs text-emerald-200/60">
                        Confidence: {Math.round((res.record.confidence_score ?? 0) * 100)}%
                        <span className="mx-2">•</span>
                        Source: {res.record.source}
                      </p>
                      <a
                        href={`/products/${res.record.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-luxury-gold hover:underline"
                      >
                        View product -&gt;
                      </a>
                    </div>
                  ) : (
                    <p className="mt-0.5 text-sm text-slate-400">
                      Pending upload...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

