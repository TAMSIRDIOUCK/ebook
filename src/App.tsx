// src/App.tsx
import React, { useState, useEffect, Suspense } from 'react';
import AccessGate from './components/AccessGate';
import EbookReader from './components/EbookReader';
import InstallPrompt from './components/InstallPrompt';

const STORAGE_KEY = 'gnm_access_code';

// Composant ErrorBoundary fonctionnel avec hooks
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Error caught:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Une erreur est survenue</h2>
          <p className="text-slate-400 mb-6">Veuillez rafraîchir la page</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400"
          >
            Rafraîchir
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Composant de chargement
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400">Chargement...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAccessCode(saved);
      }
    } catch (error) {
      console.warn('Erreur de lecture localStorage:', error);
    } finally {
      setReady(true);
    }
  }, []);

  const handleAccessGranted = (code: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
      setAccessCode(code);
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setAccessCode(null);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  if (!ready) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <InstallPrompt />
      <Suspense fallback={<LoadingFallback />}>
        {!accessCode ? (
          <AccessGate onAccessGranted={handleAccessGranted} />
        ) : (
          <EbookReader accessCode={accessCode} onLogout={handleLogout} />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}