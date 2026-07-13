// In-memory handoff for images being staged for a new post.
// Avoids the dataURL <-> sessionStorage roundtrip which is slow and size-limited.
let staged: Blob[] = [];

export function setPendingImages(blobs: Blob[]) {
  staged = blobs;
}

export function takePendingImages(): Blob[] {
  const out = staged;
  staged = [];
  return out;
}

export function hasPendingImages(): boolean {
  return staged.length > 0;
}
