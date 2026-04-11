import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Download, Upload, Plus, Trash2, Edit2, X, ArrowLeft, Settings, Database, FileJson, Search, Users, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { FlattenedFiliere, UserProfile } from './types';
import { subscribeToUsers, updateUserProfile, publishCatalog } from './services/firestoreService';
import { getAllFilieres, getAppData, saveAppData, resetAppData } from './utils';

const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl ${className}`}>
    {children}
  </div>
);

export default function Admin({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'filieres' | 'users'>('filieres');
  const [filieres, setFilieres] = useState<FlattenedFiliere[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingFiliere, setEditingFiliere] = useState<FlattenedFiliere | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setFilieres(getAllFilieres());
    const unsubUsers = subscribeToUsers((data) => setUsers(data));
    return () => {
      unsubUsers();
    };
  }, []);

  const saveFilieresLocal = (newFilieres: FlattenedFiliere[]) => {
    const appData = getAppData();
    appData.filieres = newFilieres;
    saveAppData(appData);
    setFilieres(newFilieres);
  };

  const handleDeleteFiliere = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette filière ?')) {
      const newFilieres = filieres.filter(f => f.id !== id);
      saveFilieresLocal(newFilieres);
    }
  };

  const handleToggleUserLock = async (user: UserProfile) => {
    const action = user.isLocked ? 'déverrouiller' : 'verrouiller';
    if (confirm(`Voulez-vous vraiment ${action} le compte de ${user.nomComplet} ?`)) {
      await updateUserProfile(user.uid, { isLocked: !user.isLocked });
    }
  };

  const handleToggleUserDelete = async (user: UserProfile) => {
    const action = user.isDeleted ? 'restaurer' : 'supprimer (bloquer)';
    if (confirm(`Voulez-vous vraiment ${action} le compte de ${user.nomComplet} ?`)) {
      await updateUserProfile(user.uid, { isDeleted: !user.isDeleted });
    }
  };

  const openModal = (filiere?: FlattenedFiliere) => {
    if (filiere) {
      const copy = JSON.parse(JSON.stringify(filiere)); // Deep copy
      if (!copy.matieres) copy.matieres = [];
      if (!copy.matieres_cles) copy.matieres_cles = [];
      setEditingFiliere(copy);
    } else {
      setEditingFiliere({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        nom_filiere: '',
        universite: '',
        type_universite: 'Public',
        etablissement: '',
        sigle: '',
        localisation: '',
        mode_entree: 'Classement',
        baccalaureats_recommandes: [],
        matieres_cles: [],
        matieres: [{ nom: 'Maths', coeff: 3 }],
        debouches: [],
        quotas: { bourses: 0, aides_fpp: 0 },
        bourses: 0,
        aides: 0,
        candidatsCount: 0
      });
    }
    setIsModalOpen(true);
  };

  const saveFiliere = async () => {
    if (!editingFiliere) return;
    if (!editingFiliere.nom_filiere || !editingFiliere.universite) {
      alert('Le nom et l\'université sont obligatoires.');
      return;
    }

    const isNew = !filieres.find(f => f.id === editingFiliere.id);
    let newFilieres;
    if (isNew) {
      newFilieres = [editingFiliere, ...filieres];
    } else {
      newFilieres = filieres.map(f => f.id === editingFiliere.id ? editingFiliere : f);
    }

    saveFilieresLocal(newFilieres);
    setIsModalOpen(false);
  };

  const filteredFilieres = filieres.filter(f => 
    f.nom_filiere.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.sigle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.universite.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{opacity:0, y: 20}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -20}} className="min-h-screen p-4 sm:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-4 p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 hover:bg-white/80 transition-all text-slate-600 hover:text-indigo-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Administration</h1>
              <p className="text-slate-500 text-sm mt-1">Gérez les données et les utilisateurs</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4">
          <button 
            onClick={() => setActiveTab('filieres')}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center transition-all ${activeTab === 'filieres' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white/60 text-slate-600 hover:bg-white/80'}`}
          >
            <Database className="w-5 h-5 mr-2" /> Filières
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white/60 text-slate-600 hover:bg-white/80'}`}
          >
            <Users className="w-5 h-5 mr-2" /> Utilisateurs
          </button>
        </div>

        {/* Content */}
        <GlassCard className="overflow-hidden flex flex-col">
          <div className="p-6 sm:p-8 border-b border-white/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/50 border border-white/50 shadow-inner rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
              {activeTab === 'filieres' && (
                <>
                  <button onClick={async () => {
                    if (confirm("Êtes-vous sûr de vouloir publier le catalogue local vers le serveur ? Tous les utilisateurs recevront cette mise à jour.")) {
                      try {
                        await publishCatalog(filieres);
                        alert("Catalogue publié avec succès !");
                      } catch (e) {
                        console.error(e);
                        alert("Erreur lors de la publication.");
                      }
                    }
                  }} className="flex items-center px-5 py-2.5 bg-emerald-500 text-white rounded-xl shadow-md hover:bg-emerald-600 font-medium text-sm transition-all whitespace-nowrap">
                    <Upload className="w-4 h-4 mr-2" /> Publier en ligne
                  </button>
                  <button onClick={() => {
                    if (confirm('Attention : Cela va écraser toutes vos modifications locales et recharger les données depuis le fichier guide.json. Continuer ?')) {
                      const newData = resetAppData();
                      setFilieres(newData.filieres);
                    }
                  }} className="flex items-center px-5 py-2.5 bg-amber-500 text-white rounded-xl shadow-md hover:bg-amber-600 font-medium text-sm transition-all whitespace-nowrap">
                    <Download className="w-4 h-4 mr-2" /> Recharger guide.json
                  </button>
                  <button onClick={() => openModal()} className="flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5 font-medium text-sm transition-all whitespace-nowrap">
                    <Plus className="w-4 h-4 mr-2" /> Ajouter
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {activeTab === 'filieres' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-white/40">
                    <th className="p-5 font-medium">Filière & Établissement</th>
                    <th className="p-5 font-medium">Université</th>
                    <th className="p-5 font-medium">Quotas (B/A)</th>
                    <th className="p-5 font-medium">Capacité (Off.)</th>
                    <th className="p-5 font-medium">Candidats</th>
                    <th className="p-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {filteredFilieres.map(f => (
                    <tr key={f.id} className="hover:bg-white/60 transition-colors group border-b border-slate-100/50 last:border-0">
                      <td className="p-5">
                        <div className="font-bold text-slate-800 mb-1.5">{f.nom_filiere}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200">{f.sigle}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${f.type_universite === 'Public' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{f.type_universite}</span>
                          <span className="text-xs text-slate-500 font-medium">{f.etablissement}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="text-sm text-slate-700 font-medium mb-1">{f.universite}</div>
                        <div className="flex gap-1">
                          {f.baccalaureats_recommandes?.map(s => <span key={s} className="bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold">BAC {s}</span>)}
                        </div>
                      </td>
                      <td className="p-5 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-bold text-xs border border-emerald-100" title="Bourses">{f.quotas?.bourses || 0}</span>
                          <span className="text-slate-300">/</span>
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold text-xs border border-blue-100" title="Aides">{f.quotas?.aides_fpp || 0}</span>
                        </div>
                      </td>
                      <td className="p-5 text-sm font-black text-slate-700">
                        {f.admisOfficiels || ((f.quotas?.bourses || 0) + (f.quotas?.aides_fpp || 0))}
                      </td>
                      <td className="p-5 text-sm font-black text-indigo-600">
                        {f.candidatsCount || 0}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(f)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteFiliere(f.id!)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-white/40">
                    <th className="p-5 font-medium">Étudiant</th>
                    <th className="p-5 font-medium">Série</th>
                    <th className="p-5 font-medium">Choix validés</th>
                    <th className="p-5 font-medium">Statut</th>
                    <th className="p-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className={`hover:bg-white/40 transition-colors group ${u.isDeleted ? 'opacity-50' : ''}`}>
                      <td className="p-5">
                        <div className="font-bold text-slate-800 mb-1">{u.nomComplet}</div>
                        <div className="text-xs text-slate-500">{u.matricule} • {u.email}</div>
                      </td>
                      <td className="p-5 text-sm font-bold text-slate-700">{u.serie || '-'}</td>
                      <td className="p-5 text-sm">
                        {u.isLocked ? (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-bold text-xs border border-emerald-100 flex items-center w-max">
                            <Lock className="w-3 h-3 mr-1" /> Oui ({u.choices.length})
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-bold text-xs border border-amber-100 flex items-center w-max">
                            <Unlock className="w-3 h-3 mr-1" /> Non ({u.choices.length})
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-sm">
                        {u.isDeleted ? (
                          <span className="text-rose-600 font-bold text-xs flex items-center"><ShieldAlert className="w-3 h-3 mr-1"/> Bloqué</span>
                        ) : (
                          <span className="text-slate-600 font-medium text-xs capitalize">{u.allocationStatus}</span>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleToggleUserLock(u)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors" title={u.isLocked ? "Déverrouiller" : "Verrouiller"}>
                            {u.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleToggleUserDelete(u)} className={`p-2 rounded-xl transition-colors ${u.isDeleted ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-rose-600 bg-rose-50 hover:bg-rose-100'}`} title={u.isDeleted ? "Restaurer" : "Bloquer"}>
                            {u.isDeleted ? <ShieldAlert className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Modal d'édition */}
      <AnimatePresence>
        {isModalOpen && editingFiliere && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl max-w-4xl w-full my-auto flex flex-col overflow-hidden border border-white"
            >
              <div className="p-6 sm:p-8 flex justify-between items-center border-b border-slate-100/50 bg-white/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl shadow-md shadow-indigo-200">
                    <FileJson className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 leading-tight">
                      {editingFiliere.nom_filiere ? 'Modifier la filière' : 'Nouvelle filière'}
                    </h2>
                    <p className="text-sm text-slate-500">{editingFiliere.id}</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600"><X className="h-5 w-5" /></button>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto max-h-[65vh] space-y-8 custom-scrollbar">
                
                {/* Infos de base */}
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Informations Générales</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de la filière *</label>
                      <input type="text" value={editingFiliere.nom_filiere} onChange={e => setEditingFiliere({...editingFiliere, nom_filiere: e.target.value})} className="w-full bg-slate-50/50 border border-slate-200 shadow-inner rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="Ex: Génie Logiciel" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Université *</label>
                      <input type="text" value={editingFiliere.universite} onChange={e => setEditingFiliere({...editingFiliere, universite: e.target.value})} className="w-full bg-slate-50/50 border border-slate-200 shadow-inner rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="Ex: UAC" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Établissement</label>
                      <input type="text" value={editingFiliere.etablissement} onChange={e => setEditingFiliere({...editingFiliere, etablissement: e.target.value})} className="w-full bg-slate-50/50 border border-slate-200 shadow-inner rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="Ex: IFRI" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Sigle</label>
                      <input type="text" value={editingFiliere.sigle} onChange={e => setEditingFiliere({...editingFiliere, sigle: e.target.value})} className="w-full bg-slate-50/50 border border-slate-200 shadow-inner rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="Ex: GL" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Localisation</label>
                      <input type="text" value={editingFiliere.localisation} onChange={e => setEditingFiliere({...editingFiliere, localisation: e.target.value})} className="w-full bg-slate-50/50 border border-slate-200 shadow-inner rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="Ex: Abomey-Calavi" />
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Quotas & Séries */}
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Critères d'admission</h3>
                      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Séries recommandées</label>
                          <input type="text" value={editingFiliere.baccalaureats_recommandes.join(', ')} onChange={e => setEditingFiliere({...editingFiliere, baccalaureats_recommandes: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} placeholder="Ex: C, D, E" className="w-full bg-white border border-slate-200 shadow-inner rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                          <p className="text-xs text-slate-500 mt-1.5">Séparez les séries par des virgules.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Matières clés</label>
                          <input type="text" value={(editingFiliere.matieres_cles || []).join(', ')} onChange={e => setEditingFiliere({...editingFiliere, matieres_cles: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} placeholder="Ex: Maths, Physique" className="w-full bg-white border border-slate-200 shadow-inner rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                          <p className="text-xs text-slate-500 mt-1.5">Séparez les matières par des virgules.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bourses</label>
                            <input type="number" min="0" value={editingFiliere.quotas.bourses} onChange={e => {
                              const val = parseInt(e.target.value)||0;
                              setEditingFiliere({...editingFiliere, bourses: val, quotas: {...editingFiliere.quotas, bourses: val}});
                            }} className="w-full bg-white border border-slate-200 shadow-inner rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Aides / FPP</label>
                            <input type="number" min="0" value={editingFiliere.quotas.aides_fpp} onChange={e => {
                              const val = parseInt(e.target.value)||0;
                              setEditingFiliere({...editingFiliere, aides: val, quotas: {...editingFiliere.quotas, aides_fpp: val}});
                            }} className="w-full bg-white border border-slate-200 shadow-inner rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacité Officielle (Ministère)</label>
                            <input type="number" min="0" value={editingFiliere.admisOfficiels || (editingFiliere.quotas.bourses + editingFiliere.quotas.aides_fpp)} onChange={e => setEditingFiliere({...editingFiliere, admisOfficiels: parseInt(e.target.value)||0})} className="w-full bg-white border border-slate-200 shadow-inner rounded-xl p-3 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                            <p className="text-xs text-slate-500 mt-1.5">Nombre total d'admis prévus par le ministère.</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Matières */}
                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Matières & Coefficients</h3>
                      <button onClick={() => setEditingFiliere({...editingFiliere, matieres: [...editingFiliere.matieres, {nom:'', coeff:1}]})} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center">
                        <Plus className="w-3 h-3 mr-1"/> Ajouter
                      </button>
                    </div>
                    <div className="space-y-3 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                      {editingFiliere.matieres.map((mat, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <input type="text" placeholder="Nom matière" value={mat.nom} onChange={e => {
                            const newMat = [...editingFiliere.matieres];
                            newMat[idx].nom = e.target.value;
                            setEditingFiliere({...editingFiliere, matieres: newMat});
                          }} className="flex-1 bg-white border border-slate-200 shadow-inner rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                          <input type="number" min="1" placeholder="Coeff" value={mat.coeff} onChange={e => {
                            const newMat = [...editingFiliere.matieres];
                            newMat[idx].coeff = parseInt(e.target.value)||1;
                            setEditingFiliere({...editingFiliere, matieres: newMat});
                          }} className="w-20 bg-white border border-slate-200 shadow-inner rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-center" />
                          <button onClick={() => {
                            const newMat = editingFiliere.matieres.filter((_, i) => i !== idx);
                            setEditingFiliere({...editingFiliere, matieres: newMat});
                          }} className="p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ))}
                      {editingFiliere.matieres.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-2">Aucune matière définie.</p>
                      )}
                    </div>
                  </section>
                </div>

                {/* Débouchés */}
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Débouchés Professionnels</h3>
                  <textarea rows={4} value={editingFiliere.debouches.join('\n')} onChange={e => setEditingFiliere({...editingFiliere, debouches: e.target.value.split('\n').filter(Boolean)})} placeholder="Un métier par ligne..." className="w-full bg-slate-50/50 border border-slate-200 shadow-inner rounded-xl p-4 focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none transition-all" />
                </section>

              </div>
              
              <div className="p-6 sm:p-8 border-t border-slate-100/50 bg-white/50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Annuler</button>
                <button onClick={saveFiliere} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5 rounded-xl transition-all flex items-center">
                  <Save className="w-5 h-5 mr-2" /> Enregistrer la filière
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
