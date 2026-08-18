"use client";

import { useRef, useState } from "react";
import { SystemMessage } from "@/components/prompt-kit/system-message";
import { GhostButton } from "@/components/ui";
import type { ExamplePhoto } from "@/lib/example-brief";
import type { StudioPhoto } from "@/lib/types";

export const PHOTO_DRAG_TYPE = "application/x-ww-photo";

export function PhotoStudio({
  photos,
  selectedId,
  error,
  examplePhotos,
  selectedExampleId,
  onSelectExample,
  onAdd,
  onSelect,
  onRemove,
}: {
  photos: StudioPhoto[];
  selectedId?: string;
  error?: string;
  examplePhotos?: ExamplePhoto[];
  selectedExampleId?: string;
  onSelectExample?: (id: string) => void;
  onAdd: (files: FileList | null) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const imageClass = "block h-auto max-h-none w-full object-contain object-top";

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
                    <img src={photo.url} alt="" className={imageClass} draggable={false} />
                    {active && (
                      <span className="absolute top-2 left-2 rounded-md bg-background/90 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em]">
                        IN USE
                      </span>
                    )}
                  </button>
                  <div className="mt-2">
                    {!active && (
                      <GhostButton className="h-10 min-h-10 px-3 py-0 text-xs" onClick={() => onSelect(photo.id)}>
                        Use this photo
                      </GhostButton>
                    )}
                    <button
                      type="button"
                      className="ml-2 text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => onRemove(photo.id)}
                    >
                      Remove
                    </button>
                  </div>
                </figure>
              );
            })}
          </div>
        ) : examplePhotos?.length ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {examplePhotos.map((photo) => {
                const active = photo.id === selectedExampleId;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => onSelectExample?.(photo.id)}
                    className={`relative overflow-hidden rounded-lg border ${active ? "border-brand ring-2 ring-brand/30" : "border-border"}`}
                    aria-pressed={active}
                    aria-label={active ? `${photo.label}, try-on source` : `Use ${photo.label}`}
                  >
                    <img src={photo.url} alt={photo.alt} className="block aspect-[3/4] w-full object-contain object-top" />
                    {active && (
                      <span className="absolute top-1 left-1 rounded-md bg-background/90 px-1 py-0.5 font-mono text-[8px] tracking-[0.12em]">
                        IN USE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="px-0.5 text-xs leading-relaxed text-muted-foreground">Same try-on for every body.</p>
          </div>
        ) : (
          <div className="grid place-items-center px-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">Add a photo</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <GhostButton className="h-10 min-h-10 px-3 py-0 text-xs" onClick={() => inputRef.current?.click()}>
          {photos.length ? "Add another photo" : "Choose a photo"}
        </GhostButton>
      </div>
      {error && (
        <SystemMessage className="mt-2" variant="error" fill>
          {error}
        </SystemMessage>
      )}
    </div>
  );
}
