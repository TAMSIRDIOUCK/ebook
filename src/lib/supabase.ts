// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('❌ Variables Supabase manquantes dans .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── CODE ADMIN ──────────────────────────────────────────────────────────
const ADMIN_CODE = 'ADMIN2026';

// ── Vérification du code d'accès ──────────────────────────────────────────
export async function verifyAccessCode(code: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  const normalized = code.trim().toUpperCase();

  if (normalized === ADMIN_CODE) {
    console.log('🔑 Accès admin accordé');
    return { valid: true };
  }

  try {
    const { data, error } = await supabase
      .from('access_codes')
      .select('code, is_active')
      .eq('code', normalized)
      .maybeSingle();

    if (error || !data) {
      return { valid: false, reason: 'Code introuvable.' };
    }
    
    if (!data.is_active) {
      return { valid: false, reason: 'Ce code a été désactivé.' };
    }

    await supabase
      .from('access_codes')
      .update({ 
        last_used_at: new Date().toISOString(),
      })
      .eq('code', normalized);

    return { valid: true };
  } catch (error) {
    console.error('Erreur de vérification Supabase:', error);
    return { valid: false, reason: 'Erreur de connexion à la base de données.' };
  }
}

// ── Marque-pages ──────────────────────────────────────────────────────────
export async function fetchBookmarks(accessCode: string) {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('chapter_id, chapter_title, page_number')
      .eq('access_code', accessCode.toUpperCase())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }

    return (data ?? []).map((b) => ({
      chapterId: b.chapter_id,
      title: b.chapter_title,
      pageNumber: b.page_number,
    }));
  } catch (error) {
    console.error('Unexpected error:', error);
    return [];
  }
}

export async function addBookmark(
  accessCode: string,
  chapterId: number,
  chapterTitle: string,
  pageNumber: number
) {
  try {
    // Vérifier si le bookmark existe déjà
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('access_code', accessCode.toUpperCase())
      .eq('chapter_id', chapterId)
      .maybeSingle();

    if (existing) {
      // Si existe déjà, on ne fait rien ou on met à jour
      console.log('Bookmark already exists, skipping...');
      return;
    }

    // Sinon, on insère
    const { error } = await supabase
      .from('bookmarks')
      .insert({
        access_code: accessCode.toUpperCase(),
        chapter_id: chapterId,
        chapter_title: chapterTitle,
        page_number: pageNumber,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error adding bookmark:', error);
      // Si erreur 409, c'est que le bookmark existe déjà (conflit)
      if (error.code === '23505') {
        console.log('Bookmark already exists (duplicate key)');
        return;
      }
      throw error;
    }
  } catch (error: any) {
    if (error.code === '23505') {
      // Duplicate key - ignore
      console.log('Bookmark already exists');
      return;
    }
    console.error('Unexpected error adding bookmark:', error);
  }
}

export async function removeBookmark(accessCode: string, chapterId: number) {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('access_code', accessCode.toUpperCase())
      .eq('chapter_id', chapterId);

    if (error) {
      console.error('Error removing bookmark:', error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

export function isAdminCode(code: string): boolean {
  return code.trim().toUpperCase() === ADMIN_CODE;
}