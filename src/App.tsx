import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Search, Building2, Calculator, BookOpen, 
  Info, X, AlertTriangle, CheckCircle2, BarChart3, ChevronRight, 
  ArrowLeft, Star, TrendingUp, Compass, User, Home, MapPin, ArrowRight, Settings, HelpCircle, Target, Zap, Lock, LogOut, Users, ShieldAlert
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getAllFilieres } from './utils';
import { FlattenedFiliere, UserProfile } from './types';
import { 
  calculerScore, 
  filtrerParSerie, 
  genererRecommandations, 
  rechercherFilieres, 
  ResultatRecommandation 
} from './engine';
import Admin from './Admin';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getUserProfile, createUserProfile, updateUserProfile, subscribeToFilieres, updateFiliereChoices } from './services/firestoreService';

const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#059669', '#d97706'];

export default function App() {
  const [view, setView] = useState<'home' | 'profile' | 'results' | 'explore' | 'details' | 'admin'>('home');
  const [allFilieres, setAllFilieres] = useState<FlattenedFiliere[]>([]);
  
  // Auth State
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [matriculeInput, setMatriculeInput] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [selectedSerie, setSelectedSerie] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedFiliere, setSelectedFiliere] = useState<FlattenedFiliere | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [grades, setGrades] = useState<Record<string, number>>({
    Maths: 0, SVT: 0, PCT: 0, Français: 0, Anglais: 0
  });

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
            setSelectedSerie(profile.serie || '');
            setGrades(profile.grades || { Maths: 0, SVT: 0, PCT: 0, Français: 0, Anglais: 0 });
          } else {
            setShowAuthModal(true); // Need matricule to complete registration
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setShowAuthModal(true);
        }
      } else {
        setUserProfile(null);
        if (view === 'admin') setView('home');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [view]);

  // Firestore Filieres Listener
  useEffect(() => {
    if (isAuthReady) {
      // Subscribe to real-time filieres updates
      const unsubscribe = subscribeToFilieres((filieres) => {
        if (filieres.length > 0) {
          setAllFilieres(filieres);
        } else {
          // Fallback to local if empty
          setAllFilieres(getAllFilieres());
        }
      });
      return () => unsubscribe();
    }
  }, [isAuthReady]);

  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!authUser || !matriculeInput.trim()) return;
    const newProfile: UserProfile = {
      uid: authUser.uid,
      matricule: matriculeInput,
      nomComplet: authUser.displayName || '',
      email: authUser.email || '',
      role: 'student',
      isLocked: false,
      isDeleted: false,
      serie: '',
      grades: { Maths: 0, SVT: 0, PCT: 0, Français: 0, Anglais: 0 },
      choices: [],
      allocationStatus: 'pending'
    };
    await createUserProfile(newProfile);
    setUserProfile(newProfile);
    setShowAuthModal(false);
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    const updated = { ...userProfile, serie: selectedSerie, grades };
    await updateUserProfile(userProfile.uid, { serie: selectedSerie, grades });
    setUserProfile(updated);
  };

  const toggleChoice = async (filiereId: string) => {
    if (!userProfile || userProfile.isLocked) return;
    let newChoices = [...userProfile.choices];
    if (newChoices.includes(filiereId)) {
      newChoices = newChoices.filter(id => id !== filiereId);
    } else {
      if (newChoices.length >= 3) {
        alert("Vous ne pouvez choisir que 3 filières maximum.");
        return;
      }
      newChoices.push(filiereId);
    }
    await updateFiliereChoices(userProfile.uid, userProfile.choices, newChoices);
    setUserProfile({ ...userProfile, choices: newChoices });
  };

  const lockChoices = async () => {
    if (!userProfile || userProfile.choices.length === 0) return;
    if (window.confirm("Êtes-vous sûr de vouloir valider vos choix ? Cette action est irréversible.")) {
      await updateUserProfile(userProfile.uid, { isLocked: true });
      setUserProfile({ ...userProfile, isLocked: true });
    }
  };

  const updateAllocationStatus = async (status: 'boursier' | 'secouru' | 'fpp' | 'none') => {
    if (!userProfile) return;
    await updateUserProfile(userProfile.uid, { allocationStatus: status });
    setUserProfile({ ...userProfile, allocationStatus: status });
  };

  const allSeries = useMemo(() => Array.from(new Set(allFilieres.flatMap(f => f.baccalaureats_recommandes))).sort(), [allFilieres]);
  const allUniversities = useMemo(() => Array.from(new Set(allFilieres.map(f => f.universite))).sort(), [allFilieres]);

  const recommendations = useMemo(() => {
    if (!selectedSerie) return [];
    const filieresFiltrees = filtrerParSerie(allFilieres, selectedSerie);
    return genererRecommandations(filieresFiltrees, grades);
  }, [selectedSerie, grades, allFilieres]);

  const exploredFilieres = useMemo(() => {
    let resultats = rechercherFilieres(allFilieres, searchQuery);
    if (selectedUniversity) {
      resultats = resultats.filter(f => f.universite === selectedUniversity);
    }
    return resultats;
  }, [searchQuery, selectedUniversity, allFilieres]);

  const universityStats = useMemo(() => allUniversities.map(uni => ({
    name: uni,
    Bourses: allFilieres.filter(f => f.universite === uni).reduce((s, f) => s + f.quotas.bourses, 0),
    Aides: allFilieres.filter(f => f.universite === uni).reduce((s, f) => s + f.quotas.aides_partiellement_payant, 0)
  })), [allUniversities, allFilieres]);

  const topFilieresBourses = useMemo(() => [...allFilieres]
    .sort((a, b) => b.quotas.bourses - a.quotas.bourses).slice(0, 5)
    .map(f => ({ name: f.sigle || f.nom_filiere.substring(0, 15) + '...', Bourses: f.quotas.bourses, full_name: f.nom_filiere })), [allFilieres]);

  const topFilieresDemandees = useMemo(() => [...allFilieres]
    .sort((a, b) => (b.candidatsCount || 0) - (a.candidatsCount || 0)).slice(0, 5)
    .map(f => ({ name: f.sigle || f.nom_filiere.substring(0, 15) + '...', Candidats: f.candidatsCount || 0, full_name: f.nom_filiere })), [allFilieres]);

  const NavItem = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all ${active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}>
      {icon}
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  );

  const GlassCard = ({ children, className = '', onClick }: any) => (
    <div onClick={onClick} className={`bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''} ${className}`}>
      {children}
    </div>
  );

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (userProfile?.isDeleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <GlassCard className="p-8 max-w-md">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Compte bloqué</h2>
          <p className="text-slate-600 mb-6">Votre compte a été supprimé ou bloqué pour suspicion de fraude. Vous ne pouvez plus vous inscrire.</p>
          <button onClick={logout} className="text-indigo-600 font-medium">Se déconnecter</button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-800 font-sans selection:bg-indigo-200 pb-24">
      <AnimatePresence mode="wait">
        {view === 'admin' ? (
          <motion.div key="admin-view" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Admin onBack={() => setView('home')} />
          </motion.div>
        ) : (
          <motion.div key="main-app" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 z-40 p-4">
              <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-3xl px-5 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-1.5 rounded-xl shadow-md shadow-indigo-200">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-display font-bold text-lg text-slate-900">OrientaBénin</span>
                </div>
                <div className="flex space-x-2 items-center">
                  {userProfile && (userProfile.role === 'admin' || userProfile.role === 'super_admin') && (
                    <button onClick={() => setView('admin')} className="p-2 bg-white/50 hover:bg-white rounded-xl transition-colors text-slate-600"><Settings className="w-5 h-5"/></button>
                  )}
                  <button onClick={() => setShowStats(true)} className="p-2 bg-white/50 hover:bg-white rounded-xl transition-colors text-slate-600"><BarChart3 className="w-5 h-5"/></button>
                  <button onClick={() => setShowInfo(true)} className="p-2 bg-white/50 hover:bg-white rounded-xl transition-colors text-slate-600"><Info className="w-5 h-5"/></button>
                  {authUser ? (
                    <button onClick={logout} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"><LogOut className="w-5 h-5"/></button>
                  ) : (
                    <button onClick={handleLogin} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors">Connexion</button>
                  )}
                </div>
              </div>
            </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 pt-28">
        <AnimatePresence mode="wait">
          
          {/* HOME VIEW (LANDING PAGE) */}
          {view === 'home' && (
            <motion.div key="home" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="flex flex-col items-center mt-4 pb-12">
              
              {/* Hero Section */}
              <div className="text-center mb-12">
                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-[2rem] shadow-2xl shadow-indigo-200 flex items-center justify-center mx-auto mb-8 rotate-3">
                  <GraduationCap className="w-12 h-12 text-white -rotate-3" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-display font-black text-slate-900 mb-6 tracking-tight leading-tight">
                  Trouvez votre voie <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">universitaire au Bénin</span>
                </h2>
                <p className="text-slate-600 mb-10 text-lg max-w-lg mx-auto leading-relaxed">
                  Découvrez les filières, simulez vos chances d'obtenir une bourse et faites le meilleur choix stratégique pour votre avenir grâce aux données officielles du MESRS.
                </p>
                <button onClick={() => setView('profile')} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-200/50 hover:shadow-indigo-300/50 hover:-translate-y-1 transition-all rounded-2xl px-8 py-4 font-bold text-lg flex items-center mx-auto">
                  Démarrer l'orientation <ChevronRight className="ml-2 w-5 h-5" />
                </button>
              </div>

              {/* Features Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                <GlassCard className="p-6 text-left">
                  <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Calculator className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Simulateur de Score</h3>
                  <p className="text-sm text-slate-600">Calculez votre moyenne pondérée exacte selon les exigences de chaque filière.</p>
                </GlassCard>
                
                <GlassCard className="p-6 text-left">
                  <div className="bg-violet-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-violet-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Recommandations</h3>
                  <p className="text-sm text-slate-600">Obtenez des suggestions de filières (Fortement recommandée, Possible, Risquée).</p>
                </GlassCard>
                
                <GlassCard className="p-6 text-left">
                  <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Suivi en temps réel</h3>
                  <p className="text-sm text-slate-600">Visualisez le nombre de candidats par filière pour faire des choix stratégiques.</p>
                </GlassCard>
                
                <GlassCard className="p-6 text-left">
                  <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Validation sécurisée</h3>
                  <p className="text-sm text-slate-600">Verrouillez vos choix définitifs et déclarez votre statut post-sélection.</p>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* PROFILE VIEW */}
          {view === 'profile' && (
            <motion.div key="profile" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}}>
              {!authUser ? (
                <GlassCard className="p-8 text-center mb-6">
                  <User className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Connectez-vous</h2>
                  <p className="text-slate-600 mb-6">Vous devez être connecté pour sauvegarder votre profil et faire vos choix de filières.</p>
                  <button onClick={handleLogin} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                    Connexion avec Google
                  </button>
                </GlassCard>
              ) : (
                <>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-3xl font-display font-bold text-slate-900">Votre Profil</h2>
                      <p className="text-slate-500">Matricule: {userProfile?.matricule}</p>
                    </div>
                    {userProfile?.isLocked && (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                        <Lock className="w-4 h-4 mr-1" /> Choix validés
                      </span>
                    )}
                  </div>

                  {userProfile?.isLocked && userProfile.allocationStatus === 'pending' && (
                    <GlassCard className="p-6 mb-6 border-amber-200 bg-amber-50/50">
                      <h3 className="font-bold text-amber-800 mb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> Résultat de la sélection</h3>
                      <p className="text-sm text-slate-600 mb-4">Félicitations pour la validation de vos choix ! Quel a été le résultat final de votre orientation ?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => updateAllocationStatus('boursier')} className="bg-white border border-amber-200 p-2 rounded-lg text-sm font-medium hover:bg-amber-100">Boursier</button>
                        <button onClick={() => updateAllocationStatus('secouru')} className="bg-white border border-amber-200 p-2 rounded-lg text-sm font-medium hover:bg-amber-100">Secouru(e)</button>
                        <button onClick={() => updateAllocationStatus('fpp')} className="bg-white border border-amber-200 p-2 rounded-lg text-sm font-medium hover:bg-amber-100">Titre Payant (FPP)</button>
                        <button onClick={() => updateAllocationStatus('none')} className="bg-white border border-amber-200 p-2 rounded-lg text-sm font-medium hover:bg-amber-100">Non classé(e)</button>
                      </div>
                    </GlassCard>
                  )}
                  
                  <GlassCard className={`p-6 mb-6 ${userProfile?.isLocked ? 'opacity-75 pointer-events-none' : ''}`}>
                    <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center"><User className="w-4 h-4 mr-2 text-indigo-500"/> Série du BAC</label>
                    <select value={selectedSerie} onChange={e => setSelectedSerie(e.target.value)} className="w-full bg-white/50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium appearance-none">
                      <option value="">Sélectionnez votre série...</option>
                      {allSeries.map(s => <option key={s} value={s}>Série {s}</option>)}
                    </select>
                  </GlassCard>

                  <GlassCard className={`p-6 mb-8 ${userProfile?.isLocked ? 'opacity-75 pointer-events-none' : ''}`}>
                    <h3 className="font-semibold mb-4 flex items-center text-slate-800"><Calculator className="w-4 h-4 mr-2 text-violet-500"/> Vos Notes (sur 20)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {Object.keys(grades).map(subject => (
                        <div key={subject}>
                          <label className="block text-xs font-medium text-slate-500 mb-1.5">{subject}</label>
                          <input type="number" min="0" max="20" value={grades[subject] || ''} onChange={e => setGrades({...grades, [subject]: parseFloat(e.target.value) || 0})} className="w-full bg-white/50 border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700" />
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {!userProfile?.isLocked && (
                    <button onClick={() => { handleSaveProfile(); setView('results'); }} disabled={!selectedSerie} className={`w-full rounded-2xl py-4 font-semibold shadow-xl transition-all flex justify-center items-center mb-4 ${selectedSerie ? 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 shadow-slate-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                      Enregistrer et voir les recommandations <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  )}

                  {userProfile && userProfile.choices.length > 0 && !userProfile.isLocked && (
                    <GlassCard className="p-6 border-indigo-200 bg-indigo-50/30">
                      <h3 className="font-bold text-slate-800 mb-2">Vos choix actuels ({userProfile.choices.length}/3)</h3>
                      <ul className="mb-4 space-y-2">
                        {userProfile.choices.map(id => {
                          const f = allFilieres.find(f => f.id === id);
                          return f ? <li key={id} className="text-sm text-slate-600 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-indigo-500"/> {f.nom_filiere} ({f.sigle})</li> : null;
                        })}
                      </ul>
                      <button onClick={lockChoices} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center">
                        <Lock className="w-4 h-4 mr-2" /> Valider définitivement mes choix
                      </button>
                    </GlassCard>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* RESULTS VIEW */}
          {view === 'results' && (
            <motion.div key="results" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-display font-bold text-slate-900">Recommandations</h2>
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">{recommendations.length}</span>
              </div>
              
              {!selectedSerie ? (
                <GlassCard className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Veuillez sélectionner votre série de BAC dans le profil pour voir les recommandations.</p>
                  <button onClick={() => setView('profile')} className="mt-4 text-indigo-600 font-medium hover:underline">Aller au profil</button>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec: ResultatRecommandation<FlattenedFiliere>) => {
                    const f = rec.filiere;
                    let levelColor = 'bg-slate-50 text-slate-700 border-slate-200';
                    if (rec.niveau === 'Fortement recommandée') levelColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    else if (rec.niveau === 'Possible') levelColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    else if (rec.niveau === 'Risquée') levelColor = 'bg-amber-50 text-amber-700 border-amber-200';

                    const isChosen = userProfile?.choices.includes(f.id!);

                    return (
                      <GlassCard key={f.id} className={`p-5 relative overflow-hidden ${isChosen ? 'ring-2 ring-indigo-500' : ''}`}>
                        {rec.isLessCrowded && (
                          <div className="absolute -right-8 top-4 bg-emerald-500 text-white text-[10px] font-bold py-1 px-8 rotate-45 shadow-sm">
                            Peu choisie
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-3" onClick={() => { setSelectedFiliere(f); setView('details'); }}>
                          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-100">{f.sigle}</span>
                          <div className="flex flex-col items-end gap-1 pr-6">
                            <div className="flex items-center bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200">
                              <Star className="w-3.5 h-3.5 mr-1 fill-slate-400 text-slate-400" /> Score: {rec.score}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${levelColor}`}>
                              {rec.niveau}
                            </span>
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-900 leading-tight mb-4" onClick={() => { setSelectedFiliere(f); setView('details'); }}>{f.nom_filiere}</h3>
                        
                        {/* Saturation & Chances Section */}
                        <div className="mb-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2">
                            <span>Saturation</span>
                            <span className={rec.chances! > 70 ? 'text-emerald-600' : rec.chances! > 30 ? 'text-amber-600' : 'text-rose-600'}>
                              {rec.chances}% de chances estimées
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, rec.saturation || 0)}%` }}
                              className={`h-full ${rec.saturation! > 90 ? 'bg-rose-500' : rec.saturation! > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Admis Officiels</p>
                              <p className="text-sm font-black text-slate-700">{f.admisOfficiels || (f.quotas.bourses + f.quotas.aides_partiellement_payant)}</p>
                            </div>
                            <div className="text-center border-l border-slate-200">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Inscrits Plateforme</p>
                              <p className="text-sm font-black text-indigo-600">{f.candidatsCount || 0}</p>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Advice */}
                        <div className="mb-4">
                          {rec.saturation! < 40 ? (
                            <p className="text-[11px] text-emerald-600 font-medium flex items-center bg-emerald-50 p-2 rounded-lg">
                              <TrendingUp className="w-3 h-3 mr-1.5" /> Filière peu saturée : vos chances sont excellentes !
                            </p>
                          ) : rec.saturation! < 80 ? (
                            <p className="text-[11px] text-amber-600 font-medium flex items-center bg-amber-50 p-2 rounded-lg">
                              <Compass className="w-3 h-3 mr-1.5" /> Compétition modérée : restez vigilant sur votre score.
                            </p>
                          ) : (
                            <p className="text-[11px] text-rose-600 font-medium flex items-center bg-rose-50 p-2 rounded-lg">
                              <ShieldAlert className="w-3 h-3 mr-1.5" /> Filière très demandée : assurez-vous d'un score solide.
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-end mt-2">
                          <div className="text-sm text-slate-500">
                            <p className="flex items-center"><Building2 className="w-3.5 h-3.5 mr-1.5"/> {f.universite}</p>
                          </div>
                          {userProfile && !userProfile.isLocked && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleChoice(f.id!); }}
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isChosen ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                            >
                              {isChosen ? 'Retirer' : 'Choisir'}
                            </button>
                          )}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* EXPLORE VIEW */}
          {view === 'explore' && (
            <motion.div key="explore" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}}>
              <h2 className="text-3xl font-display font-bold mb-6 text-slate-900">Explorer</h2>
              
              <div className="space-y-4 mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Rechercher une filière, un métier..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700" />
                </div>
                <select value={selectedUniversity} onChange={e => setSelectedUniversity(e.target.value)} className="w-full bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 appearance-none">
                  <option value="">Toutes les universités</option>
                  {allUniversities.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                {exploredFilieres.map(f => (
                  <GlassCard key={f.id} onClick={() => { setSelectedFiliere(f); setView('details'); }} className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">{f.sigle}</span>
                      <div className="flex gap-1">
                        {f.baccalaureats_recommandes.map(s => <span key={s} className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-bold">Série {s}</span>)}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight mb-2">{f.nom_filiere}</h3>
                    <div className="flex justify-between items-center text-sm text-slate-500">
                      <span className="flex items-center"><Building2 className="w-3.5 h-3.5 mr-1.5"/> {f.universite}</span>
                      <span className="flex items-center font-medium text-indigo-600"><Users className="w-3.5 h-3.5 mr-1.5"/> {f.candidatsCount || 0}</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {/* DETAILS VIEW */}
          {view === 'details' && selectedFiliere && (
            <motion.div key="details" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}>
              <button onClick={() => setView('explore')} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" /> Retour
              </button>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                  <span className="bg-white/20 px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md mb-4 inline-block border border-white/10">{selectedFiliere.sigle}</span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3 leading-tight">{selectedFiliere.nom_filiere}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center text-indigo-100 text-sm gap-2 sm:gap-4">
                    <span className="flex items-center"><Building2 className="w-4 h-4 mr-1.5" /> {selectedFiliere.universite}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {selectedFiliere.localisation}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center font-bold text-white"><Users className="w-4 h-4 mr-1.5" /> {selectedFiliere.candidatsCount || 0} candidats</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <GlassCard className="p-5 text-center">
                    <span className="block text-3xl font-display font-bold text-emerald-600 mb-1">{selectedFiliere.quotas.bourses}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bourses</span>
                  </GlassCard>
                  <GlassCard className="p-5 text-center">
                    <span className="block text-3xl font-display font-bold text-blue-600 mb-1">{selectedFiliere.quotas.aides_partiellement_payant}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aides / FPP</span>
                  </GlassCard>
                </div>

                <GlassCard className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center"><BookOpen className="w-5 h-5 mr-2 text-indigo-500"/> Matières Clés</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFiliere.matieres_cles.map(m => (
                      <span key={m} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-sm font-semibold border border-indigo-100">{m}</span>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center"><Compass className="w-5 h-5 mr-2 text-violet-500"/> Débouchés</h3>
                  <ul className="space-y-3">
                    {selectedFiliere.debouches.map((d, i) => (
                      <li key={i} className="flex items-start text-sm text-slate-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 mr-3 shrink-0" />
                        <span className="leading-relaxed">{d}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40">
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] flex justify-around items-center p-2">
          <NavItem icon={<Home className="w-5 h-5"/>} label="Accueil" active={view==='home'} onClick={()=>setView('home')} />
          <NavItem icon={<User className="w-5 h-5"/>} label="Profil" active={view==='profile'} onClick={()=>setView('profile')} />
          <NavItem icon={<TrendingUp className="w-5 h-5"/>} label="Résultats" active={view==='results'} onClick={()=>setView('results')} />
          <NavItem icon={<Search className="w-5 h-5"/>} label="Explorer" active={view==='explore'} onClick={()=>setView('explore')} />
        </div>
      </div>

      </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl max-w-md w-full p-6 border border-white/50">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Finaliser l'inscription</h2>
              <p className="text-slate-600 mb-6 text-sm">Veuillez entrer votre matricule ou nom complet pour finaliser votre compte.</p>
              <input 
                type="text" 
                placeholder="Matricule ou Nom complet" 
                value={matriculeInput} 
                onChange={e => setMatriculeInput(e.target.value)}
                className="w-full bg-white/50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 mb-4"
              />
              <button 
                onClick={handleCompleteRegistration}
                disabled={!matriculeInput.trim()}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Valider
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-white/50">
              <div className="p-6 flex justify-between items-center border-b border-slate-100">
                <h2 className="text-xl font-display font-bold flex items-center text-slate-900"><Info className="h-6 w-6 mr-2 text-indigo-600" /> Guide & Règles</h2>
                <button onClick={() => setShowInfo(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                  <h3 className="font-bold text-indigo-800 mb-2 flex items-center"><Info className="w-5 h-5 mr-2"/> Qu'est-ce qu'une allocation ?</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Une <strong>allocation</strong> désigne soit une <strong>Bourse</strong>, soit un <strong>Secours</strong> universitaire. Un étudiant allocataire bénéficie de l'un de ces deux statuts. <br/>
                    <span className="inline-block mt-2 font-medium text-rose-600">❌ Attention : On ne peut pas être allocataire dans deux filières à la fois !</span>
                  </p>
                </div>

                <section>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-emerald-500" /> Les Bourses (Écoles & Facultés)</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                      <h4 className="font-bold text-emerald-800 mb-1">Bourse en École</h4>
                      <p className="text-sm text-slate-600 font-medium text-emerald-600 mb-2">420 000 FCFA / an</p>
                      <p className="text-xs text-slate-600">Scolarité gratuite. Valable 3 ans (parfois 4 ans selon la filière).</p>
                    </div>
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                      <h4 className="font-bold text-emerald-800 mb-1">Bourse en Faculté</h4>
                      <p className="text-sm text-slate-600 font-medium text-emerald-600 mb-2">365 000 FCFA / an</p>
                      <p className="text-xs text-slate-600">Valable pendant les 3 ans du cycle de Licence.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center"><HelpCircle className="h-5 w-5 mr-2 text-blue-500" /> Secours et Titre Partiellement Payant</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                      <h4 className="font-bold text-blue-800 mb-1">Secours (Facultés)</h4>
                      <p className="text-sm text-slate-600 font-medium text-blue-600 mb-2">132 000 FCFA / an</p>
                      <p className="text-xs text-slate-600">Attribué uniquement dans les facultés classiques pour 3 ans.</p>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                      <h4 className="font-bold text-blue-800 mb-1">Titre Partiellement Payant</h4>
                      <p className="text-sm text-slate-600 font-medium text-blue-600 mb-2">Paiement d'un tiers (1/3)</p>
                      <p className="text-xs text-slate-600">L'équivalent du secours en école. L'étudiant ne reçoit pas d'argent, mais l'État paie les 2/3 de sa scolarité (qui coûte souvent +400 000F).</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center"><Target className="h-5 w-5 mr-2 text-indigo-500" /> Résumé du Guide 2025-2026</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <p className="text-sm font-bold text-slate-700 mb-2">Filières Publiques (250 au total)</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                        <p>• UAC : 97</p>
                        <p>• Parakou : 42</p>
                        <p>• UNSTIM : 45</p>
                        <p>• UNA : 46</p>
                        <p>• IUEP : 1</p>
                        <p>• Inter-États : 19</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-[10px] font-bold uppercase text-slate-400">
                        <span>Classement: 197 (79%)</span>
                        <span>Concours: 53 (21%)</span>
                      </div>
                    </div>

                    <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                      <p className="text-sm font-bold text-indigo-900 mb-2">Allocations (12 548 places)</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-indigo-700">Bourses</span>
                        <span className="text-sm font-black text-indigo-900">2 283</span>
                      </div>
                      <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-indigo-600" style={{width: '18.2%'}}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-indigo-700">Aides / FPP</span>
                        <span className="text-sm font-black text-indigo-900">10 265</span>
                      </div>
                      <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{width: '81.8%'}}></div>
                      </div>
                      <p className="text-[10px] text-indigo-500 mt-3 text-center italic">Pour 57 349 admis au BAC cette année.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-amber-500" /> Le Mythe des Mentions (Très Important)</h3>
                  <div className="space-y-3 text-sm text-slate-600 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                    <p><strong>Mention Bien ≠ Bourse garantie :</strong> Si vous choisissez une filière qui exige de fortes notes dans des matières où vous avez été faible, vous risquez de ne pas être classé, malgré votre mention Bien.</p>
                    <p><strong>Mentions Passable / Assez Bien / Oral :</strong> Ne vous découragez pas ! Vous avez toutes vos chances d'obtenir une bourse ou un secours si vous faites des <strong>choix stratégiques</strong> alignés avec vos meilleures notes.</p>
                    <p className="font-medium text-amber-800 mt-2">💡 Tout dépend du CHOIX que vous opérez sur la plateforme. C'est le but de cette application : vous aider à faire le bon choix !</p>
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showStats && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-white/50">
              <div className="p-6 flex justify-between items-center border-b border-slate-100">
                <h2 className="text-xl font-display font-bold flex items-center text-slate-900"><BarChart3 className="h-6 w-6 mr-2 text-indigo-600" /> Statistiques</h2>
                <button onClick={() => setShowStats(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Répartition par Université</h3>
                  <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={universityStats} margin={{top:10,right:10,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{borderRadius:'16px',border:'none',boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/><Legend wrapperStyle={{fontSize:'12px',paddingTop:'10px'}}/><Bar dataKey="Bourses" fill="#059669" radius={[4,4,0,0]}/><Bar dataKey="Aides" fill="#2563eb" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Top 5 Filières (Bourses)</h3>
                  <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={topFilieresBourses} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/><XAxis type="number" tick={{fontSize:10}}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={80}/><Tooltip formatter={(v:number)=>[v,'Bourses']} labelFormatter={(l:string,p:any[])=>p[0]?.payload.full_name||l} contentStyle={{borderRadius:'16px',border:'none',boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/><Bar dataKey="Bourses" fill="#d97706" radius={[0,4,4,0]}>{topFilieresBourses.map((e,i)=><Cell key={`cell-${i}`} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Top 5 Filières les plus demandées</h3>
                  <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={topFilieresDemandees} layout="vertical" margin={{top:0,right:10,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/><XAxis type="number" tick={{fontSize:10}}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={80}/><Tooltip formatter={(v:number)=>[v,'Candidats']} labelFormatter={(l:string,p:any[])=>p[0]?.payload.full_name||l} contentStyle={{borderRadius:'16px',border:'none',boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/><Bar dataKey="Candidats" fill="#4f46e5" radius={[0,4,4,0]}>{topFilieresDemandees.map((e,i)=><Cell key={`cell-${i}`} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
