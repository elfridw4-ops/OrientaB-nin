import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Search, Building2, Calculator, BookOpen, 
  Info, X, AlertTriangle, CheckCircle2, BarChart3, ChevronRight, 
  ArrowLeft, Star, TrendingUp, Compass, User, Home, MapPin, ArrowRight, Settings, HelpCircle, Target, Zap, Lock, LogOut, Users, ShieldAlert, Shield, ShieldCheck, ArrowUpRight, Mail, Rocket, Heart, Sparkles, Code2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getFallbackAppData, getAllFilieres } from './utils';
import { FlattenedFiliere, UserProfile, GuideData } from './types';
import { 
  calculerScore, 
  filtrerParSerie, 
  genererRecommandations, 
  rechercherFilieres, 
  ResultatRecommandation 
} from './engine';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getUserProfile, createUserProfile, updateUserProfile, updateFiliereChoices, fetchLatestCatalog } from './services/firestoreService';
import seriesBacData from './data/series_bac.json';
import demarchesData from './data/demarches.json';

// Lazy load heavy components
const Admin = React.lazy(() => import('./Admin'));

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

const NavItem = ({ icon, label, active, to }: any) => (
  <Link to={to} className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all ${active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}>
    {icon}
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </Link>
);

const GlassCard = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''} ${className}`}>
    {children}
  </div>
);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const viewMap: Record<string, string> = {
    '/': 'home',
    '/simulation': 'profile',
    '/resultats': 'results',
    '/explorer': 'explore',
    '/details': 'details',
    '/admin': 'admin',
    '/guide': 'guide',
    '/a-propos': 'about',
    '/faq': 'faq',
    '/conseils': 'blog',
    '/conseils/metiers-avenir': 'article-metiers',
    '/cgu': 'cgu',
    '/confidentialite': 'privacy',
    '/mentions-legales': 'legal'
  };
  
  const reverseViewMap: Record<string, string> = {
    'home': '/',
    'profile': '/simulation',
    'results': '/resultats',
    'explore': '/explorer',
    'details': '/details',
    'admin': '/admin',
    'guide': '/guide',
    'about': '/a-propos',
    'faq': '/faq',
    'blog': '/conseils',
    'article-metiers': '/conseils/metiers-avenir',
    'cgu': '/cgu',
    'privacy': '/confidentialite',
    'legal': '/mentions-legales'
  };

  const view = viewMap[location.pathname] || 'home';
  const setView = (v: string) => navigate(reverseViewMap[v] || '/');

  const getHelmetData = (v: string) => {
    switch(v) {
      case 'home': return { title: "OrientaBénin | Faites le meilleur choix pour votre avenir universitaire", desc: "Bacheliers béninois, simulez vos chances d'obtenir une bourse ou un secours du MESRS. Découvrez les filières universitaires et faites des choix stratégiques." };
      case 'profile': return { title: "Simulation | OrientaBénin", desc: "Saisissez vos notes pour simuler vos chances d'admission et de bourse." };
      case 'results': return { title: "Résultats | OrientaBénin", desc: "Découvrez les filières recommandées selon votre profil." };
      case 'explore': return { title: "Explorer les filières | OrientaBénin", desc: "Consultez le catalogue complet des universités et filières du Bénin." };
      case 'guide': return { title: "Guide d'orientation | OrientaBénin", desc: "Comprendre les bourses, secours et règles d'orientation au Bénin." };
      case 'blog': return { title: "Conseils | OrientaBénin", desc: "Conseils et astuces pour réussir son orientation universitaire." };
      case 'article-metiers': return { title: "Les métiers les plus recherchés au Bénin | OrientaBénin", desc: "Découvrez la liste détaillée et dynamique des métiers les plus recherchés au Bénin par secteur." };
      case 'cgu': return { title: "CGU | OrientaBénin", desc: "Conditions Générales d'Utilisation d'OrientaBénin." };
      case 'privacy': return { title: "Confidentialité | OrientaBénin", desc: "Politique de confidentialité d'OrientaBénin." };
      case 'legal': return { title: "Mentions Légales | OrientaBénin", desc: "Mentions légales d'OrientaBénin." };
      case 'admin': return { title: "Administration | OrientaBénin", desc: "Gestion de la plateforme." };
      default: return { title: "OrientaBénin", desc: "Orientation universitaire au Bénin." };
    }
  };
  const helmetData = getHelmetData(view);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "OrientaBénin",
    "url": "https://orientabenin.com",
    "description": "Simulation d'orientation et de bourses pour les bacheliers du Bénin."
  };

  const [allFilieres, setAllFilieres] = useState<FlattenedFiliere[]>([]);
  
  // Sync Catalog from Firestore on load
  useEffect(() => {
    const syncCatalog = async () => {
      try {
        const TTL_MS = 60 * 60 * 1000; // 1 hour
        const cachedStr = localStorage.getItem('catalog_cache');
        const cachedTime = localStorage.getItem('catalog_cache_time');
        
        if (cachedStr && cachedTime && (Date.now() - parseInt(cachedTime)) < TTL_MS) {
          setAllFilieres(JSON.parse(cachedStr));
          return;
        }

        const remote = await fetchLatestCatalog();
        if (remote && remote.data) {
          localStorage.setItem('catalog_cache', JSON.stringify(remote.data));
          localStorage.setItem('catalog_cache_time', Date.now().toString());
          setAllFilieres(remote.data);
          console.log("Catalogue mis à jour depuis le serveur.");
        } else {
          setAllFilieres(getAllFilieres()); // fallback to local mock
        }
      } catch (e) {
        console.error("Erreur lors de la synchronisation du catalogue", e);
        setAllFilieres(getAllFilieres()); // fallback
      }
    };
    syncCatalog();
  }, []);
  
  // Auth State
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [matriculeInput, setMatriculeInput] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer');
    if (!hasSeenDisclaimer) {
      setShowDisclaimerModal(true);
    }
  }, []);

  const acceptDisclaimer = () => {
    localStorage.setItem('hasSeenDisclaimer', 'true');
    setShowDisclaimerModal(false);
  };

  const [selectedSerie, setSelectedSerie] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedFiliere, setSelectedFiliere] = useState<FlattenedFiliere | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [grades, setGrades] = useState<Record<string, number>>({});

  const requiredSubjects = useMemo(() => {
    if (!selectedSerie) return [];
    
    // Find the selected series in the BAC data
    const serieData = seriesBacData.series.find(s => s.code === selectedSerie);
    if (serieData && serieData.epreuves.premier_groupe.ecrit) {
      return serieData.epreuves.premier_groupe.ecrit.map(e => e.matiere).sort();
    }
    
    // Fallback to the old method if series not found in JSON
    const filieres = allFilieres.filter(f => f.baccalaureats_recommandes.includes(selectedSerie));
    const subjects = new Set<string>();
    filieres.forEach(f => {
      f.matieres.forEach(m => subjects.add(m.nom));
    });
    return Array.from(subjects).sort();
  }, [selectedSerie, allFilieres]);

  const bacAverage = useMemo(() => {
    if (!selectedSerie) return null;
    const serieData = seriesBacData.series.find(s => s.code === selectedSerie);
    if (!serieData || !serieData.epreuves.premier_groupe.ecrit) return null;
    
    let totalPoints = 0;
    let totalCoeffs = 0;
    let hasAllGrades = true;

    serieData.epreuves.premier_groupe.ecrit.forEach(epreuve => {
      const grade = grades[epreuve.matiere];
      if (grade === undefined || grade === null || isNaN(grade)) {
        hasAllGrades = false;
      } else {
        totalPoints += grade * epreuve.coefficient;
        totalCoeffs += epreuve.coefficient;
      }
    });

    if (totalCoeffs === 0) return null;
    return {
      average: (totalPoints / totalCoeffs).toFixed(2),
      isComplete: hasAllGrades
    };
  }, [selectedSerie, grades]);

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
  }, []);

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

  const appData = useMemo(() => getFallbackAppData(), []);
  const stats = useMemo(() => {
    const total_filieres = allFilieres.length;
    const bourses = allFilieres.reduce((sum, f) => sum + (f.bourses || f.quotas?.bourses || 0), 0);
    const aides_fpp = allFilieres.reduce((sum, f) => sum + (f.aides || f.quotas?.aides_fpp || 0), 0);
    const total_allocations = bourses + aides_fpp;
    return { total_filieres, bourses, aides_fpp, total_allocations };
  }, [allFilieres]);

  const statsSecteurs = useMemo(() => {
    const counts: Record<string, number> = {};
    allFilieres.forEach(f => {
      const type = f.type_universite || 'Inconnu';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allFilieres]);

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
    Bourses: allFilieres.filter(f => f.universite === uni).reduce((s, f) => s + (f.quotas?.bourses || 0), 0),
    Aides: allFilieres.filter(f => f.universite === uni).reduce((s, f) => s + (f.quotas?.aides_fpp || 0), 0)
  })), [allUniversities, allFilieres]);

  const topFilieresBourses = useMemo(() => [...allFilieres]
    .sort((a, b) => (b.quotas?.bourses || 0) - (a.quotas?.bourses || 0)).slice(0, 5)
    .map(f => ({ name: f.sigle || f.nom_filiere.substring(0, 15) + '...', Bourses: f.quotas?.bourses || 0, full_name: f.nom_filiere })), [allFilieres]);

  const topFilieresDemandees = useMemo(() => [...allFilieres]
    .sort((a, b) => (b.candidatsCount || 0) - (a.candidatsCount || 0)).slice(0, 5)
    .map(f => ({ name: f.sigle || f.nom_filiere.substring(0, 15) + '...', Candidats: f.candidatsCount || 0, full_name: f.nom_filiere })), [allFilieres]);

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
      <Helmet>
        <title>{helmetData.title}</title>
        <meta name="description" content={helmetData.desc} />
        <meta name="author" content="Aurion Labs-G" />
        <meta name="publisher" content="Aurion Labs-G" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
      <AnimatePresence mode="wait">
        {view === 'admin' ? (
          <motion.div key="admin-view" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div>}>
              <Admin onBack={() => setView('home')} />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div key="main-app" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 z-40 p-4">
              <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-3xl px-5 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {view !== 'home' && (
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/50 hover:bg-white rounded-xl transition-colors text-slate-600 mr-1" aria-label="Retour">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <Logo className="w-8 h-8 drop-shadow-md hidden sm:block" />
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
      <main className="pt-24 w-full">
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
                <p className="text-slate-600 mb-10 text-lg max-w-lg mx-auto leading-relaxed pl-1">
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
                        <li><Link to={reverseViewMap['home']} className="hover:text-indigo-400 transition-colors">Accueil</Link></li>
                        <li><Link to={reverseViewMap['profile']} className="hover:text-indigo-400 transition-colors">Simulation</Link></li>
                        <li><Link to={reverseViewMap['guide']} className="hover:text-indigo-400 transition-colors">Guide</Link></li>
                        <li><Link to={reverseViewMap['blog']} className="hover:text-indigo-400 transition-colors">Blog</Link></li>
                        <li><Link to={reverseViewMap['faq']} className="hover:text-indigo-400 transition-colors">FAQ</Link></li>
                        <li><Link to={reverseViewMap['about']} className="hover:text-indigo-400 transition-colors">À propos</Link></li>
                        <li><Link to={reverseViewMap['legal']} className="hover:text-indigo-400 transition-colors">Mentions légales</Link></li>
                        <li><Link to={reverseViewMap['privacy']} className="hover:text-indigo-400 transition-colors">Confidentialité</Link></li>
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
                    <p>© 2026 OrientaBénin. A product of Aurion Labs-G. All rights reserved.</p>
                    <div className="flex space-x-4 mt-4 sm:mt-0">
                      <button onClick={() => setView('legal')} className="hover:text-white transition-colors">Mentions Légales</button>
                      <button onClick={() => setView('privacy')} className="hover:text-white transition-colors">Confidentialité</button>
                      <button onClick={() => setView('cgu')} className="hover:text-white transition-colors">CGU</button>
                    </div>
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
                    <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center"><User className="w-5 h-5 mr-2 text-indigo-500"/> Votre Série du BAC</label>
                    <div className="relative">
                      <select value={selectedSerie} onChange={e => setSelectedSerie(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 font-black appearance-none shadow-sm text-lg">
                        <option value="" className="font-medium text-slate-500">Sélectionnez votre série...</option>
                        {allSeries.map(s => <option key={s} value={s} className="font-bold">Série {s}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className={`p-6 mb-8 ${userProfile?.isLocked ? 'opacity-75 pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold flex items-center text-slate-800"><Calculator className="w-5 h-5 mr-2 text-violet-500"/> Bulletin de Notes</h3>
                      <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-bold">Sur 20</span>
                    </div>
                    {selectedSerie ? (
                      <div className="space-y-3">
                        {requiredSubjects.map(subject => {
                          const serieData = seriesBacData.series.find(s => s.code === selectedSerie);
                          const epreuve = serieData?.epreuves.premier_groupe.ecrit?.find(e => e.matiere === subject);
                          const coeff = epreuve ? epreuve.coefficient : null;
                          
                          return (
                            <div key={subject} className="flex items-center justify-between bg-white/40 border border-slate-100 p-3 rounded-xl hover:bg-white/60 transition-colors">
                              <div className="flex-1">
                                <label className="text-sm font-bold text-slate-700 block">{subject}</label>
                                {coeff && <span className="text-xs text-slate-400 font-medium">Coeff. {coeff}</span>}
                              </div>
                              <div className="w-24 relative">
                                <input 
                                  type="number" 
                                  min="0" 
                                  max="20" 
                                  step="0.25"
                                  placeholder="--"
                                  value={grades[subject] || ''} 
                                  onChange={e => setGrades({...grades, [subject]: parseFloat(e.target.value) || 0})} 
                                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-center focus:ring-2 focus:ring-violet-500 outline-none transition-all font-black text-slate-800 shadow-inner" 
                                />
                              </div>
                            </div>
                          );
                        })}
                        
                        {bacAverage && (
                          <div className={`mt-6 p-4 rounded-xl border flex items-center justify-between ${bacAverage.isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div>
                              <p className="text-sm font-bold text-slate-800">Moyenne estimée au BAC</p>
                              {!bacAverage.isComplete && <p className="text-xs text-slate-500">Saisissez toutes les notes pour un calcul précis.</p>}
                            </div>
                            <div className={`text-2xl font-black ${bacAverage.isComplete ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {bacAverage.average}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                        <p className="text-sm text-slate-500 font-medium">Sélectionnez d'abord votre série pour voir les matières requises.</p>
                      </div>
                    )}
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
              
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start shadow-sm">
                <ShieldAlert className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-amber-600" />
                <p><strong>Avertissement Scientifique :</strong> Les résultats présentés sont des simulations basées sur un algorithme prédictif et les données historiques d'orientation du MESRS. Ils ont une valeur indicative et stratégique, mais ne constituent en aucun cas une garantie d'admission ou d'obtention de bourse. La décision finale appartient aux commissions d'attribution de l'État.</p>
              </div>

              {selectedSerie && recommendations.length === 0 && Object.keys(grades).length > 0 && (
                <GlassCard className="p-8 text-center mb-8 border-amber-200 bg-amber-50/50">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune filière admissible</h3>
                  <p className="text-slate-600 font-medium">D'après vos notes, aucune filière n'atteint la moyenne requise de 10/20. Veuillez vérifier vos notes ou envisager d'autres options d'orientation.</p>
                </GlassCard>
              )}

              {selectedSerie && recommendations.length > 0 && (
                <div className="mb-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Résumé de vos résultats (Série {selectedSerie})</h3>
                  <div className="space-y-3 text-sm text-slate-700">
                    <p><strong>Total des filières admissibles (Moyenne &ge; 10) :</strong> {recommendations.length}</p>
                    <p><strong>Meilleure moyenne :</strong> {Math.max(...recommendations.map(r => r.score)).toFixed(2)}</p>
                    <div className="mt-4">
                      <p className="font-bold mb-2">Répartition par université :</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {Object.entries(
                          recommendations.reduce((acc, rec) => {
                            acc[rec.filiere.universite] = (acc[rec.filiere.universite] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).sort((a, b) => b[1] - a[1]).map(([uni, count]) => (
                          <li key={uni}>{uni} : <strong>{count} filière{count > 1 ? 's' : ''}</strong></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
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
                              <p className="text-sm font-black text-slate-700">{f.admisOfficiels || ((f.quotas?.bourses || 0) + (f.quotas?.aides_fpp || 0))}</p>
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

                        {/* Calculation Details Removed from here */}

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
                {statsSecteurs.map(([type, count], index) => {
                  const colors = [
                    'bg-indigo-50/50 border-indigo-100 text-indigo-400 text-indigo-600 bg-indigo-100',
                    'bg-emerald-50/50 border-emerald-100 text-emerald-400 text-emerald-600 bg-emerald-100',
                    'bg-amber-50/50 border-amber-100 text-amber-400 text-amber-600 bg-amber-100',
                    'bg-rose-50/50 border-rose-100 text-rose-400 text-rose-600 bg-rose-100',
                    'bg-blue-50/50 border-blue-100 text-blue-400 text-blue-600 bg-blue-100'
                  ];
                  const colorClass = colors[index % colors.length].split(' ');
                  
                  return (
                    <div key={type} className={`${colorClass[0]} border ${colorClass[1]} p-4 rounded-2xl`}>
                      <div className="flex justify-between items-center mb-1">
                        <p className={`text-[10px] font-bold ${colorClass[2]} uppercase`}>{type}</p>
                        <span className={`text-[10px] font-black ${colorClass[3]} ${colorClass[4]} px-1.5 py-0.5 rounded`}>{count}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-tight">Filières disponibles</p>
                    </div>
                  );
                })}
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
                  <GlassCard key={f.id} onClick={() => { setSelectedFiliere(f); setView('details'); }} className="p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">{f.sigle}</span>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${f.type_universite === 'Public' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>{f.type_universite}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                        {f.baccalaureats_recommandes.map(s => <span key={s} className="bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">Série {s}</span>)}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">{f.nom_filiere}</h3>
                    <div className="flex justify-between items-center text-sm text-slate-500">
                      <span className="flex items-center"><Building2 className="w-4 h-4 mr-1.5 text-slate-400"/> {f.universite}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs" title="Places Boursiers"><Star className="w-3.5 h-3.5 mr-1"/> {f.quotas?.bourses || 0}</span>
                        <span className="flex items-center font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-xs" title="Candidats Actuels"><Users className="w-3.5 h-3.5 mr-1"/> {f.candidatsCount || 0}</span>
                      </div>
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
                    <span className="block text-3xl font-display font-bold text-emerald-600 mb-1">{selectedFiliere.quotas?.bourses || 0}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bourses</span>
                  </GlassCard>
                  <GlassCard className="p-5 text-center">
                    <span className="block text-3xl font-display font-bold text-blue-600 mb-1">{selectedFiliere.quotas?.aides_fpp || 0}</span>
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

                  {(() => {
                    const matchRec = recommendations.find(r => r.filiere.id === selectedFiliere?.id);
                    if (matchRec && matchRec.formule) {
                      return (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <details className="group">
                            <summary className="text-sm text-indigo-600 font-bold cursor-pointer hover:text-indigo-700 transition-colors flex items-center select-none">
                              <Calculator className="w-4 h-4 mr-2" />
                              Votre Score : {matchRec.score}/20
                              <span className="ml-auto text-xs font-normal text-slate-400 group-open:hidden">Voir le détail du calcul</span>
                            </summary>
                            <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                              <p className="text-[10px] text-indigo-400 uppercase font-bold mb-2 tracking-wider">Formule appliquée</p>
                              <p className="text-sm font-mono text-indigo-800 break-words leading-relaxed">{matchRec.formule}</p>
                            </div>
                          </details>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center"><GraduationCap className="w-5 h-5 mr-2 text-emerald-500"/> Bacs Recommandés</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFiliere.baccalaureats_recommandes.map(b => (
                      <span key={b} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-sm font-semibold border border-emerald-100">Série {b}</span>
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
              <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" /> Retour
              </button>
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
                  <a href="#systeme" onClick={(e) => { e.preventDefault(); document.getElementById('systeme')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 shrink-0">1</span>
                    Qu'est-ce qu'une allocation ?
                  </a>
                  <a href="#universites" onClick={(e) => { e.preventDefault(); document.getElementById('universites')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 shrink-0">2</span>
                    Répartition des filières
                  </a>
                  <a href="#bourses" onClick={(e) => { e.preventDefault(); document.getElementById('bourses')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 shrink-0">3</span>
                    Bourses, Secours et FPP
                  </a>
                  <a href="#mentions" onClick={(e) => { e.preventDefault(); document.getElementById('mentions')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 shrink-0">4</span>
                    Le Mythe des Mentions
                  </a>
                  <a href="#choisir" onClick={(e) => { e.preventDefault(); document.getElementById('choisir')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 shrink-0">5</span>
                    Comment bien choisir sa filière
                  </a>
                  <a href="#demarches" onClick={(e) => { e.preventDefault(); document.getElementById('demarches')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 shrink-0">6</span>
                    Démarches & Vie Pratique
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

                <section id="choisir">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center"><Target className="w-6 h-6 mr-2 text-indigo-600"/> 5. Comment bien choisir sa filière</h3>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-700 mb-4 leading-relaxed">
                      Le choix de votre filière ne doit pas se faire au hasard. Voici les étapes clés pour optimiser vos chances :
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 shrink-0 mt-0.5">1</span>
                        <div>
                          <strong className="text-slate-900 block mb-1">Analysez vos notes</strong>
                          <span className="text-sm text-slate-600">Identifiez vos points forts. Les matières où vous avez les meilleures notes doivent correspondre aux matières à fort coefficient de la filière visée.</span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 shrink-0 mt-0.5">2</span>
                        <div>
                          <strong className="text-slate-900 block mb-1">Vérifiez la saturation</strong>
                          <span className="text-sm text-slate-600">Utilisez notre simulateur pour voir le nombre de candidats déjà inscrits par rapport aux places disponibles. Une filière moins demandée augmente vos chances.</span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 shrink-0 mt-0.5">3</span>
                        <div>
                          <strong className="text-slate-900 block mb-1">Diversifiez vos choix</strong>
                          <span className="text-sm text-slate-600">Ne mettez pas uniquement des filières très prisées (comme la médecine ou le droit). Gardez des choix de sécurité dans des domaines connexes.</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </section>

                <section id="demarches" className="pt-4 border-t border-slate-200">
                  <div className="mb-6">
                    <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold inline-block mb-3">Nouveau ! Vécu Étudiant</span>
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center"><Users className="w-6 h-6 mr-2 text-indigo-600"/> 6. Démarches & Vie Pratique</h3>
                    <p className="text-slate-600 mt-2">Démarches administratives, astuces terrain et résolution de problèmes tirés des retours d'expérience communautaires.</p>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Checklists - Procédures Administratives */}
                    <div>
                      <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" />
                        Procédures Pas-à-Pas
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {demarchesData.checklists_procedures.map((proc, index) => (
                          <GlassCard key={proc.id || index} className="p-5 flex flex-col h-full bg-white hover:shadow-lg transition-shadow">
                            <h5 className="font-bold text-slate-900 mb-2 leading-tight">{proc.nom_procedure}</h5>
                            <p className="text-xs text-slate-500 font-medium mb-4 flex-1">{proc.objectif}</p>
                            
                            <details className="group">
                              <summary className="text-sm font-bold text-indigo-600 cursor-pointer flex items-center select-none py-2 hover:text-indigo-800 transition-colors">
                                <span className="group-open:hidden">Voir les étapes</span>
                                <span className="hidden group-open:inline">Masquer les étapes</span>
                                <ChevronRight className="w-4 h-4 ml-1 group-open:rotate-90 transition-transform" />
                              </summary>
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-4">
                                {proc.etapes && proc.etapes.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Étapes</h6>
                                    <ul className="space-y-2">
                                      {proc.etapes.map((etape, i) => (
                                        <li key={i} className="flex text-sm text-slate-600 leading-snug">
                                          <span className="text-indigo-400 font-bold mr-2">{i+1}.</span>
                                          {etape}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {proc.pieces_requises && proc.pieces_requises.length > 0 && (
                                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-3">
                                    <h6 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Pièces requises</h6>
                                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                                      {proc.pieces_requises.map((piece, i) => (
                                        <li key={i}>{piece}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </details>
                          </GlassCard>
                        ))}
                      </div>
                    </div>

                    {/* FAQ Base de connaissances */}
                    <div>
                      <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <HelpCircle className="w-5 h-5 mr-2 text-amber-500" />
                        Foire Aux Questions (FAQ)
                      </h4>
                      <div className="space-y-3">
                        {demarchesData.faq_base_connaissances.map((faq, index) => (
                          <details key={faq.id || index} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm [&_summary::-webkit-details-marker]:hidden">
                            <summary className="cursor-pointer p-4 font-bold text-slate-800 hover:bg-slate-50 transition-colors flex justify-between items-center select-none">
                              <span className="pr-4 leading-tight">{faq.question}</span>
                              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 group-open:rotate-90 transition-transform" />
                            </summary>
                            <div className="p-4 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                              <p className="mt-3">{faq.reponse_synthese}</p>
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </motion.div>
          )}

          {/* ABOUT VIEW */}
          {view === 'about' && (
            <motion.div key="about" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="pb-32 max-w-3xl mx-auto px-4 w-full">
              <button onClick={() => navigate(-1)} className="mb-8 flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-semibold group">
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                Retour
              </button>
              
              <div className="mb-10 text-center max-w-2xl mx-auto">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold mb-5"
                >
                  <Sparkles className="w-4 h-4" /> Notre Histoire
                </motion.div>
                <h2 className="text-4xl sm:text-5xl font-display font-black text-slate-900 mb-5 tracking-tight leading-tight">
                  Construire <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">votre avenir</span> sereinement
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed font-medium">
                  Fini le stress post-BAC. OrientaBénin vous accompagne de manière simple et humaine dans le choix de votre future filière universitaire.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Highlight/Propulsé par - Bento Large */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="lg:col-span-2 group"
                >
                  <GlassCard className="h-full p-8 bg-gradient-to-br from-indigo-900 to-violet-900 border-transparent text-white overflow-hidden relative transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-900/20">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-0 right-0 p-6 opacity-10">
                      <Heart className="w-32 h-32" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                        <Rocket className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 tracking-tight">Une initiative d'Aurion Labs-G</h3>
                      <p className="text-indigo-100/90 text-lg leading-relaxed max-w-lg font-medium">
                        Nous sommes une jeune équipe passionnée, convaincue que l'orientation scolaire au Bénin mérite d'être simplifiée. Notre objectif avec OrientaBénin est de vous donner toutes les clés en main pour réussir vos études.
                      </p>
                      <div className="mt-8 inline-flex items-center text-sm font-bold text-white uppercase tracking-widest border-b border-indigo-400 pb-1">
                        Tous droits réservés
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Vision - Bento Square */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="group"
                >
                  <GlassCard className="h-full p-8 hover:-translate-y-1 transition-transform hover:shadow-xl hover:shadow-slate-200/50">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Target className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Notre Mission</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      Faire les bons choix après le BAC n'est pas toujours évidents. Nous voulons fournir à chaque élève les bonnes informations pour choisir une filière qui correspond à ses talents.
                    </p>
                  </GlassCard>
                </motion.div>

                {/* 100% Béninois - Bento Square */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="group"
                >
                  <GlassCard className="h-full p-8 hover:-translate-y-1 transition-transform hover:shadow-xl hover:shadow-slate-200/50">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Adapté à notre réalité</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      L'application comprend comment fonctionne notre système universitaire : elle fait la distinction entre les Bourses, les Secours (aides) et le Titre Partiellement Payant.
                    </p>
                  </GlassCard>
                </motion.div>

                {/* Mécanique & Disclaimer - Bento Large */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="md:col-span-2 group"
                >
                  <GlassCard className="h-full p-8 hover:-translate-y-1 transition-transform hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                        <Zap className="w-6 h-6 text-amber-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Comment ça marche concrètement ?</h3>
                      <p className="text-slate-600 leading-relaxed font-medium mb-6">
                        Pas de magie ! Nous utilisons exactement les mêmes calculs que l'État. L'application compare vos notes avec les matières exigées par chaque faculté pour vous dire où vous avez de vraies chances d'être retenu.
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-start">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 mr-4 mt-0.5">
                        <Info className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1 text-sm tracking-tight">Petit rappel amical</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          OrientaBénin est une initiative citoyenne pour vous aider. Gardez en tête que la liste définitive des admis reste la décision finale du Ministère de l'Enseignement Supérieur (MESRS).
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>

              {/* CTA Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="mt-12 text-center"
              >
                <div className="inline-block p-1 bg-white border border-slate-200 rounded-full shadow-sm">
                  <button 
                    onClick={() => setView('profile')}
                    className="flex items-center px-8 py-4 bg-slate-900 text-white rounded-full font-bold shadow-lg shadow-slate-900/20 hover:bg-indigo-600 hover:shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 group"
                  >
                    Faire ma simulation gratuite
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* FAQ VIEW */}
          {view === 'faq' && (
            <motion.div key="faq" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="pb-32 max-w-3xl mx-auto px-4 w-full">
              <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" /> Retour
              </button>
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
              <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" /> Retour
              </button>
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-4 tracking-tight">
                  Conseils & Actualités
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Des conseils concrets et localisés pour réussir votre orientation universitaire au Bénin.
                </p>
              </div>

              <div className="grid gap-6">
                <GlassCard className="p-0 overflow-hidden flex flex-col sm:flex-row hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="sm:w-1/3 h-48 sm:h-auto bg-blue-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-12 h-12 text-blue-400" />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">Procédures</span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Procédures de demande de bourse MESRS : Le guide complet</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      Comment constituer son dossier ? Quels sont les délais stricts à respecter ? Comprendre la différence entre les critères sociaux et académiques pour maximiser vos chances d'obtenir une allocation de l'État.
                    </p>
                    <button className="text-indigo-600 font-semibold text-sm flex items-center hover:text-indigo-700 transition-colors">
                      Lire l'article <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </GlassCard>

                <GlassCard onClick={() => setView('article-metiers')} className="p-0 overflow-hidden flex flex-col sm:flex-row hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="sm:w-1/3 h-48 sm:h-auto bg-emerald-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-12 h-12 text-emerald-400" />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 block">Avenir</span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Les métiers les plus recherchés au Bénin</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      Quels sont les secteurs qui recrutent le plus aujourd'hui au Bénin ? Zoom sur le Numérique, l'Agronomie moderne et les Énergies renouvelables. Découvrez où se trouvent les vraies opportunités d'emploi.
                    </p>
                    <button className="text-indigo-600 font-semibold text-sm flex items-center hover:text-indigo-700 transition-colors">
                      Lire l'article <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </GlassCard>

                <GlassCard className="p-0 overflow-hidden flex flex-col sm:flex-row hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="sm:w-1/3 h-48 sm:h-auto bg-rose-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-12 h-12 text-rose-400" />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 block">Avertissement</span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Les 5 erreurs fatales d'orientation à éviter absolument</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      Ne pas regarder les quotas, ignorer les coefficients de sa série, ou choisir une filière par "effet de mode". Voici les erreurs les plus courantes qui coûtent la bourse à de nombreux bacheliers chaque année.
                    </p>
                    <button className="text-indigo-600 font-semibold text-sm flex items-center hover:text-indigo-700 transition-colors">
                      Lire l'article <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* ARTICLE METIERS VIEW */}
          {view === 'article-metiers' && (
            <motion.div key="article-metiers" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="pb-32 max-w-3xl mx-auto px-4 w-full">
              <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux conseils
              </button>
              
              <div className="mb-8">
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">Avenir & Débouchés</span>
                <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-4 tracking-tight">
                  Les métiers les plus recherchés au Bénin en 2024
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Découvrez les secteurs qui recrutent le plus aujourd'hui au Bénin et les métiers d'avenir pour bien orienter vos études.
                </p>
              </div>

              <div className="space-y-8">
                <GlassCard className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><span className="text-2xl mr-2">🌱</span> 1. Secteur Agricole & Agroalimentaire</h3>
                  <p className="text-slate-600 mb-4">Le Bénin mise sur l'agriculture durable et la transformation locale.</p>
                  <ul className="space-y-2 mb-4 text-slate-700">
                    <li><strong className="text-slate-900">Ingénieur agronome 🌾</strong> (spécialisé en cultures comme le coton, l'anacarde, le soja)</li>
                    <li><strong className="text-slate-900">Technicien agricole 🚜</strong> (utilisation d'engrais bio, irrigation)</li>
                    <li><strong className="text-slate-900">Expert en agro-transformation 🥫</strong> (fabrication de jus, farines, huiles)</li>
                    <li><strong className="text-slate-900">Vétérinaire / Éleveur moderne 🐄</strong> (développement de l'élevage bovin et avicole)</li>
                  </ul>
                  <div className="bg-emerald-50 p-3 rounded-lg text-sm text-emerald-800">
                    💡 <strong>Pourquoi ?</strong> Le Bénin veut réduire les importations alimentaires et exporter plus de produits transformés.
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><span className="text-2xl mr-2">💻</span> 2. Secteur des TIC & Numérique</h3>
                  <p className="text-slate-600 mb-4">Le gouvernement encourage les startups et la digitalisation.</p>
                  <ul className="space-y-2 mb-4 text-slate-700">
                    <li><strong className="text-slate-900">Développeur Full-Stack 👨‍💻</strong> (JavaScript, Python, PHP)</li>
                    <li><strong className="text-slate-900">Spécialiste Cybersécurité 🔐</strong> (protection des données bancaires et gouvernementales)</li>
                    <li><strong className="text-slate-900">Data Analyst 📊</strong> (analyse des données pour entreprises et agriculture intelligente)</li>
                    <li><strong className="text-slate-900">Technicien réseaux & télécoms 📶</strong> (fibre optique, 4G/5G)</li>
                  </ul>
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                    🚀 <strong>Opportunités :</strong> Les incubateurs comme <strong>Sèmè City</strong> forment et financent des talents tech.
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><span className="text-2xl mr-2">🏗️</span> 3. BTP, Infrastructures & Énergie</h3>
                  <p className="text-slate-600 mb-4">Avec les grands chantiers routiers et immobiliers, les besoins explosent !</p>
                  <ul className="space-y-2 mb-4 text-slate-700">
                    <li><strong className="text-slate-900">Ingénieur civil 🏢</strong> (construction de routes, ponts, logements)</li>
                    <li><strong className="text-slate-900">Technicien en énergie solaire ☀️</strong> (installation de panneaux photovoltaïques)</li>
                    <li><strong className="text-slate-900">Chauffeur d'engins lourds 🚜</strong> (pour les travaux publics)</li>
                    <li><strong className="text-slate-900">Électricien industriel ⚡</strong> (maintenance des réseaux électriques)</li>
                  </ul>
                  <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
                    💼 <strong>Débouchés :</strong> Le Bénin mise sur les <strong>énergies vertes</strong> et l'amélioration des infrastructures.
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><span className="text-2xl mr-2">🏥</span> 4. Santé & Bien-Être</h3>
                  <p className="text-slate-600 mb-4">Manque criard de personnel médical, surtout en zones rurales.</p>
                  <ul className="space-y-2 mb-4 text-slate-700">
                    <li><strong className="text-slate-900">Médecin généraliste 👨‍⚕️</strong> (urgent en campagnes)</li>
                    <li><strong className="text-slate-900">Infirmier / Sage-femme 👩‍⚕️</strong> (besoin dans les maternités)</li>
                    <li><strong className="text-slate-900">Pharmacien 💊</strong> (gestion des médicaments essentiels)</li>
                    <li><strong className="text-slate-900">Technicien de laboratoire 🧪</strong> (analyses médicales)</li>
                  </ul>
                  <div className="bg-rose-50 p-3 rounded-lg text-sm text-rose-800">
                    ⚠️ <strong>Priorité :</strong> Le gouvernement recrute massivement via le <strong>PNDS</strong> (Plan National de Développement Sanitaire).
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><span className="text-2xl mr-2">📦</span> 5. Commerce, Logistique & Transport</h3>
                  <p className="text-slate-600 mb-4">Avec le <strong>Port de Cotonou</strong> (2e plus grand d'Afrique de l'Ouest), les métiers logistiques sont en hausse.</p>
                  <ul className="space-y-2 mb-4 text-slate-700">
                    <li><strong className="text-slate-900">Agent de transit 🚢</strong> (gestion des import/export)</li>
                    <li><strong className="text-slate-900">Responsable supply chain 📦</strong> (optimisation des flux)</li>
                    <li><strong className="text-slate-900">Commercial export 🌍</strong> (vente de produits béninois à l'international)</li>
                  </ul>
                  <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-800">
                    🌐 <strong>Atout :</strong> La maîtrise de l'<strong>anglais</strong> et du <strong>chinois</strong> est un plus pour ce secteur.
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><span className="text-2xl mr-2">💰</span> 6. Finance, Banque & Audit</h3>
                  <p className="text-slate-600 mb-4">Les banques et fintechs recrutent pour sécuriser les transactions.</p>
                  <ul className="space-y-2 mb-4 text-slate-700">
                    <li><strong className="text-slate-900">Comptable certifié 📉</strong> (normes OHADA)</li>
                    <li><strong className="text-slate-900">Analyste financier 📈</strong> (gestion des risques)</li>
                    <li><strong className="text-slate-900">Conseiller en microfinance 🏦</strong> (accès au crédit pour les PME)</li>
                  </ul>
                  <div className="bg-violet-50 p-3 rounded-lg text-sm text-violet-800">
                    🔐 <strong>Tendance :</strong> La finance digitale (<strong>mobile money</strong>) crée de nouveaux emplois.
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><span className="text-2xl mr-2">🎓</span> 7. Éducation & Formation</h3>
                  <p className="text-slate-600 mb-4">Besoin d'enseignants qualifiés et de formateurs professionnels.</p>
                  <ul className="space-y-2 mb-4 text-slate-700">
                    <li><strong className="text-slate-900">Prof de maths/physique ✖️🔬</strong> (lycées et universités)</li>
                    <li><strong className="text-slate-900">Formateur en métiers techniques 🛠️</strong> (électricité, plomberie, soudure)</li>
                    <li><strong className="text-slate-900">Expert en e-learning 💻</strong> (numérisation de l'éducation)</li>
                  </ul>
                  <div className="bg-slate-100 p-3 rounded-lg text-sm text-slate-800">
                    📚 <strong>Enjeu :</strong> Le Bénin veut améliorer l'enseignement technique (lycées agricoles et industriels).
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><span className="text-2xl mr-2">🎨</span> 8. Artisanat, Tourisme & Création</h3>
                  <p className="text-slate-600 mb-4">Le Bénin mise sur son patrimoine culturel et l'artisanat local.</p>
                  <ul className="space-y-2 mb-4 text-slate-700">
                    <li><strong className="text-slate-900">Designer textile 👗</strong> (valorisation du tissu <strong>"Danfani"</strong>)</li>
                    <li><strong className="text-slate-900">Guide touristique 🗺️</strong> (pour les sites historiques comme Ouidah et Abomey)</li>
                    <li><strong className="text-slate-900">Manager hôtelier 🏨</strong> (développement des éco-lodges)</li>
                  </ul>
                  <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-800">
                    🌟 <strong>Potentiel :</strong> Le tourisme culturel et religieux (<strong>vodoun</strong>) attire de plus en plus.
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><span className="text-2xl mr-2">🏛️</span> 9. Secteur Public & Juridique</h3>
                  <p className="text-slate-600 mb-4">L'État recrute pour moderniser l'administration.</p>
                  <ul className="space-y-2 mb-4 text-slate-700">
                    <li><strong className="text-slate-900">Juriste en droit des affaires ⚖️</strong> (OHADA, investissements)</li>
                    <li><strong className="text-slate-900">Fonctionnaire spécialisé 📑</strong> (fiscalité, douanes)</li>
                    <li><strong className="text-slate-900">Urbaniste 🏙️</strong> (aménagement des villes)</li>
                  </ul>
                  <div className="bg-slate-100 p-3 rounded-lg text-sm text-slate-800">
                    📜 <strong>Concours :</strong> Beaucoup d'offres via <strong>le gouvernement et les communes</strong>.
                  </div>
                </GlassCard>

                <div className="grid sm:grid-cols-2 gap-6">
                  <GlassCard className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center"><span className="text-xl mr-2">🔥</span> Top 5 Métiers "Coup de Cœur"</h3>
                    <ol className="space-y-3 text-sm text-indigo-800 font-medium">
                      <li>1️⃣ Développeur d'applications locales 📱</li>
                      <li>2️⃣ Ingénieur en énergie solaire ☀️</li>
                      <li>3️⃣ Expert en agro-business 🌱</li>
                      <li>4️⃣ Infirmier urgentiste 🚑</li>
                      <li>5️⃣ Manager logistique portuaire 🚢</li>
                    </ol>
                  </GlassCard>

                  <GlassCard className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
                    <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center"><span className="text-xl mr-2">🎯</span> Conseils pour l'emploi</h3>
                    <ul className="space-y-3 text-sm text-emerald-800 font-medium">
                      <li>✔️ <strong>Se former :</strong> Sèmè City, centres agréés</li>
                      <li>✔️ <strong>Maîtriser l'anglais 🌍</strong> (secteurs internationaux)</li>
                      <li>✔️ <strong>Suivre les appels d'offres</strong> (ANPE, PND)</li>
                      <li>✔️ <strong>Entrepreneuriat 💡</strong> (startups encouragées)</li>
                    </ul>
                    <p className="mt-4 text-xs text-emerald-700 italic">💬 Motivation : Le Bénin est en plein boom économique, c'est le moment de saisir les opportunités !</p>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}

          {/* LEGAL VIEW */}
          {view === 'legal' && (
            <motion.div key="legal" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="pb-32 max-w-3xl mx-auto px-4 w-full">
              <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" /> Retour
              </button>
              <GlassCard className="p-8">
                <h2 className="text-3xl font-display font-black text-slate-900 mb-6">Mentions Légales</h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">1. Éditeur du service</h3>
                    <p>L'application OrientaBénin est éditée et exploitée par <strong>Aurion Labs-G</strong>.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">2. Hébergement</h3>
                    <p>Ce site est hébergé sur l'infrastructure Google Cloud Run via Firebase Hosting.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">3. Propriété intellectuelle</h3>
                    <p><strong>OrientaBénin is a product of Aurion Labs-G. All rights reserved by Aurion Labs-G.</strong></p>
                    <p className="mt-2">L'ensemble de cette application (structure, design, textes, algorithmes de calcul, bases de données) appartient exclusivement à Aurion Labs-G. Toute reproduction totale ou partielle est strictement interdite sans autorisation préalable.</p>
                    <p className="mt-2">Les données relatives aux filières, universités et quotas sont issues des publications officielles du Ministère de l'Enseignement Supérieur et de la Recherche Scientifique (MESRS) du Bénin.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">4. Avertissement scientifique</h3>
                    <p>Les résultats fournis par le simulateur ont une valeur purement indicative. Ils ne remplacent en aucun cas les décisions officielles de la commission nationale d'orientation universitaire.</p>
                  </section>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* PRIVACY VIEW */}
          {view === 'privacy' && (
            <motion.div key="privacy" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="pb-32 max-w-3xl mx-auto px-4 w-full">
              <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" /> Retour
              </button>
              <GlassCard className="p-8">
                <h2 className="text-3xl font-display font-black text-slate-900 mb-6">Politique de Confidentialité</h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">1. Responsable du traitement</h3>
                    <p><strong>Aurion Labs-G</strong> est le responsable du traitement des données collectées sur l'application OrientaBénin.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">2. Collecte des données</h3>
                    <p>Nous collectons uniquement les données nécessaires au fonctionnement de l'application : votre adresse email (via Google Sign-In), votre série du baccalauréat, vos notes saisies et vos choix de filières.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">3. Utilisation des données</h3>
                    <p>Vos notes sont utilisées exclusivement pour faire fonctionner l'algorithme de simulation. Vos choix de filières sont enregistrés pour vous permettre de les retrouver lors de vos prochaines connexions et pour générer des statistiques anonymisées sur l'attractivité des filières.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">4. Partage des données</h3>
                    <p>Vos données personnelles ne sont jamais vendues, louées ou partagées avec des tiers à des fins commerciales. Les statistiques globales (ex: nombre de candidats par filière) sont anonymes.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">5. Sécurité</h3>
                    <p>Vos données sont stockées de manière sécurisée sur les serveurs de Google (Firebase/Firestore) avec des règles de sécurité strictes garantissant que seul vous (et les administrateurs) pouvez accéder à votre profil. <em>OrientaBénin is a product of Aurion Labs-G. All rights reserved by Aurion Labs-G.</em></p>
                  </section>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* CGU VIEW */}
          {view === 'cgu' && (
            <motion.div key="cgu" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="pb-32 max-w-3xl mx-auto px-4 w-full">
              <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" /> Retour
              </button>
              <GlassCard className="p-8">
                <h2 className="text-3xl font-display font-black text-slate-900 mb-6">Conditions Générales d'Utilisation</h2>
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">1. Acceptation</h3>
                    <p>En utilisant l'application OrientaBénin, vous acceptez pleinement et sans réserve les présentes conditions définies par <strong>Aurion Labs-G</strong>.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">2. Service fourni</h3>
                    <p>OrientaBénin est un outil d'aide à la décision. Les résultats de simulation sont purement indicatifs et basés sur les données officielles disponibles. Aurion Labs-G ne garantit en aucun cas l'obtention d'une bourse, d'un secours ou d'une admission dans une filière.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">3. Propriété intellectuelle</h3>
                    <p>Le code source, la marque, le design, les algorithmes et le service dans son ensemble sont la propriété exclusive d'Aurion Labs-G. <em>OrientaBénin is a product of Aurion Labs-G. All rights reserved by Aurion Labs-G.</em></p>
                  </section>
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">4. Responsabilité de l'utilisateur</h3>
                    <p>L'utilisateur s'engage à fournir des informations exactes (notes, série) pour garantir la pertinence des simulations. Toute utilisation abusive ou tentative de piratage entraînera la suppression immédiate du compte.</p>
                  </section>
                </div>
              </GlassCard>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40">
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] flex justify-around items-center p-2">
          <NavItem icon={<Home className="w-5 h-5"/>} label="Accueil" active={view==='home'} to={reverseViewMap['home']} />
          <NavItem icon={<User className="w-5 h-5"/>} label="Profil" active={view==='profile'} to={reverseViewMap['profile']} />
          <NavItem icon={<TrendingUp className="w-5 h-5"/>} label="Résultats" active={view==='results'} to={reverseViewMap['results']} />
          <NavItem icon={<Search className="w-5 h-5"/>} label="Explorer" active={view==='explore'} to={reverseViewMap['explore']} />
          <NavItem icon={<BookOpen className="w-5 h-5"/>} label="Guide" active={view==='guide'} to={reverseViewMap['guide']} />
        </div>
      </div>

      </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ff8a00] to-amber-500"></div>
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-[#ff8a00]" />
                </div>
                <h2 className="text-2xl font-display font-black text-slate-900 mb-3">Avertissement</h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Ce site propose des recommandations basées sur l'Intelligence Artificielle pour vous aider dans votre orientation. <br/><br/>
                  <strong>Ce n'est pas le site officiel du gouvernement.</strong>
                </p>
                
                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={acceptDisclaimer}
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all"
                  >
                    Continuer vers le site
                  </button>
                  <a
                    href="https://apresmonbac.bj/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center"
                  >
                    Visiter le site officiel <ArrowUpRight className="w-5 h-5 ml-2" />
                  </a>
                </div>
              </div>
            </motion.div>
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
