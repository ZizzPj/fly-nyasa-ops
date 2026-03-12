"use client";

export function PrintPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
    >
      Export PDF
    </button>
  );
}