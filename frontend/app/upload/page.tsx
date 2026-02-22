import UploadZone from "@/components/UploadZone";

export default function UploadPage() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-white">
          Upload specification sheet
        </h1>
        <p className="mt-1 text-slate-400">
          Drop an image, PDF, or Excel jewelry spec sheet. We&apos;ll extract weights, stone counts, and dimensions.
        </p>
      </header>
      <UploadZone />
    </div>
  );
}
