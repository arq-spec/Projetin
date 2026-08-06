import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Freelancer, Task, CalendarEvent, Notification, Client, UserProfile, ProfilePermissions, SystemUser, PdfTheme, RegistrationRequest } from './types';
import { createInitialUsers, generateUsername, createNewUserForFreelancer, ensureMasterAdmin } from './utils/userUtils';
import { loadFromDatabase, saveToDatabase, subscribeToDatabase } from './database';
import { 
  initialFreelancers, 
  initialTasks, 
  initialCalendarEvents, 
  initialNotifications 
} from './data/initialData';

import Dashboard from './components/Dashboard';
import ProjectManagement from './components/ProjectManagement';
import FreelancerRegistry from './components/FreelancerRegistry';
import FreelancerCalendarView from './components/FreelancerCalendarView';
import NotificationCenter from './components/NotificationCenter';
import Administration from './components/Administration';
import LoginDashboard from './components/LoginDashboard';
import Workstation from './components/Workstation';
import ChangePasswordModal from './components/ChangePasswordModal';


import { 
  BarChart3, 
  Users, 
  Calendar, 
  Bell, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  ArrowUpRight,
  Briefcase,
  Shield,
  Sun,
  Moon,
  Settings,
  Forklift,
  Layers,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';

const defaultProfilePermissions: ProfilePermissions[] = [
  {
    perfil: 'Administrador',
    canViewDashboard: true,
    canManageProjects: true,
    canViewRegistry: true,
    canEditRegistry: true,
    canViewCalendarAll: true,
    canViewAdminPanel: true,
    canConfigurePermissions: true,
  },
  {
    perfil: 'Gestor',
    canViewDashboard: true,
    canManageProjects: true,
    canViewRegistry: true,
    canEditRegistry: false, // view only
    canViewCalendarAll: true,
    canViewAdminPanel: true,
    canConfigurePermissions: false,
  },
  {
    perfil: 'Produtor',
    canViewDashboard: true,
    canManageProjects: true,
    canViewRegistry: true,
    canEditRegistry: true,
    canViewCalendarAll: true,
    canViewAdminPanel: false,
    canConfigurePermissions: false,
  },
  {
    perfil: 'Freelancer',
    canViewDashboard: true, // filtered workspace for freelancer
    canManageProjects: false,
    canViewRegistry: false,
    canEditRegistry: false,
    canViewCalendarAll: false,
    canViewAdminPanel: false,
    canConfigurePermissions: false,
  }
];

export default function App() {
  
  // User Profile and Security Permissions
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('freelance_management_user_v2');
    return saved ? JSON.parse(saved) : null;
  });

  const [permissions, setPermissions] = useState<ProfilePermissions[]>(() => {
    const saved = localStorage.getItem('freelance_management_permissions_v2');
    return saved ? JSON.parse(saved) : defaultProfilePermissions;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('freelance_management_user_v2', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('freelance_management_user_v2');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('freelance_management_permissions_v2', JSON.stringify(permissions));
  }, [permissions]);

  const handleResetToDefaultPermissions = () => {
    setPermissions(defaultProfilePermissions);
  };

  // Feedback/Notification message for session state changes
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  // Customization & Theme States
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('freelance_management_theme');
    return (saved as 'light' | 'dark' | 'system') || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [showConfigPopover, setShowConfigPopover] = useState(false);

  // Dynamic brand color theme state (Padrão vs Customizado)
  const [colorTheme, setColorTheme] = useState<'padrao' | 'customizado'>(() => {
    const saved = localStorage.getItem('freelance_management_color_theme');
    return (saved === 'customizado') ? 'customizado' : 'padrao';
  });

  const [companyLogo, setCompanyLogo] = useState<string | null>(() => {
    return localStorage.getItem('freelance_management_company_logo');
  });

  const [pdfTheme, setPdfTheme] = useState<PdfTheme>(() => {
    const saved = localStorage.getItem('freelance_management_pdf_theme');
    return saved ? JSON.parse(saved) : {
      bannerColor: '#0f172a',    // slate-900
      titleColor: '#ffffff',     // white
      subtitleColor: '#94a3b8',  // slate-400
      highlightColor: '#059669', // emerald-600
      logoSize: 40,
      logoOffsetX: 0,
      logoOffsetY: 0,
      companyName: '',
      companyCnpj: ''
    };
  });

  useEffect(() => {
    if (colorTheme === 'customizado') {
      document.documentElement.classList.add('theme-customizado');
    } else {
      document.documentElement.classList.remove('theme-customizado');
    }
    localStorage.setItem('freelance_management_color_theme', colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    if (companyLogo) {
      localStorage.setItem('freelance_management_company_logo', companyLogo);
    } else {
      localStorage.removeItem('freelance_management_company_logo');
    }
  }, [companyLogo]);

  useEffect(() => {
    localStorage.setItem('freelance_management_pdf_theme', JSON.stringify(pdfTheme));
  }, [pdfTheme]);


  useEffect(() => {
    const handleThemeChange = () => {
      let isDark = false;
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }
      
      setResolvedTheme(isDark ? 'dark' : 'light');
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    handleThemeChange();
    localStorage.setItem('freelance_management_theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleThemeChange);
      return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }
  }, [theme]);

  // Tab control state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'freelancers' | 'calendar' | 'notifications' | 'administration' | 'workstation'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [highlightKanbanCardId, setHighlightKanbanCardId] = useState<string | null>(null);
  const [navigatedProjectId, setNavigatedProjectId] = useState<string | null>(null);
  const [pendingApprovalRegistration, setPendingApprovalRegistration] = useState<RegistrationRequest | null>(null);
  const [actionStatus, setActionStatus] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Retraction side-panel automatic control states
  const [retractEnabled, setRetractEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('freelance_management_retract_enabled');
    return saved === 'true';
  });
  const [isRetracted, setIsRetracted] = useState<boolean>(() => {
    const saved = localStorage.getItem('freelance_management_is_retracted');
    return saved === 'true';
  });
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);

  // Auto-retraction when activeTab switches
  useEffect(() => {
    if (retractEnabled) {
      setIsRetracted(true);
    }
  }, [activeTab, retractEnabled]);

  useEffect(() => {
    localStorage.setItem('freelance_management_retract_enabled', String(retractEnabled));
  }, [retractEnabled]);

  useEffect(() => {
    localStorage.setItem('freelance_management_is_retracted', String(isRetracted));
  }, [isRetracted]);

  const sidebarEffectiveCollapsed = retractEnabled && isRetracted && !isSidebarHovered;

  // CSS builder for tab menu buttons supporting retraction
  const getTabButtonClass = (tabName: string) => {
    const isActive = activeTab === tabName;
    const baseClass = "w-full flex items-center h-[52px] px-4 gap-3 text-sm font-medium transition-all duration-300 ease-out cursor-pointer overflow-hidden";
    
    // Squircle active state with liquid glass style
    const activeState = isActive
      ? "bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-[0_4px_12px_0_rgba(0,0,0,0.1)] rounded-2xl"
      : "text-neutral-400 hover:text-white hover:bg-white/5 rounded-2xl border border-transparent";
      
    return `${baseClass} ${activeState}`;
  };

  const deduplicateNotifications = (list: Notification[]): Notification[] => {
    if (!Array.isArray(list)) return [];
    const seen = new Set<string>();
    return list.filter(n => {
      if (!n || !n.id) return false;
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  };

  // Loading status state for cloud database
  const [dbLoaded, setDbLoaded] = useState(false);

  // Guards to prevent overwriting cloud database with mock/default/local data before successful loading
  const isLoadedRef = useRef<{
    freelancers: boolean;
    tasks: boolean;
    calendarEvents: boolean;
    notifications: boolean;
    clients: boolean;
    users: boolean;
    permissions: boolean;
    registrationRequests: boolean;
  }>({
    freelancers: false,
    tasks: false,
    calendarEvents: false,
    notifications: false,
    clients: false,
    users: false,
    permissions: false,
    registrationRequests: false,
  });

  // Track the most recent value from database/subscription to avoid redundant/infinite write loop triggers
  const lastDbValueRef = useRef<{
    freelancers: any;
    tasks: any;
    calendarEvents: any;
    notifications: any;
    clients: any;
    users: any;
    permissions: any;
    registrationRequests: any;
  }>({
    freelancers: (() => { const s = localStorage.getItem('freelance_management_freelancers_v2'); return s ? JSON.parse(s) : initialFreelancers; })(),
    tasks: (() => { const s = localStorage.getItem('freelance_management_tasks_v2'); return s ? JSON.parse(s) : initialTasks; })(),
    calendarEvents: (() => { const s = localStorage.getItem('freelance_management_calendar_v2'); return s ? JSON.parse(s) : initialCalendarEvents; })(),
    notifications: (() => { const s = localStorage.getItem('freelance_management_notifications_v2'); return s ? JSON.parse(s) : initialNotifications; })(),
    clients: (() => { const s = localStorage.getItem('freelance_management_clients_v2'); return s ? JSON.parse(s) : []; })(),
    users: (() => { 
      let s = localStorage.getItem('freelance_management_users_v3'); 
      try {
        if (!s || JSON.parse(s).length <= 4) {
          const v2 = localStorage.getItem('freelance_management_users_v2');
          if (v2 && JSON.parse(v2).length > 4) s = v2;
        }
      } catch(e) {}
      if (s) return ensureMasterAdmin(JSON.parse(s)); 
      const sr = localStorage.getItem('freelance_management_freelancers_v2'); 
      const fr = sr ? JSON.parse(sr) : initialFreelancers; 
      return ensureMasterAdmin(createInitialUsers(fr)); 
    })(),
    permissions: defaultProfilePermissions,
    registrationRequests: (() => { const s = localStorage.getItem('freelance_management_reg_reqs'); return s ? JSON.parse(s) : []; })(),
  });

  // Persistence States synced with LocalStorage
  const [freelancers, setFreelancers] = useState<Freelancer[]>(() => {
    const saved = localStorage.getItem('freelance_management_freelancers_v2');
    return saved ? JSON.parse(saved) : initialFreelancers;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('freelance_management_tasks_v2');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('freelance_management_calendar_v2');
    return saved ? JSON.parse(saved) : initialCalendarEvents;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('freelance_management_notifications_v2');
    const parsed = saved ? JSON.parse(saved) : initialNotifications;
    return deduplicateNotifications(parsed);
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('freelance_management_clients_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<SystemUser[]>(() => {
    let saved = localStorage.getItem('freelance_management_users_v3');
    try {
      if (!saved || JSON.parse(saved).length <= 4) {
        const v2 = localStorage.getItem('freelance_management_users_v2');
        if (v2) {
          const parsedV2 = JSON.parse(v2);
          if (Array.isArray(parsedV2) && parsedV2.length > 4) {
             saved = v2;
             console.log('[Recovery] Restored users from v2 key');
          }
        }
      }
    } catch(e) {}
    
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const uniqueUsers = [];
        const seenIds = new Set();
        for (const u of parsed) {
          if (!seenIds.has(u.id)) {
            seenIds.add(u.id);
            uniqueUsers.push(u);
          }
        }
        return ensureMasterAdmin(uniqueUsers);
      }
      return ensureMasterAdmin(parsed);
    }
    const loadedFreelancers = (() => {
      const savedFree = localStorage.getItem('freelance_management_freelancers_v2');
      return savedFree ? JSON.parse(savedFree) : initialFreelancers;
    })();
    return ensureMasterAdmin(createInitialUsers(loadedFreelancers));
  });

  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>(() => {
    const saved = localStorage.getItem('freelance_management_reg_reqs');
    return saved ? JSON.parse(saved) : [];
  });

  const setSafeUsers = (value: SystemUser[] | ((prev: SystemUser[]) => SystemUser[])) => {
    setUsers(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      return ensureMasterAdmin(next);
    });
  };

  // 1. Inactivity Logout Tracker (30 minutes of inactivity)
  useEffect(() => {
    if (!currentUser) return;

    // 30 minutes in milliseconds
    const INACTIVITY_LIMIT = 30 * 60 * 1000;
    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // Track user interaction events
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Check inactivity every 10 seconds
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      if (elapsed >= INACTIVITY_LIMIT) {
        console.warn(`[Security] User ${currentUser.nome} inactive for 30 minutes. Logging out.`);
        setSessionMessage('Sua sessão expirou por inatividade de 30 minutos. Por favor, faça login novamente.');
        setCurrentUser(null);
      }
    }, 10000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [currentUser]);

  // 2. Real-time User Deletion Tracker
  useEffect(() => {
    if (!dbLoaded || !currentUser) return;

    // If currentUser is not found in the users list, log out immediately to prevent ghost sessions
    const userStillExists = users.some(u => u.id === currentUser.id);
    if (!userStillExists) {
      console.warn(`[Security] Logged in user profile (${currentUser.nome}) has been deleted. Logging out immediately.`);
      setSessionMessage('Seu perfil de usuário foi removido do sistema. Você foi deslogado.');
      setCurrentUser(null);
    }
  }, [users, currentUser, dbLoaded]);

  // Asynchronously load all data from Database Database on Mount
  useEffect(() => {
    async function loadAllData() {
      try {
        console.log('[Database] Loading all states from Database...');
        const [
          dbFreelancers,
          dbTasks,
          dbCalendarEvents,
          dbNotifications,
          dbClients,
          dbUsers,
          dbPermissions,
          dbRegistrationRequests
        ] = await Promise.all([
          loadFromDatabase('freelancers').catch(err => { console.warn('[Database] error load freelancers', err); return null; }),
          loadFromDatabase('tasks').catch(err => { console.warn('[Database] error load tasks', err); return null; }),
          loadFromDatabase('calendarEvents').catch(err => { console.warn('[Database] error load calendarEvents', err); return null; }),
          loadFromDatabase('notifications').catch(err => { console.warn('[Database] error load notifications', err); return null; }),
          loadFromDatabase('clients').catch(err => { console.warn('[Database] error load clients', err); return null; }),
          loadFromDatabase('users').catch(err => { console.warn('[Database] error load users', err); return null; }),
          loadFromDatabase('permissions').catch(err => { console.warn('[Database] error load permissions', err); return null; }),
          loadFromDatabase('registrationRequests').catch(err => { console.warn('[Database] error load reg requests', err); return null; })
        ]);

        if (dbFreelancers !== null) {
          const savedFree = localStorage.getItem('freelance_management_freelancers_v2');
          let localFreels = null;
          try { if (savedFree) localFreels = JSON.parse(savedFree); } catch (e) {}
          
          if (localFreels && Array.isArray(localFreels) && Array.isArray(dbFreelancers) && localFreels.length > dbFreelancers.length) {
            console.warn("[Database] Local storage has MORE freelancers than Database. Retaining local storage to recover from previous 1MB limit crash.");
            setFreelancers(localFreels);
            lastDbValueRef.current.freelancers = localFreels;
            // Attempt to re-sync
            setTimeout(() => {
              saveToDatabase('freelancers', localFreels);
            }, 1500);
          } else {
            setFreelancers(dbFreelancers);
            lastDbValueRef.current.freelancers = dbFreelancers;
          }
        }
        isLoadedRef.current.freelancers = true;

        if (dbTasks !== null) {
          const savedTasks = localStorage.getItem('freelance_management_tasks_v2');
          let localTasks = null;
          try { if (savedTasks) localTasks = JSON.parse(savedTasks); } catch (e) {}
          
          if (localTasks && Array.isArray(localTasks) && Array.isArray(dbTasks) && localTasks.length > dbTasks.length) {
            console.warn("[Database] Local storage has MORE tasks than Database. Retaining local storage.");
            setTasks(localTasks);
            lastDbValueRef.current.tasks = localTasks;
            setTimeout(() => {
              saveToDatabase('tasks', localTasks);
            }, 1500); 
          } else {
            setTasks(dbTasks);
            lastDbValueRef.current.tasks = dbTasks;
          }
        }
        isLoadedRef.current.tasks = true;

        if (dbCalendarEvents !== null) {
          setCalendarEvents(dbCalendarEvents);
          lastDbValueRef.current.calendarEvents = dbCalendarEvents;
        }
        isLoadedRef.current.calendarEvents = true;

        if (dbNotifications !== null) {
          const cleanNotifs = deduplicateNotifications(dbNotifications);
          setNotifications(cleanNotifs);
          lastDbValueRef.current.notifications = cleanNotifs;
        }
        isLoadedRef.current.notifications = true;

        if (dbClients !== null) {
          setClients(dbClients);
          lastDbValueRef.current.clients = dbClients;
        }
        isLoadedRef.current.clients = true;
        
        if (dbUsers !== null) {
          let validUsers = dbUsers;
          if (Array.isArray(dbUsers)) {
            validUsers = [];
            const seenIds = new Set();
            for (const u of dbUsers) {
              if (!seenIds.has(u.id)) {
                seenIds.add(u.id);
                validUsers.push(u);
              }
            }
          }
          const fullyEnsured = ensureMasterAdmin(validUsers);
          setSafeUsers(fullyEnsured);
          lastDbValueRef.current.users = validUsers;
        } else {
          // If Database is null (e.g. Quota limit or fresh db), do NOT wipe local storage.
          // Try to recover from any previous local storage keys if current is wiped out.
          let recoveredUsers = null;
          const possibleKeys = [
            'freelance_management_users_v3',
            'freelance_management_users_v2',
            'freelance_management_users_v1',
            'freelance_management_users'
          ];
          
          for (const k of possibleKeys) {
             try {
                const s = localStorage.getItem(k);
                if (s) {
                   const parsed = JSON.parse(s);
                   if (Array.isArray(parsed) && parsed.length > 4) { // More than default
                      recoveredUsers = parsed;
                      console.log(`[Recovery] Recovered users from ${k}`);
                      break;
                   }
                   if (!recoveredUsers && Array.isArray(parsed) && parsed.length > 0) {
                      recoveredUsers = parsed;
                   }
                }
             } catch (e) {}
          }
          
          if (recoveredUsers) {
             const fullyEnsured = ensureMasterAdmin(recoveredUsers);
             setSafeUsers(fullyEnsured);
             lastDbValueRef.current.users = fullyEnsured;
             setTimeout(() => {
                saveToDatabase('users', fullyEnsured);
             }, 3000);
          } else {
            const loadedFreelancers = dbFreelancers !== null ? dbFreelancers : freelancers;
            const freshInitialUsers = ensureMasterAdmin(createInitialUsers(loadedFreelancers));
            setSafeUsers(freshInitialUsers);
            lastDbValueRef.current.users = freshInitialUsers;
          }
        }
        isLoadedRef.current.users = true;
        
        if (dbPermissions !== null) {
          setPermissions(dbPermissions);
          lastDbValueRef.current.permissions = dbPermissions;
        }
        isLoadedRef.current.permissions = true;

        if (dbRegistrationRequests !== null) {
          setRegistrationRequests(dbRegistrationRequests);
          lastDbValueRef.current.registrationRequests = dbRegistrationRequests;
        }
        isLoadedRef.current.registrationRequests = true;

        console.log('[Database] All cloud database states synchronization finalized.');
      } catch (err) {
        console.warn('[Database] General error in Promise.all synchronizing Database database', err);
      } finally {
        // Always set dbLoaded to true so that user is never blocked by a loading screen, and we continue gracefully
        setDbLoaded(true);
      }
    }
    loadAllData();
  }, []);

  // Setup real-time updates from Database after initial database load
  useEffect(() => {
    if (!dbLoaded) return;

    console.log('[Database] Setting up real-time subscription listeners...');

    const unsubFreelancers = subscribeToDatabase('freelancers', (data) => {
      if (data) {
        setFreelancers(prev => {
          lastDbValueRef.current.freelancers = data;
          return JSON.stringify(prev) !== JSON.stringify(data) ? data : prev;
        });
      }
    });

    const unsubTasks = subscribeToDatabase('tasks', (data) => {
      if (data) {
        setTasks(prev => {
          lastDbValueRef.current.tasks = data;
          return JSON.stringify(prev) !== JSON.stringify(data) ? data : prev;
        });
      }
    });

    const unsubCalendar = subscribeToDatabase('calendarEvents', (data) => {
      if (data) {
        setCalendarEvents(prev => {
          lastDbValueRef.current.calendarEvents = data;
          return JSON.stringify(prev) !== JSON.stringify(data) ? data : prev;
        });
      }
    });

    const unsubNotifications = subscribeToDatabase('notifications', (data) => {
      if (data) {
        setNotifications(prev => {
          const cleanData = deduplicateNotifications(data);
          lastDbValueRef.current.notifications = cleanData;
          return JSON.stringify(prev) !== JSON.stringify(cleanData) ? cleanData : prev;
        });
      }
    });

    const unsubClients = subscribeToDatabase('clients', (data) => {
      if (data) {
        setClients(prev => {
          lastDbValueRef.current.clients = data;
          return JSON.stringify(prev) !== JSON.stringify(data) ? data : prev;
        });
      }
    });

    const unsubUsers = subscribeToDatabase('users', (data) => {
      if (data) {
        setSafeUsers(prev => {
          const fullyEnsured = ensureMasterAdmin(data);
          lastDbValueRef.current.users = data;
          return JSON.stringify(prev) !== JSON.stringify(fullyEnsured) ? fullyEnsured : prev;
        });
      }
    });

    const unsubPermissions = subscribeToDatabase('permissions', (data) => {
      if (data) {
        lastDbValueRef.current.permissions = data;
        setPermissions(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
      }
    });

    return () => {
      console.log('[Database] Cleaning up real-time subscriptions...');
      unsubFreelancers();
      unsubTasks();
      unsubCalendar();
      unsubNotifications();
      unsubClients();
      unsubUsers();
      unsubPermissions();
    };
  }, [dbLoaded]);

  const [activeAdminModule, setActiveAdminModule] = useState<'arquivados' | 'clientes' | 'permissoes' | 'usuarios' | 'customizacao' | 'api' | 'dados' | 'pdf' | 'aprovacoes' | 'whatsapp'>('usuarios');

  // Save changes to localStorage and Database whenever state gets updated
  useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current.freelancers) return;
    localStorage.setItem('freelance_management_freelancers_v2', JSON.stringify(freelancers));
    if (JSON.stringify(freelancers) !== JSON.stringify(lastDbValueRef.current.freelancers)) {
      lastDbValueRef.current.freelancers = freelancers;
      saveToDatabase('freelancers', freelancers);
    }
  }, [freelancers, dbLoaded]);

  useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current.tasks) return;
    localStorage.setItem('freelance_management_tasks_v2', JSON.stringify(tasks));
    if (JSON.stringify(tasks) !== JSON.stringify(lastDbValueRef.current.tasks)) {
      lastDbValueRef.current.tasks = tasks;
      saveToDatabase('tasks', tasks);
    }
  }, [tasks, dbLoaded]);

  useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current.calendarEvents) return;
    localStorage.setItem('freelance_management_calendar_v2', JSON.stringify(calendarEvents));
    if (JSON.stringify(calendarEvents) !== JSON.stringify(lastDbValueRef.current.calendarEvents)) {
      lastDbValueRef.current.calendarEvents = calendarEvents;
      saveToDatabase('calendarEvents', calendarEvents);
    }
  }, [calendarEvents, dbLoaded]);

  useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current.notifications) return;
    localStorage.setItem('freelance_management_notifications_v2', JSON.stringify(notifications));
    if (JSON.stringify(notifications) !== JSON.stringify(lastDbValueRef.current.notifications)) {
      lastDbValueRef.current.notifications = notifications;
      saveToDatabase('notifications', notifications);
    }
  }, [notifications, dbLoaded]);

  useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current.clients) return;
    localStorage.setItem('freelance_management_clients_v2', JSON.stringify(clients));
    if (JSON.stringify(clients) !== JSON.stringify(lastDbValueRef.current.clients)) {
      lastDbValueRef.current.clients = clients;
      saveToDatabase('clients', clients);
    }
  }, [clients, dbLoaded]);

  useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current.users) return;
    localStorage.setItem('freelance_management_users_v3', JSON.stringify(users));
    if (JSON.stringify(users) !== JSON.stringify(lastDbValueRef.current.users)) {
      lastDbValueRef.current.users = users;
      saveToDatabase('users', users);
    }
  }, [users, dbLoaded]);

  useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current.permissions) return;
    localStorage.setItem('freelance_management_permissions_v2', JSON.stringify(permissions));
    if (JSON.stringify(permissions) !== JSON.stringify(lastDbValueRef.current.permissions)) {
      lastDbValueRef.current.permissions = permissions;
      saveToDatabase('permissions', permissions);
    }
  }, [permissions, dbLoaded]);

  useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current.registrationRequests) return;
    localStorage.setItem('freelance_management_reg_reqs', JSON.stringify(registrationRequests));
    if (JSON.stringify(registrationRequests) !== JSON.stringify(lastDbValueRef.current.registrationRequests)) {
      lastDbValueRef.current.registrationRequests = registrationRequests;
      saveToDatabase('registrationRequests', registrationRequests);
    }
  }, [registrationRequests, dbLoaded]);

  // Automatically mark notifications as read when entering notifications tab
  useEffect(() => {
    if (activeTab === 'notifications') {
      setNotifications(prev => prev.map(n => {
        if (n.lida) return n;
        // If freelancer, only mark their own or global
        if (currentUser?.perfil === 'Freelancer') {
          const relevantFreelancers = freelancers.filter(f => f.id === currentUser.freelancerId || f.email === currentUser.email);
          const possibleFreelancerIds = [currentUser.freelancerId, ...relevantFreelancers.map(f => f.id), 'all'].filter(Boolean);
          if (possibleFreelancerIds.includes(n.freelancerId) || !n.freelancerId) {
            return { ...n, lida: true };
          }
          return n;
        }
        // If admin/gestor, mark all
        return { ...n, lida: true };
      }));
    }
  }, [activeTab, currentUser, freelancers]);

  // Synchronize currentUser and freelancers when users state changes
  useEffect(() => {
    if (!users || users.length === 0) return;
    
    // 1. Keep currentUser in sync with the fetched users database
    if (currentUser) {
      const matchInDb = users.find(u => u.id === currentUser.id);
      if (matchInDb) {
        if (
          matchInDb.nome !== currentUser.nome ||
          matchInDb.email !== currentUser.email ||
          matchInDb.perfil !== currentUser.perfil ||
          matchInDb.cpf !== currentUser.cpf ||
          matchInDb.password !== currentUser.password ||
          matchInDb.freelancerId !== currentUser.freelancerId ||
          matchInDb.username !== currentUser.username
        ) {
          setCurrentUser(prev => prev ? {
            ...prev,
            nome: matchInDb.nome,
            email: matchInDb.email,
            perfil: matchInDb.perfil,
            cpf: matchInDb.cpf,
            password: matchInDb.password,
            freelancerId: matchInDb.freelancerId,
            username: matchInDb.username
          } : null);
        }
      }
    }

    // 2. Keep freelancers in sync with corresponding users
    setFreelancers(prev => {
      let changed = false;
      const updated = prev.map(f => {
        const u = users.find(user => user.freelancerId === f.id);
        if (u) {
          if (
            f.nome !== u.nome ||
            (f.email && u.email && f.email !== u.email) ||
            (f.cpfCif && u.cpf && f.cpfCif !== u.cpf)
          ) {
            changed = true;
            return {
              ...f,
              nome: u.nome,
              email: u.email || f.email,
              cpfCif: u.cpf || f.cpfCif
            };
          }
        }
        return f;
      });
      return changed ? updated : prev;
    });
  }, [users]);

  // Real-time local date visual counter
  const [timeStr, setTimeStr] = useState('2026-06-10 23:57:28');
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const formatted = now.toISOString().replace('T', ' ').substring(0, 19);
      setTimeStr(formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Shared status modifiers
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

    // Remove confirmation notifications for any allocations that are no longer pending
    if (updatedTask.alocacoes && updatedTask.alocacoes.length > 0) {
      const nonPendingAllocations = updatedTask.alocacoes.filter(a => a.statusConfirmacao !== 'Pendente');
      if (nonPendingAllocations.length > 0) {
        setNotifications(prevNotifs => {
          const nonPendingIds = new Set(nonPendingAllocations.map(a => a.id));
          return prevNotifs.filter(n => 
            !(n.isConfirmacaoRequest && n.projetoId === updatedTask.id && n.alocacaoId && nonPendingIds.has(n.alocacaoId))
          );
        });
      }
    }
  };

  // Process direct actions from deep links (e.g. WhatsApp confirmation/decline buttons)
  useEffect(() => {
    if (!dbLoaded || tasks.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const projectId = params.get('projectId');
    const allocationId = params.get('allocationId');

    if (action && projectId && allocationId) {
      console.log(`[Deep Link Action] Processing: ${action} for project: ${projectId}, allocation: ${allocationId}`);

      const project = tasks.find(t => t.id === projectId);
      if (!project) {
        setActionStatus({
          show: true,
          type: 'error',
          title: 'Projeto Não Encontrado',
          message: 'Não foi possível encontrar o projeto relacionado a este convite.'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      const alocacao = (project.alocacoes || []).find(a => a.id === allocationId);
      if (!alocacao) {
        setActionStatus({
          show: true,
          type: 'error',
          title: 'Alocação Não Encontrada',
          message: 'Sua alocação não foi encontrada neste projeto. O convite pode ter sido cancelado ou alterado.'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Check if already responded
      if (alocacao.statusConfirmacao === 'Confirmado' && action === 'confirm') {
        setActionStatus({
          show: true,
          type: 'success',
          title: 'Já Confirmado',
          message: `Você já confirmou sua presença no projeto "${project.titulo}" como ${alocacao.funcao}.`
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (alocacao.statusConfirmacao === 'Recusado' && action === 'decline') {
        setActionStatus({
          show: true,
          type: 'success',
          title: 'Já Recusado',
          message: `Você já recusou o convite para o projeto "${project.titulo}".`
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      const newStatus: 'Confirmado' | 'Recusado' = action === 'confirm' ? 'Confirmado' : 'Recusado';
      const updatedAlocacoes = (project.alocacoes || []).map(a => {
        if (a.id === allocationId) {
          return { ...a, statusConfirmacao: newStatus };
        }
        return a;
      });

      const updatedProject = {
        ...project,
        alocacoes: updatedAlocacoes
      };

      // Apply update
      handleUpdateTask(updatedProject);

      // Clean up corresponding notifications to mark as handled
      setNotifications(prev => prev.filter(n => !(n.projetoId === projectId && n.alocacaoId === allocationId)));

      setActionStatus({
        show: true,
        type: 'success',
        title: action === 'confirm' ? 'Convite Confirmado!' : 'Convite Recusado',
        message: action === 'confirm' 
          ? `✓ Sucesso! Sua presença foi confirmada no projeto "${project.titulo}" como ${alocacao.funcao}. Obrigado!`
          : `✕ Convite recusado para o projeto "${project.titulo}". O gestor foi informado.`
      });

      // Clear the query parameters from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [dbLoaded, tasks]);

  const handleAddTask = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setCalendarEvents(prev => prev.filter(ev => ev.id !== `ev-task-${taskId}` && !ev.id.startsWith(`ev-task-${taskId}-`)));
    setNotifications(prev => prev.filter(n => n.projetoId !== taskId));
  };

  const handleAddFreelancer = (newFreelancer: Freelancer) => {
    setFreelancers(prev => [newFreelancer, ...prev]);
    const newUser = createNewUserForFreelancer(newFreelancer, users);
    setSafeUsers(prev => [newUser, ...prev]);
  };

  const handleUpdateFreelancer = (updatedFreelancer: Freelancer) => {
    setFreelancers(prev => prev.map(f => f.id === updatedFreelancer.id ? updatedFreelancer : f));
    
    // Maintain credentials synchronization
    setSafeUsers(prev => prev.map(u => {
      if (u.freelancerId === updatedFreelancer.id) {
        return {
          ...u,
          nome: updatedFreelancer.nome,
          email: updatedFreelancer.email || u.email,
          cpf: updatedFreelancer.cpfCif || u.cpf
        };
      }
      return u;
    }));

    if (currentUser?.freelancerId === updatedFreelancer.id) {
      setCurrentUser(prev => prev ? {
        ...prev,
        nome: updatedFreelancer.nome,
        email: updatedFreelancer.email || prev.email,
        cpf: updatedFreelancer.cpfCif || prev.cpf
      } : null);
    }
  };

  const handleDeleteFreelancer = (id: string, motivo: string, quemMoveu: string) => {
    const today = new Date();
    const dataPort = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()} ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
    setFreelancers(prev => prev.map(f => f.id === id ? { 
      ...f, 
      arquivado: true,
      motivoArquivamento: motivo,
      arquivadoPor: quemMoveu,
      dataArquivamento: dataPort
    } : f));
  };

  const handleRestoreFreelancer = (id: string) => {
    setFreelancers(prev => prev.map(f => f.id === id ? { ...f, arquivado: false } : f));
  };

  const handleFullyDeleteFreelancer = (id: string) => {
    setFreelancers(prev => prev.filter(f => f.id !== id));
    setTasks(prev => prev.map(t => {
      const updatedAllocations = t.alocacoes?.filter(a => a.freelancerId !== id) || [];
      const isPrimary = t.freelancerId === id;
      return {
        ...t,
        alocacoes: updatedAllocations,
        ...(isPrimary ? { freelancerId: '', freelancerNome: '' } : {})
      };
    }));
    setCalendarEvents(prev => prev.filter(e => e.freelancerId !== id));
    setSafeUsers(prev => prev.filter(u => u.freelancerId !== id));
  };

  const handleBulkImportFreelancers = (imported: Freelancer[]) => {
    setFreelancers(prev => {
      const existingIds = new Set(prev.map(f => f.id));
      const newFreelancers = imported.filter(f => !existingIds.has(f.id));
      return [...newFreelancers, ...prev];
    });
    setSafeUsers(prev => {
      const existingIds = new Set(prev.map(u => u.freelancerId));
      const newFreelancers = imported.filter(f => !existingIds.has(f.id));
      const newUsers = newFreelancers.map(f => createNewUserForFreelancer(f, prev));
      return [...newUsers, ...prev];
    });
  };

  const handleAddClient = (newClient: Client) => {
    setClients(prev => [...prev, newClient]);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleDeleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const handleAddEvent = (newEvent: CalendarEvent) => {
    setCalendarEvents(prev => [...prev, newEvent]);
  };

  const handleDeleteEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  };

  const triggerWhatsAppNotification = async (newNotif: Notification) => {
    try {
      const storedConfig = await loadFromDatabase('whatsapp_api_config');
      if (!storedConfig || !storedConfig.enabled) {
        console.log('[WhatsApp Notification] Integration is disabled or not configured.');
        return;
      }

      // Determine which phone number to send to
      let recipientPhone = '';
      if (newNotif.freelancerId && newNotif.freelancerId !== 'all' && newNotif.freelancerId !== 'Todos') {
        const currentFreelancers = (lastDbValueRef.current?.freelancers && Array.isArray(lastDbValueRef.current.freelancers) && lastDbValueRef.current.freelancers.length > 0)
          ? lastDbValueRef.current.freelancers
          : freelancers;
        const freelancer = currentFreelancers.find((f: any) => f.id === newNotif.freelancerId);
        if (freelancer) {
          recipientPhone = freelancer.celular || freelancer.telefone || '';
        }
      }

      // If no freelancer phone found or it's 'all', use defaultPhone from config
      if (!recipientPhone) {
        recipientPhone = storedConfig.defaultPhone || '';
      }

      const cleanPhone = recipientPhone.replace(/\D/g, '');
      if (!cleanPhone) {
        console.warn('[WhatsApp Notification] No phone number found for notification:', newNotif.id);
        return;
      }

      // Check if event type is active based on notification context
      let isEventEnabled = true;
      const titleLower = (newNotif.titulo || '').toLowerCase();
      
      if (newNotif.isConfirmacaoRequest || titleLower.includes('convite') || titleLower.includes('solicitação')) {
        isEventEnabled = storedConfig.events?.newAllocation ?? true;
      } else if (titleLower.includes('confirmação') || titleLower.includes('confirmado')) {
        isEventEnabled = storedConfig.events?.allocationConfirmed ?? true;
      } else if (titleLower.includes('check-in')) {
        isEventEnabled = storedConfig.events?.checkIn ?? true;
      } else if (titleLower.includes('check-out')) {
        isEventEnabled = storedConfig.events?.checkOut ?? true;
      }

      if (!isEventEnabled) {
        console.log(`[WhatsApp Notification] Event for notification "${newNotif.titulo}" is disabled in config.`);
        return;
      }

      // Construct WhatsApp message body (Title + Message)
      let textMessage = `*${newNotif.titulo}*\n\n${newNotif.mensagem}`;

      if (newNotif.isConfirmacaoRequest && newNotif.projetoId && newNotif.alocacaoId) {
        const origin = window.location.origin;
        textMessage += `\n\n🟢 *CONFIRMAR DISPONIBILIDADE*:\n${origin}/?action=confirm&projectId=${newNotif.projetoId}&allocationId=${newNotif.alocacaoId}`;
        textMessage += `\n\n🔴 *DECLINAR / RECUSAR*:\n${origin}/?action=decline&projectId=${newNotif.projetoId}&allocationId=${newNotif.alocacaoId}`;
      }

      // Set up routing attempts (Self-Healing Strategy with Interactive Buttons support)
      const rawUrl = storedConfig.apiUrl || '';
      let cleanApiUrl = rawUrl.trim().replace(/\/$/, '');
      const attempts: { name: string; endpoint: string; headers: Record<string, string>; body: any; method?: string }[] = [];

      if (storedConfig.provider === 'evolution') {
        let instance = (storedConfig.instanceId || '').trim();
        if (cleanApiUrl.includes('/message/sendText')) {
          const match = cleanApiUrl.match(/\/message\/sendText\/([^\/]+)/);
          if (match && match[1]) {
            instance = match[1];
          }
          cleanApiUrl = cleanApiUrl.split('/message/sendText')[0];
        }
        const finalInstance = instance || 'default';

        // 🔵 TRY TEXT MESSAGE STRATEGIES FIRST (Most reliable & contains confirmation links)
        attempts.push({
          name: 'Evolution API v2 (Instância na URL - apikey)',
          endpoint: `${cleanApiUrl}/message/sendText/${finalInstance}`,
          headers: {
            'Content-Type': 'application/json',
            'apikey': storedConfig.token,
            'apiKey': storedConfig.token,
          },
          body: {
            number: cleanPhone,
            text: textMessage,
            options: { delay: 1000, presence: 'composing' }
          }
        });

        attempts.push({
          name: 'Evolution API v2 (Instância no Header & Body)',
          endpoint: `${cleanApiUrl}/message/sendText`,
          headers: {
            'Content-Type': 'application/json',
            'apikey': storedConfig.token,
            'apiKey': storedConfig.token,
            'instance': finalInstance,
            'Instance': finalInstance,
          },
          body: {
            number: cleanPhone,
            text: textMessage,
            instance: finalInstance,
            options: { delay: 1000, presence: 'composing' }
          }
        });

        attempts.push({
          name: 'Evolution API v2 (URL Exata Digitada)',
          endpoint: rawUrl,
          headers: {
            'Content-Type': 'application/json',
            'apikey': storedConfig.token,
            'apiKey': storedConfig.token,
            'instance': finalInstance,
            'Instance': finalInstance,
          },
          body: {
            number: cleanPhone,
            text: textMessage,
            instance: finalInstance,
            options: { delay: 1000, presence: 'composing' }
          }
        });

        attempts.push({
          name: 'Evolution API v2 (Rota Legada /message/send/{instance})',
          endpoint: `${cleanApiUrl}/message/send/${finalInstance}`,
          headers: {
            'Content-Type': 'application/json',
            'apikey': storedConfig.token,
            'apiKey': storedConfig.token,
          },
          body: {
            number: cleanPhone,
            text: textMessage,
            options: { delay: 1000, presence: 'composing' }
          }
        });

        // 🟢 FALLBACK TO INTERACTIVE BUTTONS SECOND (If Confirmation Request)
        if (newNotif.isConfirmacaoRequest && newNotif.projetoId && newNotif.alocacaoId) {
          const origin = window.location.origin;
          const buttonsPayload = {
            number: cleanPhone,
            title: newNotif.titulo,
            description: newNotif.mensagem,
            buttons: [
              {
                type: 'url',
                displayText: '🟢 Confirmar Disponibilidade',
                url: `${origin}/?action=confirm&projectId=${newNotif.projetoId}&allocationId=${newNotif.alocacaoId}`
              },
              {
                type: 'url',
                displayText: '🔴 Recusar / Declinar',
                url: `${origin}/?action=decline&projectId=${newNotif.projetoId}&allocationId=${newNotif.alocacaoId}`
              }
            ]
          };

          attempts.push({
            name: 'Evolution API (Botões Interativos - Instância na URL)',
            endpoint: `${cleanApiUrl}/message/sendButtons/${finalInstance}`,
            headers: {
              'Content-Type': 'application/json',
              'apikey': storedConfig.token,
              'apiKey': storedConfig.token,
            },
            body: buttonsPayload
          });

          attempts.push({
            name: 'Evolution API (Botões Interativos - Instância no Body)',
            endpoint: `${cleanApiUrl}/message/sendButtons`,
            headers: {
              'Content-Type': 'application/json',
              'apikey': storedConfig.token,
              'apiKey': storedConfig.token,
              'instance': finalInstance,
              'Instance': finalInstance,
            },
            body: {
              ...buttonsPayload,
              instance: finalInstance
            }
          });
        }
      } else if (storedConfig.provider === 'zapi') {
        let zInstance = (storedConfig.instanceId || '').trim();
        let zToken = (storedConfig.token || '').trim();

        if (cleanApiUrl.includes('/instances/')) {
          const parts = cleanApiUrl.split('/instances/');
          cleanApiUrl = parts[0];
          const subparts = parts[1].split('/');
          if (subparts[0]) {
            zInstance = subparts[0];
          }
          const tokenIndex = subparts.indexOf('token');
          if (tokenIndex !== -1 && subparts[tokenIndex + 1]) {
            zToken = subparts[tokenIndex + 1];
          }
        }

        const finalInstance = zInstance || 'SUA_INSTANCIA';
        const finalToken = zToken || 'SEU_TOKEN';

        const domains = [cleanApiUrl];
        if (cleanApiUrl.includes('api.z-api.io')) {
          domains.push(cleanApiUrl.replace('api.z-api.io', 'gateway.z-api.io'));
        } else if (cleanApiUrl.includes('gateway.z-api.io')) {
          domains.push(cleanApiUrl.replace('gateway.z-api.io', 'api.z-api.io'));
        }

        const pairs = [
          { inst: finalInstance, tok: finalToken, label: 'Padrão' },
          { inst: finalToken, tok: finalInstance, label: 'Invertido' }
        ];

        // 🔵 TRY TEXT MESSAGE STRATEGIES FIRST (Most reliable & contains confirmation links)
        for (const dom of domains) {
          for (const pair of pairs) {
            // Combination 0: With dedicated client-token from input (If provided)
            if (storedConfig.clientToken && storedConfig.clientToken.trim() !== '') {
              attempts.push({
                name: `Z-API (${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} + Client-Token Dedicado)`,
                endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-text`,
                headers: { 
                  'Content-Type': 'application/json',
                  'client-token': storedConfig.clientToken.trim()
                },
                body: {
                  phone: cleanPhone,
                  message: textMessage
                }
              });
            }

            // Combination 1: With client-token header from storedConfig.token
            attempts.push({
              name: `Z-API (${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} + Client-Token do Input)`,
              endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-text`,
              headers: { 
                'Content-Type': 'application/json',
                'client-token': storedConfig.token || ''
              },
              body: {
                phone: cleanPhone,
                message: textMessage
              }
            });

            // Combination 2: With client-token header from tok
            attempts.push({
              name: `Z-API (${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} + Client-Token Extraído)`,
              endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-text`,
              headers: { 
                'Content-Type': 'application/json',
                'client-token': pair.tok
              },
              body: {
                phone: cleanPhone,
                message: textMessage
              }
            });

            // Combination 3: Without client-token header
            attempts.push({
              name: `Z-API (${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} Sem Header)`,
              endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-text`,
              headers: { 'Content-Type': 'application/json' },
              body: {
                phone: cleanPhone,
                message: textMessage
              }
            });
          }
        }

        // Raw exact URL checks
        if (storedConfig.clientToken && storedConfig.clientToken.trim() !== '') {
          attempts.push({
            name: 'Z-API (URL Exata + Client-Token Dedicado)',
            endpoint: rawUrl,
            headers: { 
              'Content-Type': 'application/json',
              'client-token': storedConfig.clientToken.trim()
            },
            body: {
              phone: cleanPhone,
              message: textMessage
            }
          });
        }

        attempts.push({
          name: 'Z-API (URL Exata + Client-Token do Input)',
          endpoint: rawUrl,
          headers: { 
            'Content-Type': 'application/json',
            'client-token': storedConfig.token || ''
          },
          body: {
            phone: cleanPhone,
            message: textMessage
          }
        });

        attempts.push({
          name: 'Z-API (URL Exata Sem Header)',
          endpoint: rawUrl,
          headers: { 'Content-Type': 'application/json' },
          body: {
            phone: cleanPhone,
            message: textMessage
          }
        });

        // 🟢 FALLBACK TO INTERACTIVE BUTTONS SECOND (If Confirmation Request)
        if (newNotif.isConfirmacaoRequest && newNotif.projetoId && newNotif.alocacaoId) {
          const origin = window.location.origin;
          const buttonsPayload = {
            phone: cleanPhone,
            message: `*${newNotif.titulo}*\n\n${newNotif.mensagem}`,
            buttonList: [
              {
                buttonId: "confirm",
                buttonText: "🟢 Confirmar",
                type: "link",
                value: `${origin}/?action=confirm&projectId=${newNotif.projetoId}&allocationId=${newNotif.alocacaoId}`
              },
              {
                buttonId: "decline",
                buttonText: "🔴 Recusar",
                type: "link",
                value: `${origin}/?action=decline&projectId=${newNotif.projetoId}&allocationId=${newNotif.alocacaoId}`
              }
            ],
            buttonActions: [
              {
                buttonId: "confirm",
                buttonText: "🟢 Confirmar",
                type: "link",
                value: `${origin}/?action=confirm&projectId=${newNotif.projetoId}&allocationId=${newNotif.alocacaoId}`
              },
              {
                buttonId: "decline",
                buttonText: "🔴 Recusar",
                type: "link",
                value: `${origin}/?action=decline&projectId=${newNotif.projetoId}&allocationId=${newNotif.alocacaoId}`
              }
            ]
          };

          for (const dom of domains) {
            for (const pair of pairs) {
              if (storedConfig.clientToken && storedConfig.clientToken.trim() !== '') {
                attempts.push({
                  name: `Z-API (Botões - ${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} + Client-Token Dedicado)`,
                  endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-button-actions`,
                  headers: { 
                    'Content-Type': 'application/json',
                    'client-token': storedConfig.clientToken.trim()
                  },
                  body: buttonsPayload
                });
              }

              attempts.push({
                name: `Z-API (Botões - ${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} + Client-Token do Input)`,
                endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-button-actions`,
                headers: { 
                  'Content-Type': 'application/json',
                  'client-token': storedConfig.token || ''
                },
                body: buttonsPayload
              });

              attempts.push({
                name: `Z-API (Botões - ${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} + Client-Token Extraído)`,
                endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-button-actions`,
                headers: { 
                  'Content-Type': 'application/json',
                  'client-token': pair.tok
                },
                body: buttonsPayload
              });

              attempts.push({
                name: `Z-API (Botões - ${pair.label} - ${dom.includes('gateway') ? 'Gateway' : 'API'} Sem Header)`,
                endpoint: `${dom}/instances/${pair.inst}/token/${pair.tok}/send-button-actions`,
                headers: { 'Content-Type': 'application/json' },
                body: buttonsPayload
              });
            }
          }

          // Raw exact URL checks with Button Endpoint for Z-API
          const zapiRawButtonUrl = rawUrl.replace(/\/send-text$/, '/send-button-actions');
          if (storedConfig.clientToken && storedConfig.clientToken.trim() !== '') {
            attempts.push({
              name: 'Z-API (Botões - URL Exata + Client-Token Dedicado)',
              endpoint: zapiRawButtonUrl.includes('send-button-actions') ? zapiRawButtonUrl : `${zapiRawButtonUrl}/send-button-actions`,
              headers: { 
                'Content-Type': 'application/json',
                'client-token': storedConfig.clientToken.trim()
              },
              body: buttonsPayload
            });
          }

          attempts.push({
            name: 'Z-API (Botões - URL Exata + Client-Token do Input)',
            endpoint: zapiRawButtonUrl.includes('send-button-actions') ? zapiRawButtonUrl : `${zapiRawButtonUrl}/send-button-actions`,
            headers: { 
              'Content-Type': 'application/json',
              'client-token': storedConfig.token || ''
            },
            body: buttonsPayload
          });

          attempts.push({
            name: 'Z-API (Botões - URL Exata Sem Header)',
            endpoint: zapiRawButtonUrl.includes('send-button-actions') ? zapiRawButtonUrl : `${zapiRawButtonUrl}/send-button-actions`,
            headers: { 'Content-Type': 'application/json' },
            body: buttonsPayload
          });
        }
      } else if (storedConfig.provider === 'meta') {
        let metaEndpoint = '';
        if (!cleanApiUrl.endsWith('/messages') && storedConfig.instanceId) {
          metaEndpoint = `${cleanApiUrl}/${storedConfig.instanceId}/messages`;
        } else if (!cleanApiUrl.includes('/messages')) {
          metaEndpoint = `${cleanApiUrl}/messages`;
        } else {
          metaEndpoint = cleanApiUrl;
        }

        attempts.push({
          name: 'Meta Cloud API (Formatado)',
          endpoint: metaEndpoint,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedConfig.token}`
          },
          body: {
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: textMessage }
          }
        });
      } else if (storedConfig.provider === 'callmebot') {
        let cleanApiUrl = rawUrl.trim().replace(/\/$/, '');
        if (!cleanApiUrl) {
          cleanApiUrl = 'https://api.callmebot.com/whatsapp.php';
        }
        attempts.push({
          name: 'CallMeBot WhatsApp (GET API)',
          endpoint: `${cleanApiUrl}?phone=${cleanPhone}&text=${encodeURIComponent(textMessage)}&apikey=${storedConfig.token}`,
          headers: {},
          body: null,
          method: 'GET'
        });
      } else {
        // Custom Webhook / Generic POST API
        attempts.push({
          name: 'Personalizado / Webhook (URL Exata)',
          endpoint: rawUrl,
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': storedConfig.token,
            'Authorization': `Bearer ${storedConfig.token}`,
            'apikey': storedConfig.token,
            'apiKey': storedConfig.token,
          },
          body: {
            to: cleanPhone,
            phone: cleanPhone,
            number: cleanPhone,
            text: textMessage,
            message: textMessage,
            textMessage: { text: textMessage },
            instance: storedConfig.instanceId
          }
        });
      }

      // Try sending using the built attempts
      let sentSuccessfully = false;
      for (const attempt of attempts) {
        try {
          console.log(`[WhatsApp Notification] Trying strategy "${attempt.name}" to endpoint: ${attempt.endpoint}`);
          
          let res: Response;
          const isDirect = storedConfig.requestMode === 'direct';

          if (isDirect) {
            const directHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
              ...(attempt.headers || {})
            };
            const fetchOptions: RequestInit = {
              method: attempt.method || 'POST',
              headers: directHeaders,
            };
            if (attempt.body && attempt.method !== 'GET' && attempt.method !== 'HEAD') {
              fetchOptions.body = typeof attempt.body === 'string' ? attempt.body : JSON.stringify(attempt.body);
            }
            res = await fetch(attempt.endpoint, fetchOptions);
          } else {
            let proxyResponse: Response;
            try {
              proxyResponse = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  endpoint: attempt.endpoint,
                  method: attempt.method || 'POST',
                  headers: attempt.headers,
                  body: attempt.body
                })
              });
            } catch (proxyNetworkErr) {
              console.warn('[WhatsApp Notification] Proxy server connection failed, falling back to direct:', proxyNetworkErr);
              proxyResponse = new Response('404 Not Found', { status: 404 });
            }

            if (proxyResponse.status === 404) {
              console.log('[WhatsApp Notification] Server Proxy endpoint returned 404. Falling back to Direct client-side routing!');
              const directHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(attempt.headers || {})
              };
              const fetchOptions: RequestInit = {
                method: attempt.method || 'POST',
                headers: directHeaders,
              };
              if (attempt.body && attempt.method !== 'GET' && attempt.method !== 'HEAD') {
                fetchOptions.body = typeof attempt.body === 'string' ? attempt.body : JSON.stringify(attempt.body);
              }
              res = await fetch(attempt.endpoint, fetchOptions);
            } else {
              res = proxyResponse;
            }
          }
          
          if (res.ok) {
            console.log(`[WhatsApp Notification] Successfully sent via strategy "${attempt.name}"`);
            sentSuccessfully = true;
            break;
          } else {
            const errText = await res.text();
            console.warn(`[WhatsApp Notification] Strategy "${attempt.name}" failed with status ${res.status}:`, errText);
          }
        } catch (fetchErr: any) {
          console.warn(`[WhatsApp Notification] Strategy "${attempt.name}" connection error:`, fetchErr.message || fetchErr);
        }
      }

      if (!sentSuccessfully) {
        console.error('[WhatsApp Notification] All strategies failed for notification:', newNotif.id);
      }
    } catch (err) {
      console.error('[WhatsApp Notification] Critical error in triggerWhatsAppNotification:', err);
    }
  };

  const handleAddNotification = (newNotif: Notification) => {
    setNotifications(prev => {
      if (prev.some(n => n.id === newNotif.id)) {
        return prev;
      }
      return deduplicateNotifications([newNotif, ...prev]);
    });

    // Envia automaticamente para o WhatsApp
    triggerWhatsAppNotification(newNotif).catch(err => {
      console.error('Erro ao disparar notificação de WhatsApp:', err);
    });
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationsCount = notifications.filter(n => {
    if (n.lida) return false;
    if (currentUser?.perfil === 'Freelancer') {
      const uEmail = currentUser.email?.toLowerCase();
      const relevantFreelancers = freelancers.filter(f => f.id === currentUser.freelancerId || (f.email && f.email.toLowerCase() === uEmail));
      const possibleFreelancerIds = [currentUser.freelancerId, ...relevantFreelancers.map(f => f.id), 'all'].filter(Boolean);
      return possibleFreelancerIds.includes(n.freelancerId) || !n.freelancerId;
    }
    return true;
  }).length;

  const currentUserPermissions = permissions.find(p => p.perfil === currentUser?.perfil) || {
    perfil: currentUser?.perfil || 'Freelancer',
    canViewDashboard: true,
    canManageProjects: false,
    canViewRegistry: false,
    canEditRegistry: false,
    canViewCalendarAll: false,
    canViewAdminPanel: false,
    canConfigurePermissions: false,
  };

  const syncIndicator = !dbLoaded && (
    <div className="fixed bottom-4 right-4 bg-neutral-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 z-[9999] border border-neutral-800 animate-fade-in text-xs font-medium">
      <Clock className="w-3.5 h-3.5 animate-spin text-purple-400" />
      <span>Sincronizando com nuvem...</span>
    </div>
  );

  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-neutral-900">
        {syncIndicator}
        <AnimatePresence>
          {sessionMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-6 left-1/2 z-50 max-w-md w-[calc(100%-2rem)] px-4"
            >
              <div className="bg-purple-600 text-white font-medium px-4 py-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 border border-purple-500/30 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-white animate-pulse" />
                  <span className="text-sm tracking-wide leading-relaxed">{sessionMessage}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSessionMessage(null)}
                  className="text-white/80 hover:text-white hover:bg-white/10 w-6 h-6 flex items-center justify-center rounded-lg transition-colors text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <LoginDashboard 
          freelancers={freelancers} 
          users={users}
          onUpdateUsers={setSafeUsers}
          onAddRegistrationRequest={(req) => {
            setRegistrationRequests(prev => [...prev, req]);
          }}
          onLogin={(user) => { 
            setSessionMessage(null); // Clear session message upon successful login
            setCurrentUser(user);
            const userPerms = permissions.find(p => p.perfil === user.perfil);
            if (user.perfil === 'Freelancer') {
              setActiveTab('dashboard');
            } else if (userPerms?.canViewDashboard) {
              setActiveTab('dashboard');
            } else if (userPerms?.canManageProjects) {
              setActiveTab('projects');
            } else if (userPerms?.canViewRegistry) {
              setActiveTab('freelancers');
            } else {
              setActiveTab('notifications');
            }
          }} 
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col md:flex-row antialiased select-none text-neutral-850 dark:text-neutral-100 md:p-3 md:gap-3 overflow-hidden">
      {syncIndicator}

      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden flex items-center justify-between bg-gradient-to-r from-[#18181b] to-[#09090b] text-white px-5 py-3 border-b border-white/5 shadow-md z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="10" height="32" rx="4" fill="#7C3AED" />
            <rect x="22" y="8" width="18" height="10" rx="4" fill="#3B82F6" />
            <rect x="22" y="22" width="12" height="10" rx="4" fill="#60A5FA" opacity="0.8" />
          </svg>
          <span className="font-bold tracking-tight text-sm text-white">Frello</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Unread Notifications Dot indicator */}
          <button 
            onClick={() => {
              setActiveTab('notifications');
              setIsMobileMenuOpen(false);
            }}
            className="relative p-1.5 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full" />
            )}
          </button>

          {/* Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[45] md:hidden animate-fade-in"
        />
      )}

      {/* 1. Left Sidebar Navigation Container */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`fixed inset-y-0 left-0 z-50 md:relative md:flex ${
          isMobileMenuOpen ? 'flex w-[280px]' : 'hidden'
        } ${
          sidebarEffectiveCollapsed ? 'md:w-[88px]' : 'md:w-[280px]'
        } bg-gradient-to-b from-[#18181b]/95 to-[#09090b]/95 backdrop-blur-2xl text-white shrink-0 flex-col justify-between md:rounded-2xl border border-white/5 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] h-full overflow-hidden`}
      >
        
        {/* Brand layout */}
        <div>
          <div className="h-[76px] pl-8 pr-6 border-b border-white/5 flex items-center justify-between overflow-hidden shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="8" width="10" height="32" rx="4" fill="#7C3AED" />
                  <rect x="22" y="8" width="18" height="10" rx="4" fill="#3B82F6" />
                  <rect x="22" y="22" width="12" height="10" rx="4" fill="#60A5FA" opacity="0.8" />
                </svg>
              </span>
              <div className={`transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden whitespace-nowrap ${sidebarEffectiveCollapsed ? 'max-w-0 opacity-0' : 'max-w-[100px] opacity-100'}`}>
                <h1 className="font-bold tracking-tight text-sm text-white">Frello</h1>
              </div>
            </div>

            {/* Close button on mobile or Retraction settings button on desktop */}
            <div className="flex items-center shrink-0">
              {/* Close Button on Mobile */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden w-8 h-8 rounded-lg border border-white/5 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
                title="Fechar Menu"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Retraction settings button on desktop */}
              <div className={`hidden md:flex transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden items-center shrink-0 ${sidebarEffectiveCollapsed ? 'w-0 opacity-0' : 'w-8 opacity-100'}`}>
                <button
                  type="button"
                  onClick={() => {
                    const newVal = !retractEnabled;
                    setRetractEnabled(newVal);
                    if (newVal) {
                      setIsRetracted(true);
                    } else {
                      setIsRetracted(false);
                    }
                  }}
                  className={`w-8 h-8 rounded-lg border transition-all duration-300 ease-out cursor-pointer flex items-center justify-center shrink-0 ${
                    retractEnabled 
                      ? 'border-amber-500/30 bg-purple-600/10 text-purple-500 hover:bg-purple-600/20' 
                      : 'border-white/5 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={retractEnabled ? 'Desativar retração das abas (Mover manual)' : 'Ativar retração automática das abas'}
                >
                  {retractEnabled ? (
                    <ChevronsLeft className="w-3.5 h-3.5 text-purple-500" />
                  ) : (
                    <ChevronsRight className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="p-4 space-y-1 overflow-x-hidden">
            {currentUserPermissions.canViewDashboard && (
              <button
                type="button"
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                className={getTabButtonClass('dashboard')}
                title={currentUser?.perfil === 'Freelancer' ? 'Meu Portal de Trabalho' : 'Dashboard Geral'}
              >
                <BarChart3 className="w-4.5 h-4.5 shrink-0" />
                <span className="truncate">{currentUser?.perfil === 'Freelancer' ? 'Meu Portal de Trabalho' : 'Dashboard Geral'}</span>
              </button>
            )}

            {currentUserPermissions.canManageProjects && (
              <button
                type="button"
                onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }}
                className={getTabButtonClass('projects')}
                title="Projetos e Diárias"
              >
                <Briefcase className="w-4.5 h-4.5 shrink-0" />
                <span className="truncate">Projetos e Diárias</span>
              </button>
            )}

            {currentUserPermissions.canViewRegistry && (
              <button
                type="button"
                onClick={() => { setActiveTab('freelancers'); setIsMobileMenuOpen(false); }}
                className={getTabButtonClass('freelancers')}
                title="Cadastro de Talentos"
              >
                <Users className="w-4.5 h-4.5 shrink-0" />
                <span className="truncate">Cadastro de Talentos</span>
              </button>
            )}

            {(currentUserPermissions.canViewCalendarAll || currentUser?.perfil === 'Freelancer') && (
              <button
                type="button"
                onClick={() => { setActiveTab('calendar'); setIsMobileMenuOpen(false); }}
                className={getTabButtonClass('calendar')}
                title={currentUser?.perfil === 'Freelancer' ? 'Minha Agenda' : 'Agenda'}
              >
                <Calendar className="w-4.5 h-4.5 shrink-0" />
                <span className="truncate">{currentUser?.perfil === 'Freelancer' ? 'Minha Agenda' : 'Agenda'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => { setActiveTab('notifications'); setIsMobileMenuOpen(false); }}
              className={getTabButtonClass('notifications')}
              title="Alertas e Notificações"
            >
              <div className="relative flex items-center justify-center shrink-0">
                <Bell className="w-4.5 h-4.5 shrink-0" />
                {sidebarEffectiveCollapsed && unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-600 rounded-full border border-neutral-900 animate-pulse" />
                )}
              </div>
              <div className="flex items-center justify-between w-full min-w-0">
                  <span className="truncate">Alertas e Notificações</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="bg-purple-600 text-neutral-950 font-bold px-1.5 py-0.5 rounded text-[9px] font-mono leading-none ml-1 shrink-0">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </div>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('workstation'); setIsMobileMenuOpen(false); }}
              className={getTabButtonClass('workstation')}
              title="Workstation (Kanban)"
            >
              <Layers className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">Workstation (Kanban)</span>
            </button>

            {(currentUserPermissions.canViewAdminPanel || currentUserPermissions.canConfigurePermissions) && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('administration');
                    if (currentUserPermissions.canViewAdminPanel) {
                      setActiveAdminModule('usuarios');
                    } else if (currentUserPermissions.canConfigurePermissions) {
                      setActiveAdminModule('permissoes');
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={getTabButtonClass('administration')}
                  title="Administração"
                >
                  <Shield className="w-4.5 h-4.5 shrink-0" />
                  <span className="truncate">Administração</span>
                </button>


              </div>
            )}
          </nav>
        </div>

        {/* Footer profile status area */}
        <div className="border-t border-white/5 p-4 space-y-3 overflow-hidden">
          <div className="bg-white/5 rounded-2xl border border-white/5 p-2 h-14 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl bg-purple-600 shrink-0 flex items-center justify-center font-bold text-xs uppercase text-neutral-950 font-sans shadow-inner"
                title={currentUser ? `${currentUser.nome} (${currentUser.perfil})` : 'Usuário'}
              >
                {currentUser ? currentUser.nome.trim().substring(0, 2) : 'GA'}
              </div>
              <div className={`transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden whitespace-nowrap flex flex-col justify-center ${sidebarEffectiveCollapsed ? 'w-0 opacity-0' : 'w-[120px] opacity-100'}`}>
                <p className="text-xs font-extrabold text-neutral-100 truncate" title={currentUser?.nome}>
                  {currentUser?.nome}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] px-1 bg-purple-500/20 text-purple-600 border border-amber-500/20 rounded font-mono font-bold uppercase tracking-wider truncate">
                    {currentUser?.perfil}
                  </span>
                </div>
              </div>
            </div>
            
            <div className={`transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden flex items-center shrink-0 ${sidebarEffectiveCollapsed ? 'w-0 opacity-0' : 'w-16 opacity-100 gap-1'}`}>
              <button
                type="button"
                onClick={() => setIsChangePasswordModalOpen(true)}
                className="text-neutral-400 hover:text-purple-400 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-800 transition-all duration-300 ease-out cursor-pointer shrink-0"
                title="Alterar Senha"
              >
                <Settings className="w-4.5 h-4.5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentUser(null);
                }}
                className="text-neutral-400 hover:text-rose-400 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-800 transition-all duration-300 ease-out cursor-pointer shrink-0"
                title="Encerrar Sessão / Sair"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Internal simulated clock strictly without telemetry credit slop */}
          <div className={`bg-black/20 h-8 rounded-xl border border-white/5 font-mono text-[9px] text-neutral-400 flex items-center select-none overflow-hidden mx-auto transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${sidebarEffectiveCollapsed ? 'justify-center w-[50px] px-0' : 'justify-between w-full px-3'}`}>
            <div className={`transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center gap-1.5 overflow-hidden whitespace-nowrap ${sidebarEffectiveCollapsed ? 'w-0 opacity-0' : 'w-[80px] opacity-100'}`}>
              <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span>Sincronizado</span>
            </div>
            <div className="flex items-center justify-center shrink-0">
              <span className={`font-semibold text-neutral-300 transition-all duration-500 ${sidebarEffectiveCollapsed ? 'text-[8px]' : 'text-[9px]'}`}>
                {sidebarEffectiveCollapsed ? timeStr.substring(11, 16) : `${timeStr.substring(11, 16)} UTC`}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main content rendering body */}
      <main className="flex-1 flex flex-col min-w-0 md:rounded-2xl bg-neutral-50 dark:bg-neutral-950 overflow-hidden shadow-xl border border-neutral-200/50 dark:border-white/5 h-full relative" id="main-content">
        
        {/* Global top sub-banner bar */}
        <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 sm:px-8 py-3.5 flex items-center justify-end gap-3 text-neutral-700 dark:text-neutral-250 shadow-xs">
          

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex items-center gap-2">
                {/* Sun/Moon Toggle Button */}
                <button
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300 ease-out cursor-pointer text-neutral-500 dark:text-neutral-450 flex items-center justify-center shadow-2xs"
                  title={resolvedTheme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
                >
                  {resolvedTheme === 'dark' ? (
                    <Moon className="w-4 h-4 text-purple-500 fill-amber-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-purple-600 fill-amber-500" />
                  )}
                </button>

                {/* Settings Configuration Gear Button */}
                <button
                  onClick={() => setShowConfigPopover(!showConfigPopover)}
                  className={`p-1.5 rounded-lg border transition-all duration-300 ease-out cursor-pointer flex items-center justify-center shadow-2xs ${
                    showConfigPopover 
                      ? 'border-purple-500 bg-amber-50/20 text-neutral-900' 
                      : 'border-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500'
                  }`}
                  title="Configurações de Customização"
                >
                  <Settings className={`w-4 h-4 ${showConfigPopover ? 'animate-spin-slow text-purple-600' : ''}`} />
                </button>
              </div>

              {/* Setting popover options */}
              {showConfigPopover && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-neutral-250 p-4 z-50 animate-fade-in font-sans">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 mb-3">
                    <span className="text-xs font-bold text-neutral-850 uppercase tracking-wider block">Customização do Site</span>
                    <button 
                      onClick={() => setShowConfigPopover(false)}
                      className="text-neutral-400 hover:text-neutral-600 font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Theme choice section */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Modo de Aparência</span>
                      <div className="grid grid-cols-3 gap-1.5 bg-neutral-50 p-1 rounded-lg border border-neutral-150">
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`py-1.5 px-2 rounded font-medium text-center transition-all ${
                            theme === 'light'
                              ? 'bg-white text-neutral-950 shadow-2xs font-bold'
                              : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                        >
                          Claro
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`py-1.5 px-2 rounded font-medium text-center transition-all ${
                            theme === 'dark'
                              ? 'bg-white text-neutral-950 shadow-2xs font-bold'
                              : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                        >
                          Escuro
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('system')}
                          className={`py-1.5 px-2 rounded font-medium text-center transition-all ${
                            theme === 'system'
                              ? 'bg-white text-neutral-950 shadow-2xs font-bold'
                              : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                        >
                          Auto
                        </button>
                      </div>
                    </div>

                    {/* Checkbox for sync theme with Operating system */}
                    <div className="flex items-start gap-2 pt-1 border-t border-neutral-100 pt-3">
                      <input 
                        type="checkbox"
                        id="sync-os-theme"
                        checked={theme === 'system'}
                        onChange={(e) => setTheme(e.target.checked ? 'system' : resolvedTheme)}
                        className="mt-0.5 rounded text-purple-600 focus:ring-amber-400 border-neutral-300 w-3.5 h-3.5 cursor-pointer accent-amber-500"
                      />
                      <label htmlFor="sync-os-theme" className="text-[11px] text-neutral-600 leading-tight cursor-pointer select-none">
                        <span className="font-semibold text-neutral-800 block">Sincronizar Tema do Sistema</span>
                        Selecionar o tema automaticamente pelo sistema operacional do usuário
                      </label>
                    </div>

                    <div className="border-t border-neutral-100 pt-3">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 block mb-2 font-mono tracking-wider">Identificação do SO do Usuário</span>
                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-150 space-y-1.5">
                        <div className="flex items-center justify-between font-mono text-[9px] text-neutral-500">
                          <span>Predileção do SO:</span>
                          <span className="font-bold text-neutral-700">
                            {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Escuro (Dark)' : 'Claro (Light)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[9px] text-neutral-500">
                          <span>Plataforma Navegador:</span>
                          <span className="font-bold text-neutral-700 truncate max-w-[120px]">
                            {navigator.platform || 'Desconhecida'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tab view containers */}
        <div className={`flex-1 p-6 sm:p-8 w-full mx-auto overflow-y-auto ${activeTab === 'workstation' ? 'max-w-none px-4 sm:px-6 md:px-8' : 'max-w-7xl'}`}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              tasks={tasks}
              freelancers={freelancers}
              clients={clients}
              onUpdateTask={handleUpdateTask}
              onAddTask={handleAddTask}
              currentUser={currentUser}
              onNavigateToProject={(projectId) => {
                setNavigatedProjectId(projectId);
                setActiveTab('projects');
              }}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectManagement 
              tasks={tasks}
              freelancers={freelancers}
              clients={clients}
              onUpdateTask={handleUpdateTask}
              onAddTask={handleAddTask}
              onAddNotification={handleAddNotification}
              onDeleteTask={handleDeleteTask}
              initialSelectedTaskId={navigatedProjectId}
              onClearInitialSelectedTaskId={() => setNavigatedProjectId(null)}
              companyLogo={companyLogo}
              pdfTheme={pdfTheme}
              currentUser={currentUser}
              onUpdateFreelancer={handleUpdateFreelancer}
            />
          )}

          {activeTab === 'freelancers' && (
            <FreelancerRegistry 
              tasks={tasks}
              freelancers={freelancers}
              onAddFreelancer={handleAddFreelancer}
              onUpdateFreelancer={handleUpdateFreelancer}
              onDeleteFreelancer={handleDeleteFreelancer}
              readOnly={!currentUserPermissions.canEditRegistry}
              onNavigateToProject={(projectId) => {
                setNavigatedProjectId(projectId);
                setActiveTab('projects');
              }}
              currentUser={currentUser}
              pendingApprovalRegistration={pendingApprovalRegistration}
              onClearPendingRegistration={() => setPendingApprovalRegistration(null)}
              onRegistrationCompleted={(reqId) => {
                setRegistrationRequests(prev => prev.filter(r => r.id !== reqId));
              }}
            />
          )}

          {activeTab === 'calendar' && (
            <FreelancerCalendarView 
              freelancers={freelancers}
              tasks={tasks}
              currentUser={currentUser}
              events={calendarEvents.filter(ev => {
                // Ignore ghost delivery dates of deleted tasks
                if (ev.id.startsWith('ev-task-')) {
                  const taskId = ev.id.replace('ev-task-', '').split('-')[0];
                  return tasks.some(t => t.id === taskId || ev.id.includes(t.id));
                }
                return true;
              })}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
              onNavigateToProject={(projectId) => {
                setNavigatedProjectId(projectId);
                setActiveTab('projects');
              }}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenter 
              freelancers={freelancers}
              notifications={notifications}
              onAddNotification={handleAddNotification}
              onMarkNotificationAsRead={handleMarkAsRead}
              onDeleteNotification={handleDeleteNotification}
              onClearAllNotifications={handleClearAllNotifications}
              tasks={tasks}
              onUpdateTask={handleUpdateTask}
              currentUser={currentUser}
              onNavigateToKanbanCard={(cardId) => {
                setHighlightKanbanCardId(cardId);
                setActiveTab('workstation');
              }}
            />
          )}

          {activeTab === 'administration' && (
            <Administration 
              freelancers={freelancers}
              tasks={tasks}
              clients={clients}
              registrationRequests={registrationRequests}
              onApproveRegistrationRequest={(req) => {
                // To display modal in FreelancerRegistry, we need to pass pendingRegistration to it and change tab.
                setActiveTab('freelancers');
                setPendingApprovalRegistration(req);
              }}
              onRejectRegistrationRequest={(reqId) => {
                setRegistrationRequests(prev => prev.filter(r => r.id !== reqId));
              }}
              activeSubTab={activeAdminModule}
              setActiveSubTab={setActiveAdminModule}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onRestoreFreelancer={handleRestoreFreelancer}
              onFullyDeleteFreelancer={handleFullyDeleteFreelancer}
              onBulkImportFreelancers={handleBulkImportFreelancers}
              permissions={permissions}
              onUpdatePermissions={(updated) => setPermissions(updated)}
              onResetToDefaults={handleResetToDefaultPermissions}
              currentUserProfile={currentUser?.perfil || ''}
              canConfigurePermissions={currentUserPermissions.canConfigurePermissions}
              users={users}
              onUpdateUsers={setSafeUsers}
              colorTheme={colorTheme}
              onUpdateColorTheme={setColorTheme}
              companyLogo={companyLogo}
              onUpdateCompanyLogo={setCompanyLogo}
              pdfTheme={pdfTheme}
              onUpdatePdfTheme={setPdfTheme}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'workstation' && (
            <Workstation 
              freelancers={freelancers} 
              currentUser={currentUser} 
              onAddNotification={handleAddNotification} 
              notifications={notifications} 
              onMarkNotificationAsRead={handleMarkAsRead}
              highlightCardId={highlightKanbanCardId}
              onClearHighlight={() => setHighlightKanbanCardId(null)}
            />
          )}
        </div>
      </main>

      {/* Deep Link Action status overlay */}
      {actionStatus && actionStatus.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 dark:border-neutral-800 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-purple-600/10 text-purple-600">
              {actionStatus.type === 'success' ? (
                <div className="text-2xl font-bold text-emerald-500">✓</div>
              ) : (
                <div className="text-2xl font-bold text-rose-500">✕</div>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
              {actionStatus.title}
            </h3>
            
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {actionStatus.message}
            </p>
            
            <button
              type="button"
              onClick={() => setActionStatus(null)}
              className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-850 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              OK, ENTENDIDO
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          currentUser={currentUser}
          users={users}
          onUpdateUsers={setSafeUsers}
        />
      )}
    </div>
  );
}
