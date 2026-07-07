// src/types/index.ts
export interface Chapter {
  id: number;
  title: string;
  content: string;
  pageNumber: number;
  keyPoints?: string[];
}