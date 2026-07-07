// src/components/EbookReader.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Menu, X, BookOpen, Moon, Sun,
  Minus, Plus, Bookmark, Share2, Search, Settings,
  Maximize, Minimize, List, ArrowUp, LogOut, CheckCircle, Shield,
} from 'lucide-react';
import { chapter1 } from '../data/chapter1';
import { chapter2 } from '../data/chapter2';
import { chapter3 } from '../data/chapter3';
import { chapter4 } from '../data/chapter4';
import { chapter5 } from '../data/chapter5';
import { chapter6 } from '../data/chapter6';
import { chapter7 } from '../data/chapter7';
import { chapter8 } from '../data/chapter8';
import { chapter9 } from '../data/chapter9';
import { BookmarkItem } from '../types';
import { fetchBookmarks, addBookmark, removeBookmark, isAdminCode } from '../lib/supabase';
import AdminPanel from './AdminPanel';

interface Props {
  accessCode: string;
  onLogout: () => void;
}

// Regrouper tous les chapitres dans un tableau
const chapters = [
  chapter1,
  chapter2,
  chapter3,
  chapter4,
  chapter5,
  chapter6,
  chapter7,
  chapter8,
  chapter9
];

export default function EbookReader({ accessCode, onLogout }: Props) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ebook-dark') === 'true');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('ebook-fs') ?? 18));
  const [lineHeight, setLineHeight] = useState(1.8);
  const [fontFamily, setFontFamily] = useState('font-serif');
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [contentWidth, setContentWidth] = useState('max-w-3xl');
  const [bmLoading, setBmLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  const totalChapters = chapters.length;
  const progress = ((currentChapter + 1) / totalChapters) * 100;

  // Vérifier si l'utilisateur est admin
  const isAdmin = isAdminCode(accessCode);

  // ── Load bookmarks from Supabase ────────────────────────────────────────
  const loadBookmarks = useCallback(async () => {
    setBmLoading(true);
    try {
      const bms = await fetchBookmarks(accessCode);
      setBookmarks(bms);
    } catch (error) {
      console.error('Erreur de chargement des marque-pages:', error);
    } finally {
      setBmLoading(false);
    }
  }, [accessCode]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // ── Persist dark / font settings locally ────────────────────────────────
  useEffect(() => { localStorage.setItem('ebook-dark', String(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('ebook-fs', String(fontSize)); }, [fontSize]);

  // ── Keyboard nav ────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') {
        setSidebarOpen(false); setShowSettings(false);
        setShowSearch(false); setShowBookmarks(false);
        setShowAdmin(false);
      }
      // Bloquer l'impression avec Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        alert('📚 L\'impression de ce guide est désactivée pour protéger le contenu.');
        return false;
      }
      // Bloquer la capture d'écran (touche Print Screen)
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        alert('📸 La capture d\'écran est désactivée pour protéger le contenu.');
        return false;
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [currentChapter]);

  // ── Bloquer le clic droit ───────────────────────────────────────────────
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert('📚 Le contenu de ce guide est protégé.');
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      alert('📚 La copie du contenu est désactivée.');
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquer Ctrl+C, Ctrl+U, Ctrl+S
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === 'c' || e.key === 'u' || e.key === 's' || e.key === 'a')) {
        e.preventDefault();
        if (e.key === 'c') alert('📚 La copie du contenu est désactivée.');
        else if (e.key === 'u') alert('📚 L\'affichage du code source est désactivé.');
        else if (e.key === 's') alert('📚 La sauvegarde du contenu est désactivée.');
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const h = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const goNext = useCallback(() => {
    if (currentChapter < totalChapters - 1) {
      setCurrentChapter((c) => c + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentChapter, totalChapters]);

  const goPrev = useCallback(() => {
    if (currentChapter > 0) {
      setCurrentChapter((c) => c - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentChapter]);

  const goTo = (idx: number) => {
    setCurrentChapter(idx);
    setSidebarOpen(false);
    setShowSearch(false);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Bookmarks (Supabase) ─────────────────────────────────────────────────
  const toggleBookmark = async () => {
    const ch = chapters[currentChapter];
    const exists = bookmarks.some((b) => b.chapterId === ch.id);
    
    try {
      if (exists) {
        await removeBookmark(accessCode, ch.id);
        setBookmarks(bookmarks.filter((b) => b.chapterId !== ch.id));
      } else {
        await addBookmark(accessCode, ch.id, ch.title, ch.pageNumber);
        await loadBookmarks();
      }
      await loadBookmarks();
    } catch (error) {
      console.error('Erreur de gestion du marque-page:', error);
      await loadBookmarks();
    }
  };

  const deleteBookmark = async (chapterId: number) => {
    try {
      await removeBookmark(accessCode, chapterId);
      setBookmarks(bookmarks.filter((b) => b.chapterId !== chapterId));
      await loadBookmarks();
    } catch (error) {
      console.error('Erreur de suppression du marque-page:', error);
      await loadBookmarks();
    }
  };

  const isBookmarked = bookmarks.some((b) => b.chapterId === chapters[currentChapter].id);

  // ── Misc ─────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const ch = chapters[currentChapter];
    if (navigator.share) {
      try { await navigator.share({ title: ch.title, url: window.location.href }); } catch { /* ok */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const filteredChapters = chapters.filter(
    (ch) =>
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const bg       = darkMode ? 'bg-slate-900'   : 'bg-stone-50';
  const txt      = darkMode ? 'text-slate-100'  : 'text-slate-800';
  const bar      = darkMode ? 'bg-slate-800'    : 'bg-white';
  const border   = darkMode ? 'border-slate-700': 'border-stone-200';
  const card     = darkMode ? 'bg-slate-800'    : 'bg-white';
  const muted    = darkMode ? 'text-slate-400'  : 'text-slate-500';
  const hover    = darkMode ? 'hover:bg-slate-700' : 'hover:bg-stone-100';
  const active   = darkMode ? 'bg-slate-700'    : 'bg-stone-100';

  // Formater le contenu avec les styles appropriés
  const formatContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => {
      // Détecter les titres avec ▌ ou ⬇
      if (paragraph.trim().startsWith('▌') || paragraph.trim().startsWith('⬇')) {
        return (
          <div key={index} className="text-amber-400 font-bold text-lg mt-8 mb-4">
            {paragraph.trim()}
          </div>
        );
      }
      // Détecter les séparateurs
      if (paragraph.trim().startsWith('━━')) {
        return (
          <hr key={index} className="border-amber-500/30 my-6" />
        );
      }
      // Paragraphe normal
      return (
        <p key={index} className="mb-4 text-justify">
          {paragraph.trim()}
        </p>
      );
    });
  };

  return (
    <div className={`min-h-screen ${bg} ${txt} transition-colors duration-300 select-none`}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 ${bar} ${border} border-b backdrop-blur-md bg-opacity-95`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-lg ${hover}`} title="Sommaire">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <BookOpen size={22} className="text-amber-600" />
              <span className="font-semibold text-base hidden sm:block leading-tight">Guide Négociation<br className="hidden sm:block" /><span className="text-amber-500">Master</span></span>
            </div>
            {isAdmin && (
              <span className="ml-2 px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                ADMIN
              </span>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            <span className={`text-xs ${muted} hidden md:block mr-1`}>{currentChapter + 1}/{totalChapters}</span>
            <button onClick={() => setShowSearch(true)} className={`p-2 rounded-lg ${hover}`} title="Rechercher"><Search size={18} /></button>
            <button onClick={toggleBookmark} className={`p-2 rounded-lg ${hover} ${isBookmarked ? 'text-amber-500' : ''}`} title="Marque-page">
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => setShowBookmarks(true)} className={`p-2 rounded-lg ${hover} relative`} title="Mes marque-pages">
              <List size={18} />
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">{bookmarks.length}</span>
              )}
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg ${hover} ${showSettings ? 'bg-amber-100 text-amber-700' : ''}`} title="Paramètres"><Settings size={18} /></button>
            <button onClick={handleShare}      className={`p-2 rounded-lg ${hover} hidden sm:block`} title="Partager"><Share2 size={18} /></button>
            <button onClick={toggleFullscreen} className={`p-2 rounded-lg ${hover} hidden sm:block`} title="Plein écran">{isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${hover}`} title="Thème">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            
            {/* Bouton Admin - visible uniquement pour les admins */}
            {isAdmin && (
              <button 
                onClick={() => setShowAdmin(true)} 
                className={`p-2 rounded-lg ${hover} text-emerald-400 hover:text-emerald-300 relative`}
                title="Panneau d'administration"
              >
                <Shield size={18} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              </button>
            )}
            
            <button onClick={onLogout} className={`p-2 rounded-lg ${hover} text-red-400`} title="Se déconnecter"><LogOut size={18} /></button>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`h-1 ${darkMode ? 'bg-slate-700' : 'bg-stone-200'}`}>
          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* ── Settings panel ───────────────────────────────────────────────── */}
      {showSettings && (
        <div className={`fixed top-[65px] right-4 z-40 ${card} rounded-xl shadow-2xl border ${border} p-5 w-72`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Paramètres de lecture</h3>
            <button onClick={() => setShowSettings(false)} className={`${hover} p-1 rounded`}><X size={16} /></button>
          </div>
          <div className="space-y-4">
            {/* Font size */}
            <div>
              <label className={`text-xs ${muted} mb-2 block`}>Taille de police</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className={`p-2 rounded-lg ${hover} border ${border}`}><Minus size={13} /></button>
                <span className="w-8 text-center font-mono text-sm">{fontSize}</span>
                <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className={`p-2 rounded-lg ${hover} border ${border}`}><Plus size={13} /></button>
              </div>
            </div>
            {/* Line height */}
            <div>
              <label className={`text-xs ${muted} mb-2 block`}>Interligne</label>
              <div className="flex gap-2 flex-wrap">
                {[1.5, 1.8, 2.0, 2.3].map((lh) => (
                  <button key={lh} onClick={() => setLineHeight(lh)}
                    className={`px-3 py-1 rounded-lg text-xs border ${border} ${lineHeight === lh ? 'bg-amber-500 text-white border-amber-500' : hover}`}>{lh}</button>
                ))}
              </div>
            </div>
            {/* Font family */}
            <div>
              <label className={`text-xs ${muted} mb-2 block`}>Police</label>
              <div className="flex gap-2">
                {[{ l: 'Serif', v: 'font-serif' }, { l: 'Sans', v: 'font-sans' }, { l: 'Mono', v: 'font-mono' }].map((f) => (
                  <button key={f.v} onClick={() => setFontFamily(f.v)}
                    className={`px-3 py-1 rounded-lg text-xs border ${border} ${fontFamily === f.v ? 'bg-amber-500 text-white border-amber-500' : hover} ${f.v}`}>{f.l}</button>
                ))}
              </div>
            </div>
            {/* Width */}
            <div>
              <label className={`text-xs ${muted} mb-2 block`}>Largeur</label>
              <div className="flex gap-2">
                {[{ l: 'Étroit', v: 'max-w-xl' }, { l: 'Moyen', v: 'max-w-3xl' }, { l: 'Large', v: 'max-w-5xl' }].map((w) => (
                  <button key={w.v} onClick={() => setContentWidth(w.v)}
                    className={`px-3 py-1 rounded-lg text-xs border ${border} ${contentWidth === w.v ? 'bg-amber-500 text-white border-amber-500' : hover}`}>{w.l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar (TOC) ─────────────────────────────────────────────────── */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 w-80 ${bar} shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
          <div className={`p-5 border-b ${border} flex items-between justify-between`}>
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-amber-500" />
              <span className="font-semibold text-sm">Sommaire</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className={`p-2 rounded-lg ${hover}`}><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {chapters.map((ch, idx) => (
              <button key={ch.id} onClick={() => goTo(idx)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${currentChapter === idx ? `${active} border-l-4 border-amber-500` : hover}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${currentChapter === idx ? 'bg-amber-500 text-white' : `${darkMode ? 'bg-slate-700' : 'bg-stone-200'} ${muted}`}`}>{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug truncate">{ch.title}</p>
                  <p className={`text-xs ${muted}`}>Page {ch.pageNumber}</p>
                </div>
                {bookmarks.some((b) => b.chapterId === ch.id) && <Bookmark size={12} className="text-amber-500 shrink-0" fill="currentColor" />}
              </button>
            ))}
          </div>
          <div className={`p-4 border-t ${border} text-center text-xs ${muted}`}>
            {totalChapters} chapitres · {Math.round(progress)}% lu
            <p className="mt-1 font-mono text-amber-500/70">{accessCode}</p>
            {isAdmin && (
              <p className="mt-1 text-emerald-500/70 text-[10px] flex items-center justify-center gap-1">
                <Shield size={10} /> Mode Administrateur
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Search modal ──────────────────────────────────────────────────── */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowSearch(false); setSearchQuery(''); }} />
          <div className={`relative ${card} rounded-2xl shadow-2xl w-full max-w-lg p-6`}>
            <div className={`flex items-center gap-3 mb-4 pb-4 border-b ${border}`}>
              <Search size={18} className={muted} />
              <input type="text" autoFocus placeholder="Rechercher dans le guide…"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent outline-none text-base ${txt} placeholder:${muted}`} />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className={`p-1 rounded ${hover}`}><X size={16} /></button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {searchQuery && filteredChapters.length === 0 && <p className={`text-center ${muted} py-4 text-sm`}>Aucun résultat</p>}
              {(searchQuery ? filteredChapters : chapters).map((ch) => (
                <button key={ch.id} onClick={() => goTo(chapters.findIndex((c) => c.id === ch.id))}
                  className={`w-full text-left p-3 rounded-xl ${hover} transition-colors`}>
                  <p className="font-medium text-sm">{ch.title}</p>
                  <p className={`text-xs ${muted} line-clamp-1 mt-0.5`}>{ch.content.slice(0, 100)}…</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bookmarks modal ───────────────────────────────────────────────── */}
      {showBookmarks && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBookmarks(false)} />
          <div className={`relative ${card} rounded-2xl shadow-2xl w-full max-w-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Bookmark size={18} className="text-amber-500" /> Mes marque-pages</h3>
              <button onClick={() => setShowBookmarks(false)} className={`p-1 rounded ${hover}`}><X size={16} /></button>
            </div>
            {bmLoading ? (
              <p className={`text-center ${muted} py-6 text-sm`}>Chargement…</p>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark size={36} className={`${muted} mx-auto mb-3`} />
                <p className={`${muted} text-sm`}>Aucun marque-page pour le moment</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {bookmarks.map((bm) => (
                  <div key={bm.chapterId} className={`flex items-center gap-2 p-3 rounded-xl ${hover}`}>
                    <button onClick={() => { goTo(chapters.findIndex((c) => c.id === bm.chapterId)); setShowBookmarks(false); }} className="flex-1 text-left">
                      <p className="font-medium text-sm">{bm.title}</p>
                      <p className={`text-xs ${muted}`}>Page {bm.pageNumber}</p>
                    </button>
                    <button onClick={() => deleteBookmark(bm.chapterId)} className={`p-1.5 rounded-lg ${hover} text-red-400`}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="pt-20 pb-32 px-4 sm:px-6">
        <div className={`mx-auto ${contentWidth} ${card} rounded-2xl shadow-xl border ${border} overflow-hidden transition-all duration-300`}>

          {/* Chapter header */}
          <div className={`p-8 sm:p-12 border-b ${border}`}>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-amber-50'} text-amber-600 border ${darkMode ? 'border-slate-600' : 'border-amber-200'}`}>
                {currentChapter + 1} / {totalChapters}
              </span>
              <span className={`text-xs ${muted}`}>Page {chapters[currentChapter].pageNumber}</span>
              {isAdmin && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Admin
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-6">
              {chapters[currentChapter].title}
            </h1>

            {/* Key points box */}
            {chapters[currentChapter].keyPoints && (
              <div className={`rounded-xl p-5 ${darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'} border`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>Points clés</p>
                <ul className="space-y-2">
                  {chapters[currentChapter].keyPoints!.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle size={15} className={`mt-0.5 shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                      <span className={`text-sm ${darkMode ? 'text-amber-100' : 'text-amber-900'}`}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Chapter body - avec formatage spécial pour les titres */}
          <div className="p-8 sm:p-12">
            <div className={`${fontFamily}`} style={{ fontSize: `${fontSize}px`, lineHeight }}>
              {formatContent(chapters[currentChapter].content)}
            </div>
          </div>

          {/* Chapter footer dots */}
          <div className={`px-8 py-5 border-t ${border} flex items-center justify-between`}>
            <span className={`text-xs ${muted}`}>Page {chapters[currentChapter].pageNumber}</span>
            <div className="flex gap-1.5">
              {Array.from({ length: totalChapters }).map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentChapter ? 'bg-amber-500 w-5' : darkMode ? 'bg-slate-600' : 'bg-stone-300'}`} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Bottom nav ────────────────────────────────────────────────────── */}
      <div className={`fixed bottom-0 left-0 right-0 ${bar} ${border} border-t backdrop-blur-md bg-opacity-95 z-40`}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={goPrev} disabled={currentChapter === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm ${currentChapter === 0 ? 'opacity-30 cursor-not-allowed' : `${hover} hover:scale-105`}`}>
            <ChevronLeft size={16} /><span className="hidden sm:inline">Précédent</span>
          </button>

          <div className="flex items-center gap-1">
            {chapters.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${i === currentChapter ? 'bg-amber-500 text-white' : `${hover} ${muted}`}`}>
                {i + 1}
              </button>
            ))}
          </div>

          <button onClick={goNext} disabled={currentChapter === totalChapters - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm ${currentChapter === totalChapters - 1 ? 'opacity-30 cursor-not-allowed' : `${hover} hover:scale-105`}`}>
            <span className="hidden sm:inline">Suivant</span><ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 z-40 p-3 rounded-full shadow-lg bg-amber-500 text-white hover:bg-amber-400 transition-all hover:scale-110">
          <ArrowUp size={18} />
        </button>
      )}

      {/* ── Admin Panel ──────────────────────────────────────────────────── */}
      {showAdmin && (
        <AdminPanel accessCode={accessCode} onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}