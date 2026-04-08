import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Search, Building2, Calculator, BookOpen, 
  Info, X, AlertTriangle, CheckCircle2, BarChart3, ChevronRight, 
  ArrowLeft, Star, TrendingUp, Compass, User, Home, MapPin, ArrowRight, Settings, HelpCircle, Target, Zap, Lock, LogOut, Users, ShieldAlert, Shield, ShieldCheck, ArrowUpRight, Mail
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getAllFilieres, getAppData } from './utils';
import { FlattenedFiliere, UserProfile, GuideData } from './types';
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

// Custom Logo Component
const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="100" height="100" rx="24" fill="#4f46e5" />
    <path d="M20 45L50 28L80 45L50 62L20 45Z" fill="white" />
    <path d="M32 52V68C32 68 42 78 50 78C58 78 68 68 68 68V52" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="80" cy="58" r="5" fill="#f59e0b" />
    <path d="M80 45V58" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#059669', '#d97706'];

export default function App() {
  const [view, setView] = useState<'home' | 'profile' | 'results' | 'explore' | 'details' | 'admin' | 'guide' | 'about' | 'faq' | 'blog'>('home');
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
            // Check if this is the designated admin
            if (user.email === 'elfridw4@gmail.com') {
              const adminProfile: UserProfile = {
                uid: user.uid,
                matricule: 'ADMIN',
                nomComplet: user.displayName || 'Admin',
                email: user.email || '',
                role: 'super_admin',
                isLocked: false,
                isDeleted: false,
                serie: '',
                grades: {},
                choices: [],
                allocationStatus: 'none'
              };
              await createUserProfile(adminProfile);
              setUserProfile(adminProfile);
            } else {
              setShowAuthModal(true); // Need matricule to complete registration
            }
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
      // Connection test
      const testConnection = async () => {
        try {
          const { getDocFromServer, doc } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          await getDocFromServer(doc(db, 'test', 'connection'));
          console.log("Firestore connection successful");
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration. The client is offline.");
          }
        }
      };
      testConnection();

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
      if (!profile && user.email !== 'elfridw4@gmail.com') {
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

  const appData = useMemo(() => getAppData(), []);
  const stats = appData.metadata.stats_globales;

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
    <div className="min-h-screen text-slate-800 font-sans selection:bg-indigo-200">
      <AnimatePresence mode="wait">
        {view === 'admin' ? (
          <motion.div key="admin-view" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Admin onBack={() => setView('home')} />
          </motion.div>
        ) : (
          <motion.div key="main-app" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            {/* Warning Banner (Full Width Top) */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#ff8a00] text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm font-medium shadow-md gap-2 sm:gap-4">
              <div className="flex items-center text-center">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0 text-yellow-300" />
                <span>Ce site propose des recommandations IA — ce n'est pas le site officiel.</span>
              </div>
              <a href="https://apresmonbac.bj/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#ff8a00] bg-white hover:bg-slate-50 px-3 py-1 rounded-full font-bold transition-colors shadow-sm whitespace-nowrap">
                Site officiel <ArrowUpRight className="w-4 h-4 ml-1" />
              </a>
            </div>

            {/* Top Header */}
            <header className="fixed top-16 sm:top-12 left-0 right-0 z-40 p-4">
              <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-3xl px-5 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Logo className="w-8 h-8 drop-shadow-md" />
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
      <main className="pt-36 w-full">
        <AnimatePresence mode="wait">
          
          {/* HOME VIEW (LANDING PAGE) */}
          {view === 'home' && (
            <motion.div key="home" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="flex flex-col items-center mt-4">
              
              {/* Hero Section */}
              <div className="text-center mb-12 w-full">
                <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                  <Logo className="w-24 h-24 drop-shadow-2xl" />
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

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm font-medium text-slate-600">
                  <div className="flex items-center bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/60 shadow-sm">
                    <Zap className="w-4 h-4 text-amber-500 mr-1.5" /> Résultats instantanés
                  </div>
                  <div className="flex items-center bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/60 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1.5" /> Données officielles
                  </div>
                  <div className="flex items-center bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/60 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 mr-1.5" /> 100% Gratuit
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
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

              {/* News Section */}
              <div className="w-full max-w-2xl mb-12">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-amber-500" /> Dernières Actualités
                </h3>
                <div className="space-y-3">
                  <div className="bg-white/40 border border-white/50 p-4 rounded-2xl flex gap-4 items-start">
                    <div className="bg-indigo-100 p-2 rounded-lg shrink-0">
                      <Info className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Guide d'orientation 2025-2026 disponible</p>
                      <p className="text-xs text-slate-500 mt-1">Les données ont été mises à jour avec les 545 filières (250 publiques, 185 privées agréées, 110 privées en régime ouverture).</p>
                    </div>
                  </div>
                  <div className="bg-white/40 border border-white/50 p-4 rounded-2xl flex gap-4 items-start">
                    <div className="bg-emerald-100 p-2 rounded-lg shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Ouverture de la plateforme</p>
                      <p className="text-xs text-slate-500 mt-1">Vous pouvez désormais simuler vos choix et consulter le taux de saturation en temps réel.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dark Footer (Full Width) */}
              <div className="w-full bg-[#0f172a] text-slate-400 py-12 px-4 sm:px-8 mt-12 pb-32">
                <div className="max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                    <div className="col-span-1 md:col-span-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <Logo className="w-8 h-8" />
                        <span className="font-display font-bold text-xl text-white">OrientaBénin</span>
                      </div>
                      <p className="text-sm leading-relaxed mb-6 max-w-sm text-slate-400">
                        Votre assistant d'orientation universitaire au Bénin. Basé sur l'algorithme de classement et les données officielles du Ministère.
                      </p>
                      <button onClick={() => setView('profile')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center w-fit shadow-lg shadow-indigo-500/20">
                        Commencer gratuitement <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-bold text-xs tracking-widest uppercase mb-5">Navigation</h4>
                      <ul className="space-y-3 text-sm">
                        <li><button onClick={() => setView('home')} className="hover:text-indigo-400 transition-colors">Accueil</button></li>
                        <li><button onClick={() => setView('profile')} className="hover:text-indigo-400 transition-colors">Simulation</button></li>
                        <li><button onClick={() => setView('guide')} className="hover:text-indigo-400 transition-colors">Guide</button></li>
                        <li><button onClick={() => setView('blog')} className="hover:text-indigo-400 transition-colors">Blog</button></li>
                        <li><button onClick={() => setView('faq')} className="hover:text-indigo-400 transition-colors">FAQ</button></li>
                        <li><button onClick={() => setView('about')} className="hover:text-indigo-400 transition-colors">À propos</button></li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-white font-bold text-xs tracking-widest uppercase mb-5">Contact</h4>
                      <ul className="space-y-4 text-sm">
                        <li className="flex items-center"><Mail className="w-4 h-4 mr-3 text-slate-500" /> support@orientabenin.bj</li>
                        <li className="flex items-center"><MapPin className="w-4 h-4 mr-3 text-slate-500" /> Cotonou, Bénin</li>
                      </ul>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs">
                    <p>© 2026 OrientaBénin — Tous droits réservés.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PROFILE VIEW */}
          {view === 'profile' && (
            <motion.div key="profile" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="max-w-3xl mx-auto px-4 w-full pb-32">
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
                    <>
                      <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl mb-4">
                        <p className="text-sm text-indigo-800 font-medium flex items-start">
                          <Shield className="w-5 h-5 mr-2 shrink-0 text-indigo-600 mt-0.5" />
                          <span>
                            Vos données sont utilisées pour calculer vos chances d’admission et améliorer les recommandations pour tous les bacheliers. Toutes les informations partagées sont <strong>anonymisées</strong>.
                            <br/><span className="font-bold mt-1 inline-block text-indigo-900">🔥 Plus vous êtes nombreux, plus les recommandations sont précises.</span>
                          </span>
                        </p>
                      </div>
                      <button onClick={() => { handleSaveProfile(); setView('results'); }} disabled={!selectedSerie} className={`w-full rounded-2xl py-4 font-semibold shadow-xl transition-all flex justify-center items-center mb-4 ${selectedSerie ? 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 shadow-slate-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                        Enregistrer et voir les recommandations <ArrowRight className="ml-2 w-5 h-5" />
                      </button>
                    </>
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
            <motion.div key="results" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="max-w-3xl mx-auto px-4 w-full pb-32">
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
            <motion.div key="explore" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="max-w-3xl mx-auto px-4 w-full pb-32">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-display font-bold text-slate-900">Explorer</h2>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border border-indigo-200">Guide 2025-2026</span>
              </div>

              {/* Tableau de Bord National */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-white/60 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Filières</p>
                  <p className="text-xl font-black text-slate-800">{stats?.total_filieres || 545}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Allocations</p>
                  <p className="text-xl font-black text-indigo-600">{stats?.total_allocations?.toLocaleString() || '12 548'}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bourses</p>
                  <p className="text-xl font-black text-emerald-600">{stats?.bourses?.toLocaleString() || '2 283'}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Aides/FPP</p>
                  <p className="text-xl font-black text-blue-600">{stats?.aides_fpp?.toLocaleString() || '10 265'}</p>
                </div>
              </div>

              {/* Répartition par Secteur */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Secteur Public</p>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">250</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-tight">UAC (97), Parakou (42), UNSTIM (45), UNA (46), Inter-États (19), IUEP (1)</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase">Privé (Agréé)</p>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">185</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-tight">Banque-Finance, Génie Civil, Journalisme, etc.</p>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold text-amber-400 uppercase">Privé (Ouverture)</p>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">110</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-tight">Tourisme, Intelligence Artificielle, Agroalimentaire, etc.</p>
                </div>
              </div>
              
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
            <motion.div key="details" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="max-w-3xl mx-auto px-4 w-full pb-32">
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

                {/* Statistiques Anonymisées */}
                <GlassCard className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-indigo-500"/> Profil des Candidats (Anonymisé)</h3>
                  {selectedFiliere.candidatsCount && selectedFiliere.candidatsCount > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-medium text-slate-600">Moyenne générale estimée</span>
                        <span className="text-lg font-black text-indigo-600">{selectedFiliere.stats_anonymes?.moyenne_generale?.toFixed(1) || '--'}/20</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Répartition des mentions</p>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                            <span className="block text-xs font-bold text-emerald-700 mb-1">TB</span>
                            <span className="text-sm font-black text-emerald-900">{selectedFiliere.stats_anonymes?.mentions?.tres_bien || 0}</span>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <span className="block text-xs font-bold text-blue-700 mb-1">B</span>
                            <span className="text-sm font-black text-blue-900">{selectedFiliere.stats_anonymes?.mentions?.bien || 0}</span>
                          </div>
                          <div className="text-center p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                            <span className="block text-xs font-bold text-indigo-700 mb-1">AB</span>
                            <span className="text-sm font-black text-indigo-900">{selectedFiliere.stats_anonymes?.mentions?.assez_bien || 0}</span>
                          </div>
                          <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="block text-xs font-bold text-slate-600 mb-1">P</span>
                            <span className="text-sm font-black text-slate-800">{selectedFiliere.stats_anonymes?.mentions?.passable || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic text-center py-4">Soyez le premier à choisir cette filière pour générer des statistiques !</p>
                  )}
                </GlassCard>

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

          {/* GUIDE VIEW */}
          {view === 'guide' && (
            <motion.div key="guide" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="pb-32 max-w-3xl mx-auto px-4 w-full">
              <div className="mb-8">
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">Guide complet 2025-2026</span>
                <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-4 tracking-tight">
                  Orientation universitaire au Bénin : le guide définitif
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Tout ce que les bacheliers béninois doivent savoir pour choisir leur filière. Universités, séries, critères d'admission, bourses, inscription.
                </p>
              </div>

              {/* Sommaire */}
              <GlassCard className="p-6 mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sommaire</h3>
                <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                  <a href="#systeme" className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3">1</span>
                    Le système universitaire béninois
                  </a>
                  <a href="#universites" className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3">2</span>
                    Les universités publiques
                  </a>
                  <a href="#bourses" className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3">3</span>
                    Bourse, Secours, FPP et FEP
                  </a>
                  <a href="#mentions" className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3">4</span>
                    Le mythe des mentions
                  </a>
                  <a href="#choisir" className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3">5</span>
                    Comment bien choisir sa filière
                  </a>
                </div>
              </GlassCard>

              {/* Contenu du Guide */}
              <div className="space-y-12">
                
                <section id="systeme">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center"><Info className="w-6 h-6 mr-2 text-indigo-600"/> 1. Qu'est-ce qu'une allocation ?</h3>
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 mb-4">
                    <p className="text-slate-700 leading-relaxed">
                      Une <strong>allocation</strong> désigne soit une <strong>Bourse</strong>, soit un <strong>Secours</strong> universitaire. Un étudiant allocataire bénéficie de l'un de ces deux statuts. <br/>
                      <span className="inline-block mt-3 font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">❌ Attention : On ne peut pas être allocataire dans deux filières à la fois !</span>
                    </p>
                  </div>
                </section>

                <section id="universites">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center"><Target className="w-6 h-6 mr-2 text-indigo-600"/> 2. Répartition des 545 Filières (2025-2026)</h3>
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-bold text-slate-800">Établissements Publics</p>
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">250 filières</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-slate-600 mb-3">
                        <p>• UAC : 97</p>
                        <p>• Parakou : 42</p>
                        <p>• UNSTIM : 45</p>
                        <p>• UNA : 46</p>
                        <p>• Inter-États : 19</p>
                        <p>• IUEP : 1</p>
                      </div>
                      <p className="text-xs text-slate-400 italic">Source : Pages 16-68 du guide officiel.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-bold text-slate-800">Établissements Privés Agréés</p>
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">185 filières</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">Exemples : Banque-Finance (ESGIS, ISEG), Génie Civil (ESGC), Journalisme (HEGI, ISMA).</p>
                      <p className="text-xs text-slate-400 italic">Source : Pages 73-81 du guide officiel.</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-bold text-slate-800">Établissements Privés (Régime Ouverture)</p>
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">110 filières</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">Exemples : Tourisme (CET AAT-IPAAM), IA (ESEP LE BERGER), Agroalimentaire (ESCAE).</p>
                      <p className="text-xs text-slate-400 italic">Source : Pages 82-85 du guide officiel.</p>
                    </div>
                  </div>
                </section>

                <section id="bourses">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center"><CheckCircle2 className="w-6 h-6 mr-2 text-emerald-500"/> 3. Bourses, Secours et FPP</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-slate-800 mb-3">Les Bourses (Écoles & Facultés)</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                          <h5 className="font-bold text-emerald-800 mb-1">Bourse en École</h5>
                          <p className="text-lg font-black text-emerald-600 mb-2">420 000 FCFA / an</p>
                          <p className="text-sm text-slate-600">Scolarité gratuite. Valable 3 ans (parfois 4 ans selon la filière).</p>
                        </div>
                        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                          <h5 className="font-bold text-emerald-800 mb-1">Bourse en Faculté</h5>
                          <p className="text-lg font-black text-emerald-600 mb-2">365 000 FCFA / an</p>
                          <p className="text-sm text-slate-600">Valable pendant les 3 ans du cycle de Licence.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 mb-3">Secours et Titre Partiellement Payant</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                          <h5 className="font-bold text-blue-800 mb-1">Secours (Facultés)</h5>
                          <p className="text-lg font-black text-blue-600 mb-2">132 000 FCFA / an</p>
                          <p className="text-sm text-slate-600">Attribué uniquement dans les facultés classiques pour 3 ans.</p>
                        </div>
                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                          <h5 className="font-bold text-blue-800 mb-1">Titre Partiellement Payant (FPP)</h5>
                          <p className="text-lg font-black text-blue-600 mb-2">Paiement d'un tiers (1/3)</p>
                          <p className="text-sm text-slate-600">L'équivalent du secours en école. L'étudiant ne reçoit pas d'argent, mais l'État paie les 2/3 de sa scolarité.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="mentions">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center"><AlertTriangle className="w-6 h-6 mr-2 text-rose-500"/> 4. Le Mythe des Mentions</h3>
                  <div className="bg-rose-50/80 p-6 rounded-2xl border border-rose-100">
                    <p className="text-slate-700 mb-4 leading-relaxed">
                      Beaucoup d'étudiants pensent que la mention au BAC (Assez-Bien, Bien, Très-Bien) garantit automatiquement une bourse. <strong>C'est faux.</strong>
                    </p>
                    <ul className="space-y-3 mb-4">
                      <li className="flex items-start text-sm text-slate-700">
                        <span className="text-rose-500 mr-2 font-bold">1.</span>
                        <span>L'attribution se fait par <strong>classement</strong> (moyenne pondérée) parmi les candidats qui ont choisi la filière, dans la limite des quotas.</span>
                      </li>
                      <li className="flex items-start text-sm text-slate-700">
                        <span className="text-rose-500 mr-2 font-bold">2.</span>
                        <span>Si une filière a 10 bourses et que 15 candidats avec mention "Très Bien" postulent, 5 d'entre eux n'auront pas la bourse.</span>
                      </li>
                    </ul>
                    <div className="bg-white p-4 rounded-xl border border-rose-100 text-sm text-slate-600 italic">
                      "Il vaut mieux choisir stratégiquement une filière moins demandée où ses notes fortes correspondent aux matières clés, plutôt que de viser aveuglément les filières saturées."
                    </div>
                  </div>
                </section>

              </div>
            </motion.div>
          )}

          {/* ABOUT VIEW */}
          {view === 'about' && (
            <motion.div key="about" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="pb-32 max-w-3xl mx-auto px-4 w-full">
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-4 tracking-tight">
                  À propos d'OrientaBénin
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Notre mission est de démocratiser l'accès à l'information d'orientation pour tous les bacheliers béninois.
                </p>
              </div>

              <div className="space-y-6">
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center"><Target className="w-5 h-5 mr-2 text-indigo-600"/> Notre Vision</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Chaque année, des milliers de bacheliers font des choix d'orientation par défaut ou par manque d'information, ce qui conduit à des échecs ou des réorientations tardives. OrientaBénin vise à résoudre ce problème en fournissant un outil intelligent, transparent et basé sur les données officielles du Ministère de l'Enseignement Supérieur et de la Recherche Scientifique (MESRS).
                  </p>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center"><Zap className="w-5 h-5 mr-2 text-amber-500"/> Comment ça marche ?</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Notre algorithme de recommandation utilise la formule officielle de calcul de la moyenne pondérée pour chaque filière. Il croise vos notes du BAC avec les exigences spécifiques (matières clés) et les quotas disponibles pour vous donner une estimation réaliste de vos chances d'obtenir une bourse ou un secours.
                  </p>
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-sm text-indigo-800 font-medium">
                      <strong>Important :</strong> Nous ne sommes pas affiliés au gouvernement. Notre outil est une aide à la décision. Les résultats finaux dépendent du classement officiel national.
                    </p>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-emerald-500"/> 100% Béninois</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Conçu par et pour des Béninois, OrientaBénin comprend les réalités locales (Bourses, Secours, Titre Partiellement Payant) et s'adapte aux spécificités de notre système éducatif.
                  </p>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* FAQ VIEW */}
          {view === 'faq' && (
            <motion.div key="faq" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="pb-32 max-w-3xl mx-auto px-4 w-full">
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-4 tracking-tight">
                  Foire Aux Questions
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Les réponses aux questions les plus fréquentes sur l'orientation et l'utilisation de la plateforme.
                </p>
              </div>

              <div className="space-y-4">
                <GlassCard className="p-6">
                  <h3 className="font-bold text-slate-900 mb-2">Comment est calculée ma moyenne pondérée ?</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    La moyenne pondérée est calculée en multipliant vos notes dans les matières clés par leurs coefficients respectifs, puis en divisant par la somme des coefficients. Notre algorithme simule ce calcul pour chaque filière.
                  </p>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="font-bold text-slate-900 mb-2">Une mention "Très Bien" garantit-elle une bourse ?</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Non. L'attribution des bourses se fait par classement selon la moyenne pondérée dans la limite des quotas disponibles pour la filière choisie. Si vous choisissez une filière très demandée où vos notes dans les matières clés sont faibles, vous pouvez ne pas être classé malgré une bonne mention générale.
                  </p>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="font-bold text-slate-900 mb-2">Quelle est la différence entre Bourse et Secours ?</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    La Bourse (en école ou faculté) couvre entièrement la scolarité et offre une allocation mensuelle plus élevée. Le Secours (uniquement en faculté) offre une aide financière moindre. Le Titre Partiellement Payant (FPP) signifie que l'État paie une partie (généralement 2/3) de votre scolarité en école.
                  </p>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="font-bold text-slate-900 mb-2">Mes données sont-elles sécurisées ?</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Oui. Vos notes et choix de filières sont utilisés uniquement pour générer vos recommandations et calculer des statistiques globales anonymisées (comme le nombre de candidats par filière). Aucune donnée personnelle n'est partagée publiquement.
                  </p>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* BLOG VIEW */}
          {view === 'blog' && (
            <motion.div key="blog" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="pb-32 max-w-3xl mx-auto px-4 w-full">
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-4 tracking-tight">
                  Blog & Actualités
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Conseils, astuces et dernières nouvelles sur l'orientation universitaire au Bénin.
                </p>
              </div>

              <div className="grid gap-6">
                <GlassCard className="p-0 overflow-hidden flex flex-col sm:flex-row">
                  <div className="sm:w-1/3 h-48 sm:h-auto bg-indigo-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-12 h-12 text-indigo-300" />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 block">Conseils</span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Comment bien choisir ses 3 filières ?</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      Découvrez notre stratégie en 3 étapes pour maximiser vos chances d'obtenir une allocation de l'État tout en poursuivant vos passions.
                    </p>
                    <button className="text-indigo-600 font-medium text-sm flex items-center hover:text-indigo-800 transition-colors">
                      Lire l'article <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </GlassCard>

                <GlassCard className="p-0 overflow-hidden flex flex-col sm:flex-row">
                  <div className="sm:w-1/3 h-48 sm:h-auto bg-emerald-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-12 h-12 text-emerald-300" />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 block">Universités</span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Zoom sur les Écoles Inter-États</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      EAMAU, EIER, ETSHER... Que valent ces écoles ? Comment y accéder et quels sont les avantages par rapport aux universités nationales ?
                    </p>
                    <button className="text-indigo-600 font-medium text-sm flex items-center hover:text-indigo-800 transition-colors">
                      Lire l'article <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
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
          <NavItem icon={<BookOpen className="w-5 h-5"/>} label="Guide" active={view==='guide'} onClick={()=>setView('guide')} />
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
              <p className="text-slate-600 mb-4 text-sm">Veuillez entrer votre matricule ou nom complet pour finaliser votre compte.</p>
              
              <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl mb-6">
                <p className="text-xs text-indigo-800 font-medium flex items-start">
                  <Shield className="w-4 h-4 mr-2 shrink-0 text-indigo-600 mt-0.5" />
                  <span>
                    Vos données sont utilisées pour calculer vos chances d’admission et améliorer les recommandations pour tous les bacheliers. Toutes les informations partagées sont <strong>anonymisées</strong>.
                  </span>
                </p>
              </div>

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
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center"><Target className="h-5 w-5 mr-2 text-indigo-500" /> Répartition des 545 Filières (Guide 2025-2026)</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-bold text-slate-700">1. Établissements Publics</p>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">250 filières</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 mb-2">
                        <p>• UAC : 97</p>
                        <p>• Parakou : 42</p>
                        <p>• UNSTIM : 45</p>
                        <p>• UNA : 46</p>
                        <p>• Inter-États : 19</p>
                        <p>• IUEP : 1</p>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">Source : Pages 16-68 du guide officiel.</p>
                    </div>

                    <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-bold text-emerald-900">2. Établissements Privés (Agréés)</p>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">185 filières</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2"><strong>Exemples :</strong> Licence en Banque-Finance (ESGIS, ISEG), Génie Civil (ESGC), Journalisme (HEGI, ISMA).</p>
                      <p className="text-[10px] text-emerald-500 italic">Source : Pages 73-81 (Section IX).</p>
                    </div>

                    <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-bold text-amber-900">3. Établissements Privés (Régime Ouverture)</p>
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">110 filières</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2"><strong>Exemples :</strong> Licence en Tourisme (CET AAT-IPAAM), Intelligence Artificielle (ESEP LE BERGER), Agroalimentaire (ESCAE).</p>
                      <p className="text-[10px] text-amber-500 italic">Source : Pages 82-85 (Section X).</p>
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
