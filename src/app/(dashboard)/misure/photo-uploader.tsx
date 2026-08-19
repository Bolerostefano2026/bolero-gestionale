"use client";

import { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";

export type Photo = { url: string; caption?: string };

export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const uploaded: Photo[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.set("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Errore di caricamento");
        uploaded.push({ url: json.url });
      }
      onChange([...photos, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore imprevisto");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {photos.map((photo, i) => (
          <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-md border border-fog">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-fog text-ink3 hover:border-copper hover:text-copper">
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          <span className="text-[10px] font-medium">Foto</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
