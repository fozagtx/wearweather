"use client";

import { useRef, useState } from "react";
import { GhostButton } from "@/components/ui";
import type { StudioPhoto } from "@/lib/types";

export const PHOTO_DRAG_TYPE = "application/x-ww-photo";

export function PhotoStudio({
  photos,
  selectedId,
  error,
  examplePhotoUrl,
  onAdd,
  onSelect,
  onRemove,
}: {
  photos: StudioPhoto[];
  selectedId?: string;
  error?: string;
  examplePhotoUrl?: string;
  onAdd: (files: FileList | null) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const takeFiles = (event: React.DragEvent) => {
    event.preventDefault();
    setOver(false);
    if (event.dataTransfer.files?.length) onAdd(event.dataTransfer.files);
  };

  return (
    <div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(event) => {
          onAdd(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      <div
        className={`rounded-xl border border-dashed p-2 ${over ? "border-foreground bg-muted/80" : "border-border bg-muted/40"}`}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={takeFiles}
      >
        {photos.length ? (
          <div className="grid grid-cols-1 gap-2">
            {photos.map((photo) => {
              const active = photo.id === selectedId;
              return (
                <figure key={photo.id} className="relative">
                  <button
                    type="button"
                    draggable
                    onPointerDown={(event) => event.stopPropagation()}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(PHOTO_DRAG_TYPE, photo.id);
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => onSelect(photo.id)}
                    className={`relative block w-full rounded-lg border ${active ? "border-brand ring-2 ring-brand/30" : "border-border"}`}
                    aria-pressed={active}
                    aria-label={active ? `${photo.label}, try-on source` : `Use ${photo.label}`}
                  >
                    <img src={photo.url} alt="" className="block h-auto w-full object-contain object-top" draggable={false} />
                    {active && (
                      <span className="absolute top-2 left-2 rounded-md bg-background/90 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em]">
                        IN USE
                      </span>
                    )}
                  </button>
                  <div className="mt-2 flex items-center gap-2">
                    <GhostButton className="h-9 min-h-9 px-3 py-0 text-xs" onClick={() => onSelect(photo.id)} disabled={active}>
                      {active ? "This photo is in use" : "Use this photo"}
                    </GhostButton>
                    <button
                      type="button"
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => onRemove(photo.id)}
                    >
                      Remove
                    </button>
                  </div>
                </figure>
              );
            })}
          </div>
        ) : (
          <div>
            {examplePhotoUrl && (
              <div className="relative">
                <img src={examplePhotoUrl} alt="Example try-on photo" className="block h-auto w-full rounded-lg object-contain object-top" />
                <span className="absolute top-2 left-2 rounded-md bg-background/90 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em]">
                  EXAMPLE IN USE
                </span>
              </div>
            )}
            <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">
              Example photo is in use. Drop your photos here to dress yourself, then click Use this photo.
            </p>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <GhostButton className="h-9 min-h-9 px-3 py-0 text-xs" onClick={() => inputRef.current?.click()}>
          Add photos
        </GhostButton>
        {photos.length > 0 && <p className="text-[11px] text-muted-foreground">Or drag a photo onto Try-on.</p>}
      </div>
      {error && (
        <p className="mt-2 text-xs text-[#c43b3e]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
