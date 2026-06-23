// src/components/AdminPanel.tsx
import { useState, useEffect } from 'react';
import { 
  Users, Key, Plus, Trash2, CheckCircle, XCircle, 
  Copy, RefreshCw, Search, AlertCircle, Shield,
  UserPlus, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AccessCode {
  id: string;
  code: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  use_count: number;
}

interface Props {
  accessCode: string;
  onClose: () => void;
}

export default function AdminPanel({ accessCode, onClose }: Props) {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCode, setNewCode] = useState({
    code: '',
  });
  const [generating, setGenerating] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Statistiques
  const stats = {
    total: codes.length,
    active: codes.filter(c => c.is_active).length,
    inactive: codes.filter(c => !c.is_active).length,
    used: codes.filter(c => c.use_count && c.use_count > 0).length,
    totalUses: codes.reduce((sum, c) => sum + (c.use_count || 0), 0),
  };

  // Charger les codes
  const loadCodes = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST404') {
          setError('Table "access_codes" non trouvée. Veuillez créer la table.');
          setCodes([]);
        } else {
          setError('Erreur de chargement: ' + error.message);
        }
      } else {
        setCodes(data || []);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError('Erreur de connexion à la base de données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  // Générer un code aléatoire
  const generateCode = () => {
    const prefix = 'GNM';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
  };

  // Ajouter un code
  const handleAddCode = async () => {
    if (!newCode.code.trim()) {
      setError('Veuillez entrer un code');
      return;
    }

    setGenerating(true);
    setError('');
    try {
      const codeToAdd = newCode.code.trim().toUpperCase();
      
      // Vérifier si le code existe déjà
      const { data: existing } = await supabase
        .from('access_codes')
        .select('code')
        .eq('code', codeToAdd)
        .maybeSingle();

      if (existing) {
        setError('Ce code existe déjà');
        setGenerating(false);
        return;
      }

      const { error } = await supabase
        .from('access_codes')
        .insert({
          code: codeToAdd,
          is_active: true,
          created_at: new Date().toISOString(),
          use_count: 0,
        });

      if (error) throw error;

      setSuccess('✅ Code ajouté avec succès');
      setNewCode({ code: '' });
      setShowAddForm(false);
      await loadCodes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erreur:', err);
      if (err.code === 'PGRST409') {
        setError('Le code existe déjà.');
      } else {
        setError('Erreur: ' + (err.message || 'Impossible d\'ajouter le code'));
      }
    } finally {
      setGenerating(false);
    }
  };

  // Générer un code auto
  const handleGenerateAuto = () => {
    setNewCode({ ...newCode, code: generateCode() });
  };

  // Basculer l'état d'un code
  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('access_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setSuccess(`Code ${!currentStatus ? 'activé' : 'désactivé'}`);
      await loadCodes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError('Erreur lors du changement de statut');
    }
  };

  // Supprimer un code
  const deleteCode = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code définitivement ?')) return;

    try {
      const { error } = await supabase
        .from('access_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSuccess('🗑️ Code supprimé');
      await loadCodes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression');
    }
  };

  // Copier le code
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setSuccess('📋 Code copié !');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Filtrer les codes
  const filteredCodes = codes.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return 'Jamais';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Date invalide';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <Shield size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Administration</h2>
              <p className="text-sm text-slate-400">Gestion des codes d'accès</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
              title="Statistiques"
            >
              <Users size={18} />
            </button>
            <button
              onClick={() => { loadCodes(); setSuccess('🔄 Actualisé'); setTimeout(() => setSuccess(''), 2000); }}
              className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats */}
        {showStats && codes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-900/50 border-b border-slate-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-slate-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
              <div className="text-xs text-slate-400">Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.inactive}</div>
              <div className="text-xs text-slate-400">Inactifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.used}</div>
              <div className="text-xs text-slate-400">Utilisés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalUses}</div>
              <div className="text-xs text-slate-400">Total utilisations</div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Search & Add */}
        <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            Nouveau code
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="p-4 border-b border-slate-700 bg-slate-900/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <input
                  type="text"
                  placeholder="Code d'accès (ex: GNM-2026-ABCDEF)"
                  value={newCode.code}
                  onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleGenerateAuto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-white"
                  title="Générer auto"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCode}
                  disabled={generating}
                  className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw size={32} className="animate-spin mx-auto text-slate-500 mb-3" />
              <p className="text-slate-400">Chargement des codes...</p>
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-12">
              <Key size={32} className="mx-auto text-slate-500 mb-3" />
              <p className="text-slate-400">{searchTerm ? 'Aucun code correspondant' : 'Aucun code trouvé'}</p>
              {!searchTerm && (
                <p className="text-slate-500 text-sm mt-2">Ajoutez votre premier code d'accès !</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-xs text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="text-left p-3">Code</th>
                    <th className="text-left p-3">Statut</th>
                    <th className="text-left p-3 hidden lg:table-cell">Créé</th>
                    <th className="text-left p-3 hidden xl:table-cell">Dernière utilisation</th>
                    <th className="text-left p-3">Utilisations</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredCodes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3 font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{item.code}</span>
                          <button
                            onClick={() => copyCode(item.code)}
                            className="p-1 rounded hover:bg-slate-600 text-slate-500 hover:text-white transition-colors"
                            title="Copier"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleCodeStatus(item.id, item.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                            item.is_active
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {item.is_active ? (
                            <><CheckCircle size={12} /> Actif</>
                          ) : (
                            <><XCircle size={12} /> Inactif</>
                          )}
                        </button>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-xs text-slate-400">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="p-3 hidden xl:table-cell text-xs text-slate-400">
                        {formatDate(item.last_used_at)}
                      </td>
                      <td className="p-3 text-center text-sm text-slate-300">
                        {item.use_count || 0}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => deleteCode(item.id)}
                            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-xs text-slate-500 flex justify-between items-center">
          <span>{filteredCodes.length} code(s) affiché(s) sur {codes.length}</span>
          <span>Admin: {accessCode}</span>
        </div>
      </div>
    </div>
  );
}