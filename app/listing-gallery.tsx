"use client";

import { useState } from "react";

export function ListingGallery({ title, photos }: { title: string; photos: { id: string }[] }) {
  const [position, setPosition] = useState(0);
  const photo = photos[position];
  if (!photo) return <div className="gallery gallery-empty">No photos available</div>;

  return (
    <div className="gallery" aria-label={`Photos of ${title}`}>
      {/* Photos are already served from a local route with a validated MIME type. */}
      <img src={`/photos/${photo.id}`} alt={`${title}, photo ${position + 1}`} loading="lazy" />
      {photos.length > 1 && (
        <div className="gallery-controls">
          <button type="button" aria-label="Previous photo" onClick={() => setPosition((position - 1 + photos.length) % photos.length)}>Previous</button>
          <span aria-live="polite">{position + 1} / {photos.length}</span>
          <button type="button" aria-label="Next photo" onClick={() => setPosition((position + 1) % photos.length)}>Next</button>
        </div>
      )}
    </div>
  );
}
