// src/components/AccessGate.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Lock, MessageCircle, AlertCircle, Loader2, 
  ShoppingCart, FileText 
} from 'lucide-react';
import { verifyAccessCode } from '../lib/supabase';
import { chapter1 } from '../data/chapter1';
import { chapter2 } from '../data/chapter2';
import { chapter3 } from '../data/chapter3';
import { chapter4 } from '../data/chapter4';
import { chapter5 } from '../data/chapter5';
import { chapter6 } from '../data/chapter6';
import { chapter7 } from '../data/chapter7';
import { chapter8 } from '../data/chapter8';
import { chapter9 } from '../data/chapter9';

interface Props {
  onAccessGranted: (code: string) => void;
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

export default function AccessGate({ onAccessGranted }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Numéro WhatsApp du support
  const WHATSAPP_NUMBER = '778677650';
  
  const WHATSAPP_MESSAGE = `Bonjour, je souhaite acheter l'accès au "Guide Négociation Master". 
  
Je suis prêt à procéder au paiement. Veuillez m'envoyer le lien de paiement.

Merci !`;

  // Auto-focus
  useEffect(() => {
    try {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.warn('Focus failed:', error);
    }
  }, []);

  const handleSubmit = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Veuillez entrer un code d\'accès');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyAccessCode(trimmedCode.toUpperCase());

      if (result.valid) {
        setTimeout(() => {
          onAccessGranted(trimmedCode.toUpperCase());
        }, 100);
      } else {
        setError(result.reason ?? 'Code invalide. Veuillez réessayer.');
        if (inputRef.current) {
          inputRef.current.style.animation = 'shake 0.5s ease-in-out';
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.style.animation = '';
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('Erreur de vérification:', error);
      setError('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Ouvrir WhatsApp
  const openWhatsApp = () => {
    const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(url, '_blank');
    setShowPaymentModal(false);
  };

  const openSupportWhatsApp = () => {
    const supportMessage = encodeURIComponent(
      `Bonjour, j'ai besoin d'aide concernant l'accès au "Guide Négociation Master".`
    );
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${supportMessage}`;
    window.open(url, '_blank');
  };

  // ── Téléchargement du guide ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
            <BookOpen size={36} className="text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Guide Négociation Master
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Contenu exclusif réservé aux membres.<br />
            Entrez votre code d'accès pour continuer.
          </p>
          
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2">
              <Lock size={14} className="inline mr-1.5 text-amber-400" />
              Votre code d'accès
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ex : GNM-2024-XXXXX"
                className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 focus:ring-amber-500 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all font-mono text-base tracking-widest"
                maxLength={30}
                disabled={loading}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fadeIn">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Vérification…
              </>
            ) : (
              'Accéder au guide'
            )}
          </button>

          {/* Séparateur */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-transparent text-slate-500">ou</span>
            </div>
          </div>

          {/* Bouton WhatsApp pour acheter */}
          <button
              onClick={openWhatsApp}
              className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Acheter l'E-BOOK A 5000F
            </button>

            <p className="mt-4 text-sm text-center text-slate-300">
              Le guide n'est accessible qu'après validation du code d'accès. Si vous n'en avez pas, contactez le support pour acheter l'accès.
            </p>
            <p className="mt-3 text-xs text-center text-slate-500">
              📚 Version complète · 9 chapitres · Lisible sur tous les appareils
            </p>

        </div>

        {/* WhatsApp hint - support */}
        <div className="mt-6 flex items-start gap-3 px-4 py-4 rounded-xl bg-green-500/10 border border-green-500/20 cursor-pointer hover:bg-green-500/20 transition-colors" onClick={openSupportWhatsApp}>
          <MessageCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
          <p className="text-slate-400 text-sm">
            Besoin d'aide ? Contactez-nous sur <span className="text-green-400 font-medium">WhatsApp</span>.
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          © {new Date().getFullYear()} Guide Négociation Master · Contenu protégé
        </p>
      </div>

      {/* Modal de confirmation d'achat */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
                <ShoppingCart size={32} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Confirmer l'achat
              </h2>
              <p className="text-slate-400 text-sm">
                Vous allez recevoir un lien de paiement par WhatsApp.
                Une fois le paiement effectué, vous recevrez votre code d'accès unique.
              </p>
            </div>

            <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <p className="font-medium text-amber-400">⚠️ Important</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                    <li>Votre code sera <span className="text-white font-medium">unique et personnel</span></li>
                    <li>Utilisable sur <span className="text-white font-medium">un seul appareil</span></li>
                    <li>Valable pour toute la durée du guide</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={openWhatsApp}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Continuer sur WhatsApp
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-medium transition-all duration-200"
              >
                Annuler
              </button>
            </div>

            <p className="text-center text-xs text-slate-500 mt-4">
              Vous serez redirigé vers WhatsApp pour finaliser votre achat
            </p>
          </div>
        </div>
      )}

      {/* Styles d'animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}