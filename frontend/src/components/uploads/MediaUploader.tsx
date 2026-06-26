"use client";

import { ChangeEvent, useState } from "react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface Props {
  label: string;
  accept?: string;
  onUploaded?: (url: string, key: string) => void;
}

export default function MediaUploader({ label, accept = "image/*", onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(data.url);
      onUploaded?.(data.url, data.key);
      toast.success(`${label} uploaded`);
    } catch {
      toast.error(`Unable to upload ${label.toLowerCase()}`);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#03091A] p-3">
      <label className="mb-2 block text-sm font-medium text-white/80">{label}</label>
      <input type="file" accept={accept} onChange={handleChange} className="block w-full text-sm text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
      {uploading && <p className="mt-2 text-xs text-white/40">Uploading...</p>}
      {preview && <img src={preview} alt="Preview" className="mt-3 h-24 w-full rounded-xl object-cover" />}
    </div>
  );
}
