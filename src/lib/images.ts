import { supabase } from './supabase';

const BUCKET = 'post-images';

/** Public URL for a path in the post-images bucket, or null if there's no photo. */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
