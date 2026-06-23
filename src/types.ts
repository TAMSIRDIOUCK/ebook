// src/types.ts

export interface Chapter {
  id: number;
  title: string;
  content: string;       // texte principal (paragraphes séparés par \n\n)
  pageNumber: number;
  keyPoints?: string[];  // points clés affichés en encadré
}

export interface BookmarkItem {
  chapterId: number;
  title: string;
  pageNumber: number;
}

export interface AccessCode {
  code: string;
  is_active: boolean;
  user_name: string | null;
  whatsapp: string | null;
}