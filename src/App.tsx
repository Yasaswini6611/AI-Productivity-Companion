import React, { useState, useEffect } from 'react';
import { 
  Plus, Sparkles, CheckSquare, Calendar as CalendarIcon, 
  Settings, Award, LogOut, Sun, Moon, Menu, X, 
  Trash2, ShieldCheck, Wifi, WifiOff, Bell, Play, FileText, CheckCircle, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Habit, Goal, Recommendation } from './types';
import LoginScreen from './components/LoginScreen';
import TaskPrioritization from './components/TaskPrioritization';
import CalendarView from './components/CalendarView';
import VoiceAssistant from './components/VoiceAssistant';
import ProactiveRecommendations from './components/ProactiveRecommendations';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { encryptData, decryptData } from './lib/encryption';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isMockUser, setIsMockUser] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matrix' | 'calendar' | 'habits' | 'assistant' | 'analytics'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [productivityScore, setProductivityScore] = useState<number>(78);
  const [scoreReason, setScoreReason] = useState<string>("Your productivity balance is solid. Address near high-priority tasks to secure your streaks.");

  // Control States
  const [loadingAIPlan, setLoadingAIPlan] = useState<string | null>(null);
  const [loadingPrioritize, setLoadingPrioritize] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [isOnline, setIsOnline] = useState(true); // Toggleable for testing Offline Mode!
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: string }>>([]);

  // Form States
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskDate, setNewTaskDate] = useState('2026-06-30');
  const [newTaskCategory, setNewTaskCategory] = useState('Work');

  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitFreq, setNewHabitFreq] = useState('daily');

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalProgress, setNewGoalProgress] = useState(0);
  const [newGoalDate, setNewGoalDate] = useState('2026-07-31');

  // Load user theme preference
  useEffect(() => {
    document.documentElement.className = isDark ? 'dark bg-neutral-950 text-neutral-50' : 'bg-neutral-50 text-neutral-900';
  }, [isDark]);

  // Push notifications generator helper
  const addNotification = (message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);

    // Audio cue if Speech is supported
    try {
      if ('speechSynthesis' in window && type === 'alert') {
        const u = new SpeechSynthesisUtterance(message);
        u.volume = 0.4;
        window.speechSynthesis.speak(u);
      }
    } catch (_) {}
  };

  // Text-To-Speech Synthesis helper
  const triggerSpeech = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // cancel current speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn("Speech synthesis error", err);
    }
  };

  // Seed sample initial data on initial load to avoid empty view
  const seedInitialData = () => {
    const initialTasks: Task[] = [
      {
        id: 'task_1',
        title: 'Submit college research thesis draft',
        description: 'Complete the bibliography and the methodology summary section.',
        priority: 'high',
        status: 'pending',
        dueDate: '2026-06-30',
        category: 'Education',
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task_2',
        title: 'Schedule pre-seed investor slide review',
        description: 'Review slide 4 valuation figures before the call.',
        priority: 'high',
        status: 'pending',
        dueDate: '2026-07-01',
        category: 'Work',
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task_3',
        title: 'Pay server hosting invoice',
        description: 'Renewing standard cloud storage clusters.',
        priority: 'medium',
        status: 'completed',
        dueDate: '2026-06-29',
        category: 'Finance',
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const initialHabits: Habit[] = [
      {
        id: 'habit_1',
        title: 'Read 15 pages of technical book',
        frequency: 'daily',
        streak: 5,
        logs: ['2026-06-28', '2026-06-27'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'habit_2',
        title: 'Write 100 lines of functional code',
        frequency: 'daily',
        streak: 3,
        logs: ['2026-06-28'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const initialGoals: Goal[] = [
      {
        id: 'goal_1',
        title: 'Acquire 100 paid active application subscribers',
        targetDate: '2026-07-30',
        progress: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'goal_2',
        title: 'Complete Advanced React certifications',
        targetDate: '2026-08-15',
        progress: 80,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const initialRecs: Recommendation[] = [
      {
        id: 'rec_1',
        title: 'Review "Research Thesis" subtasks',
        description: 'Your thesis draft is due tomorrow. Use the AI Action Plan generator to split it into simple milestones.',
        urgency: 'high',
        suggestedAction: 'Generate AI Breakdown'
      },
      {
        id: 'rec_2',
        title: 'Investor Pitch preparations',
        description: 'Dedicate 30 mins in your morning calendar specifically for reviewing figures.',
        urgency: 'medium',
        suggestedAction: 'Schedule Calendar blocks'
      }
    ];

    setTasks(initialTasks);
    setHabits(initialHabits);
    setGoals(initialGoals);
    setRecommendations(initialRecs);
  };

  // Sync / Load data when logged in
  useEffect(() => {
    if (!user) return;

    if (isMockUser) {
      // Offline / guest mode loads pre-populated data or local storage
      const savedTasks = localStorage.getItem(`tasks_${user.uid}`);
      const savedHabits = localStorage.getItem(`habits_${user.uid}`);
      const savedGoals = localStorage.getItem(`goals_${user.uid}`);
      
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      else seedInitialData();

      if (savedHabits) setHabits(JSON.parse(savedHabits));
      if (savedGoals) setGoals(JSON.parse(savedGoals));
    } else {
      // Real Firebase Firestore Sync
      loadFromFirestore();
    }
  }, [user, isMockUser]);

  // Save changes locally or in Cloud run depending on connectivity
  useEffect(() => {
    if (!user) return;
    if (isMockUser || !isOnline) {
      localStorage.setItem(`tasks_${user.uid}`, JSON.stringify(tasks));
      localStorage.setItem(`habits_${user.uid}`, JSON.stringify(habits));
      localStorage.setItem(`goals_${user.uid}`, JSON.stringify(goals));
    }
  }, [tasks, habits, goals, user, isMockUser, isOnline]);

  // Firestore Loader
  const loadFromFirestore = async () => {
    if (!user || isMockUser) return;
    try {
      const tasksSnap = await getDocs(collection(db, 'users', user.uid, 'tasks'));
      const habitsSnap = await getDocs(collection(db, 'users', user.uid, 'habits'));
      const goalsSnap = await getDocs(collection(db, 'users', user.uid, 'goals'));

      const loadedTasks: Task[] = [];
      tasksSnap.forEach(docSnap => {
        loadedTasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
      });

      const loadedHabits: Habit[] = [];
      habitsSnap.forEach(docSnap => {
        loadedHabits.push({ id: docSnap.id, ...docSnap.data() } as Habit);
      });

      const loadedGoals: Goal[] = [];
      goalsSnap.forEach(docSnap => {
        loadedGoals.push({ id: docSnap.id, ...docSnap.data() } as Goal);
      });

      if (loadedTasks.length > 0) setTasks(loadedTasks);
      else seedInitialData();

      if (loadedHabits.length > 0) setHabits(loadedHabits);
      if (loadedGoals.length > 0) setGoals(loadedGoals);

    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}`);
    }
  };

  // Synchronize local cached tasks to Firebase once connected Online!
  const handleSyncOnline = async () => {
    if (!user || isMockUser) return;
    setLoadingPrioritize(true);
    try {
      // Batch sync tasks, habits, and goals to Cloud
      const batch = writeBatch(db);
      
      for (const t of tasks) {
        const docRef = doc(db, 'users', user.uid, 'tasks', t.id);
        batch.set(docRef, t, { merge: true });
      }
      for (const h of habits) {
        const docRef = doc(db, 'users', user.uid, 'habits', h.id);
        batch.set(docRef, h, { merge: true });
      }
      for (const g of goals) {
        const docRef = doc(db, 'users', user.uid, 'goals', g.id);
        batch.set(docRef, g, { merge: true });
      }

      await batch.commit();
      addNotification("Offline local data synced with secure Firebase database successfully!", "success");
    } catch (err) {
      console.error("Batch sync failed", err);
      addNotification("Sync error occurred. Safe fallback online.", "info");
    } finally {
      setLoadingPrioritize(false);
    }
  };

  // Add Task Handler
  const handleAddTask = async (taskData: Partial<Task>) => {
    const taskId = 'task_' + Date.now();
    const newTask: Task = {
      id: taskId,
      title: taskData.title || 'Untitled Action Item',
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      status: 'pending',
      dueDate: taskData.dueDate || '2026-06-30',
      category: taskData.category || 'General',
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...taskData
    };

    setTasks(prev => [newTask, ...prev]);
    addNotification(`Task "${newTask.title}" scheduled successfully.`, "success");

    if (!isMockUser && isOnline) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), newTask);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/tasks/${taskId}`);
      }
    }
  };

  // Add Habit Handler
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const habitId = 'habit_' + Date.now();
    const newHabit: Habit = {
      id: habitId,
      title: newHabitTitle,
      frequency: newHabitFreq,
      streak: 0,
      logs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setHabits(prev => [...prev, newHabit]);
    setNewHabitTitle('');
    setShowAddHabit(false);
    addNotification(`New Habit Routine "${newHabit.title}" created.`, "success");

    if (!isMockUser && isOnline) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'habits', habitId), newHabit);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/habits/${habitId}`);
      }
    }
  };

  // Add Goal Handler
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const goalId = 'goal_' + Date.now();
    const newGoal: Goal = {
      id: goalId,
      title: newGoalTitle,
      targetDate: newGoalDate,
      progress: Number(newGoalProgress),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setGoals(prev => [...prev, newGoal]);
    setNewGoalTitle('');
    setShowAddGoal(false);
    addNotification(`Strategic goal registered!`, "success");

    if (!isMockUser && isOnline) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'goals', goalId), newGoal);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/goals/${goalId}`);
      }
    }
  };

  // Log Habit Routine Progress
  const logHabitDay = async (id: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const updated = habits.map(h => {
      if (h.id === id) {
        if (h.logs.includes(todayStr)) {
          // Unlog
          const newLogs = h.logs.filter(l => l !== todayStr);
          return { ...h, logs: newLogs, streak: Math.max(0, h.streak - 1) };
        } else {
          // Log
          const newLogs = [...h.logs, todayStr];
          return { ...h, logs: newLogs, streak: h.streak + 1 };
        }
      }
      return h;
    });

    setHabits(updated);
    const targetHabit = updated.find(h => h.id === id);
    if (targetHabit) {
      addNotification(`Routine progress logged! Current streak: ${targetHabit.streak} days.`, "success");
      if (!isMockUser && isOnline) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'habits', id), targetHabit);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/habits/${id}`);
        }
      }
    }
  };

  // Toggle Task Completion
  const toggleTaskComplete = async (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const isComp = t.status === 'completed';
        const newStatus: 'pending' | 'completed' = isComp ? 'pending' : 'completed';
        return { ...t, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return t;
    });

    setTasks(updated);
    const targetTask = updated.find(t => t.id === id);
    if (targetTask) {
      addNotification(
        targetTask.status === 'completed' 
          ? `Nice! You completed: "${targetTask.title}"` 
          : `Task "${targetTask.title}" marked as pending.`, 
        "success"
      );

      if (!isMockUser && isOnline) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'tasks', id), targetTask);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${id}`);
        }
      }
    }
  };

  // Delete Task
  const deleteTask = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (target) {
      addNotification(`Removed task "${target.title}".`, "info");
      if (!isMockUser && isOnline) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/tasks/${id}`);
        }
      }
    }
  };

  // Decompose task using server-side Gemini AI
  const handleGenerateAIPlan = async (task: Task) => {
    setLoadingAIPlan(task.id);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate
        })
      });

      if (!response.ok) throw new Error("Cloud decomposition endpoint returned failure.");
      const result = await response.json();

      // Convert result's subtasks into local format
      const formattedSubtasks = result.subtasks.map((st: any) => ({
        title: st.title,
        completed: false,
        duration: st.duration,
        difficulty: st.difficulty,
        proTips: st.proTips
      }));

      // Update local task
      const updated = tasks.map(t => {
        if (t.id === task.id) {
          return { ...t, subtasks: formattedSubtasks, updatedAt: new Date().toISOString() };
        }
        return t;
      });

      setTasks(updated);
      addNotification(`Task decomposed into ${formattedSubtasks.length} subtasks with pro tips!`, "success");
      
      const speechMotivation = `I have created a custom ${formattedSubtasks.length}-step action plan for you. ${result.motivation}`;
      triggerSpeech(speechMotivation);

      const target = updated.find(t => t.id === task.id);
      if (target && !isMockUser && isOnline) {
        await setDoc(doc(db, 'users', user.uid, 'tasks', task.id), target);
      }
    } catch (err: any) {
      console.error(err);
      addNotification("Decomposition failed. Operating on standard scheduling limits.", "info");
    } finally {
      setLoadingAIPlan(null);
    }
  };

  // Eisenhower Matrix AI priorization
  const handleAIPrioritize = async () => {
    setLoadingPrioritize(true);
    try {
      const response = await fetch("/api/prioritize-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks })
      });

      if (!response.ok) throw new Error("Prioritization engine returned failure.");
      const result = await response.json();

      // Update tasks in local state with AI quadrant and explanations
      const prioritizedTasks = tasks.map(t => {
        const aiInfo = result.prioritized.find((p: any) => p.id === t.id);
        if (aiInfo) {
          return {
            ...t,
            aiQuadrant: aiInfo.quadrant,
            aiLabel: aiInfo.label,
            aiExplanation: aiInfo.explanation
          };
        }
        return t;
      });

      setTasks(prioritizedTasks);
      addNotification("Tasks analyzed and mapped onto the Eisenhower Matrix!", "success");
      
      if (result.generalAdvice && result.generalAdvice.length > 0) {
        triggerSpeech(`I have organized your agenda. Top advice of the day: ${result.generalAdvice[0]}`);
      }

      // Sync updated tasks with database
      if (!isMockUser && isOnline) {
        const batch = writeBatch(db);
        prioritizedTasks.forEach(t => {
          const docRef = doc(db, 'users', user.uid, 'tasks', t.id);
          batch.set(docRef, t, { merge: true });
        });
        await batch.commit();
      }
    } catch (err: any) {
      console.error(err);
      addNotification("Prioritization failed. Safe default matrix limits applied.", "info");
    } finally {
      setLoadingPrioritize(false);
    }
  };

  // Smart suggestions from Gemini
  const handleFetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const response = await fetch("/api/get-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, habits, goals })
      });

      if (!response.ok) throw new Error("Recommendations endpoint returned failure.");
      const result = await response.json();

      const formattedRecs = result.recommendations.map((r: any, idx: number) => ({
        id: 'rec_' + idx + '_' + Date.now(),
        title: r.title,
        description: r.description,
        urgency: r.urgency,
        suggestedAction: r.suggestedAction
      }));

      setRecommendations(formattedRecs);
      setProductivityScore(result.productivityScore);
      setScoreReason(result.scoreReason);
      addNotification("AI coach has evaluated your productivity performance metrics.", "success");
      triggerSpeech(`Productivity review complete. Your current balance score is ${result.productivityScore} percent.`);
    } catch (err: any) {
      console.error(err);
      addNotification("Failed to refresh recommendations.", "info");
    } finally {
      setLoadingRecs(false);
    }
  };

  // Toggle Subtask Completion
  const toggleSubtaskComplete = async (taskId: string, subtaskIndex: number) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const subCopy = [...t.subtasks];
        subCopy[subtaskIndex] = {
          ...subCopy[subtaskIndex],
          completed: !subCopy[subtaskIndex].completed
        };
        return { ...t, subtasks: subCopy };
      }
      return t;
    });

    setTasks(updated);
    addNotification("Subtask status updated.", "success");

    const target = updated.find(t => t.id === taskId);
    if (target && !isMockUser && isOnline) {
      await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), target);
    }
  };

  const handleLoginSuccess = (signedInUser: any, isMock: boolean) => {
    setUser(signedInUser);
    setIsMockUser(isMock);
    addNotification(`Welcome back, ${signedInUser.displayName}!`, "success");
  };

  const handleLogout = async () => {
    if (!isMockUser) {
      await auth.signOut();
    }
    setUser(null);
    setTasks([]);
    setHabits([]);
    setGoals([]);
    addNotification("You have signed out of your secure profile.", "info");
  };

  // Handle toggling network connection for simulation testing
  const toggleNetworkConnection = () => {
    const newNetworkState = !isOnline;
    setIsOnline(newNetworkState);
    if (newNetworkState) {
      addNotification("Connected to high-speed cloud sync.", "success");
      handleSyncOnline();
    } else {
      addNotification("Disconnecting. Offline Sync local storage active.", "info");
    }
  };

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} isDark={isDark} />;
  }

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'}`}>
      
      {/* Push Notifications Overlay */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl shadow-lg border text-xs font-medium flex items-start gap-3 pointer-events-auto ${
                n.type === 'success' 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500' 
                  : n.type === 'alert'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-500'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{n.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Sidebar */}
        <aside className={`w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r p-5 flex flex-col justify-between ${
          isDark ? 'bg-slate-950 border-slate-900 text-slate-100' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-bold tracking-tight text-sm text-slate-100">Companion Plan</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-300 transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-300 transition-colors"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Navigation links */}
            <nav className={`space-y-1 lg:block ${mobileMenuOpen ? 'block' : 'hidden'}`}>
              {[
                { id: 'dashboard', label: 'Agenda & Habits', icon: CheckSquare },
                { id: 'matrix', label: 'Eisenhower Bento', icon: Sparkles },
                { id: 'calendar', label: 'Interactive Calendar', icon: CalendarIcon },
                { id: 'habits', label: 'Routine Tracker', icon: Flame },
                { id: 'assistant', label: 'Voice Assistant', icon: Play },
                { id: 'analytics', label: 'Performance Metrics', icon: Award }
              ].map(item => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/10'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className={`mt-6 pt-4 border-t space-y-4 lg:block ${mobileMenuOpen ? 'block' : 'hidden'} border-slate-800`}>
            {/* Connection Toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-850/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </span>
              <button
                onClick={toggleNetworkConnection}
                className={`w-8 h-4 rounded-full transition-colors relative ${
                  isOnline ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                  isOnline ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Active Agenda Planner</h1>
                  <p className="text-sm text-neutral-500">
                    Proactive planning, intelligent prioritization, and deadlined protection.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-sm"
                    id="add-task-btn"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Task</span>
                  </button>
                </div>
              </div>

              {/* Add Task Modal overlay */}
              {showAddTask && (
                <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className={`w-full max-w-md p-6 rounded-2xl border shadow-xl ${
                    isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Add Commitment Task</h3>
                      <button onClick={() => setShowAddTask(false)} className="text-neutral-500 hover:text-neutral-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleAddTask({
                        title: newTaskTitle,
                        description: newTaskDesc,
                        priority: newTaskPriority,
                        dueDate: newTaskDate,
                        category: newTaskCategory
                      });
                      setNewTaskTitle('');
                      setNewTaskDesc('');
                      setShowAddTask(false);
                    }} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase">Task Title</label>
                        <input
                          type="text"
                          required
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          placeholder="e.g. Complete math thesis chapters"
                          className={`w-full p-2.5 rounded-xl border bg-transparent ${
                            isDark ? 'border-neutral-800 focus:border-indigo-500' : 'border-neutral-200 focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase">Description (optional)</label>
                        <textarea
                          value={newTaskDesc}
                          onChange={e => setNewTaskDesc(e.target.value)}
                          placeholder="What needs to happen?"
                          className={`w-full p-2.5 rounded-xl border bg-transparent h-20 resize-none ${
                            isDark ? 'border-neutral-800 focus:border-indigo-500' : 'border-neutral-200 focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-neutral-400 uppercase">Priority Level</label>
                          <select
                            value={newTaskPriority}
                            onChange={e => setNewTaskPriority(e.target.value as any)}
                            className={`w-full p-2.5 rounded-xl border bg-transparent ${
                              isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-white'
                            }`}
                          >
                            <option value="high">🔥 High</option>
                            <option value="medium">⚡ Medium</option>
                            <option value="low">🌱 Low</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-neutral-400 uppercase">Due Date</label>
                          <input
                            type="date"
                            required
                            value={newTaskDate}
                            onChange={e => setNewTaskDate(e.target.value)}
                            className={`w-full p-2.5 rounded-xl border bg-transparent ${
                              isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-white'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase">Category</label>
                        <input
                          type="text"
                          value={newTaskCategory}
                          onChange={e => setNewTaskCategory(e.target.value)}
                          placeholder="Work, Education, Personal, Finance, Health"
                          className={`w-full p-2.5 rounded-xl border bg-transparent ${
                            isDark ? 'border-neutral-800 focus:border-indigo-500' : 'border-neutral-200 focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm text-sm"
                      >
                        Create Agenda Commitment
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Proactive Coaching Quick Alerts Block */}
              <ProactiveRecommendations
                recommendations={recommendations}
                productivityScore={productivityScore}
                scoreReason={scoreReason}
                isDark={isDark}
                onRefresh={handleFetchRecommendations}
                loading={loadingRecs}
              />

              {/* Task Cards Lists */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Active Agenda Commitments</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="tasks-list">
                  {tasks.filter(t => t.status === 'pending').map(task => (
                    <div
                      key={task.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                        isDark 
                          ? 'bg-neutral-900 border-neutral-800/80 hover:border-neutral-700' 
                          : 'bg-white border-neutral-200 hover:shadow-sm'
                      }`}
                      id={`task-card-${task.id}`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex gap-2.5">
                            <button
                              onClick={() => toggleTaskComplete(task.id)}
                              className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors ${
                                isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-neutral-300 hover:bg-neutral-100'
                              }`}
                            >
                              {task.status === 'completed' && <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />}
                            </button>
                            <div>
                              <h4 className="font-bold text-sm tracking-tight">{task.title}</h4>
                              <p className="text-xs text-neutral-500 leading-relaxed mt-0.5">{task.description}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-md border shrink-0 ${
                            task.priority === 'high' 
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                              : task.priority === 'medium'
                              ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Decomposed Subtasks visual steps if present */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="pt-2 border-t border-neutral-800/10 space-y-2.5">
                            <h5 className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                              <span>AI Execution Milestones</span>
                            </h5>
                            <div className="space-y-1.5 pl-1">
                              {task.subtasks.map((st, index) => (
                                <div key={index} className="flex items-start gap-2 text-xs">
                                  <button
                                    onClick={() => toggleSubtaskComplete(task.id, index)}
                                    className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                                      st.completed 
                                        ? 'bg-emerald-500 border-emerald-600 text-white' 
                                        : isDark ? 'border-neutral-800' : 'border-neutral-300'
                                    }`}
                                  >
                                    {st.completed && <CheckSquare className="w-2.5 h-2.5" />}
                                  </button>
                                  <div className="flex-1">
                                    <p className={`font-medium ${st.completed ? 'line-through text-neutral-500' : ''}`}>
                                      {st.title} <span className="text-[10px] text-neutral-500 font-normal">({st.duration})</span>
                                    </p>
                                    {st.proTips && !st.completed && (
                                      <p className="text-[10px] text-indigo-400 font-mono italic mt-0.5">{st.proTips}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/5 text-xs text-neutral-500">
                        <span className="flex items-center gap-1.5 font-mono">
                          <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{task.dueDate}</span>
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-neutral-500 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {task.subtasks.length === 0 && (
                            <button
                              onClick={() => handleGenerateAIPlan(task)}
                              disabled={loadingAIPlan === task.id}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] rounded-lg font-semibold transition-all flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{loadingAIPlan === task.id ? 'Structuring...' : 'AI Plan steps'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Eisenhower Bento Tab */}
          {activeTab === 'matrix' && (
            <TaskPrioritization
              tasks={tasks}
              isDark={isDark}
              onPrioritize={handleAIPrioritize}
              loadingPrioritization={loadingPrioritize}
              onToggleComplete={toggleTaskComplete}
              onDeleteTask={deleteTask}
            />
          )}

          {/* Interactive Calendar Tab */}
          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              isDark={isDark}
              onAddTask={handleAddTask}
            />
          )}

          {/* Routine Tracker Tab */}
          {activeTab === 'habits' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Active Habits & Routines</h2>
                  <p className="text-sm text-neutral-500">Form consistent daily streaks to protect your commitments.</p>
                </div>
                <button
                  onClick={() => setShowAddHabit(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Routine</span>
                </button>
              </div>

              {showAddHabit && (
                <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className={`w-full max-w-md p-6 rounded-2xl border shadow-xl ${
                    isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Define Routine</h3>
                      <button onClick={() => setShowAddHabit(false)} className="text-neutral-500 hover:text-neutral-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleAddHabit} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase">Routine Title</label>
                        <input
                          type="text"
                          required
                          value={newHabitTitle}
                          onChange={e => setNewHabitTitle(e.target.value)}
                          placeholder="e.g. Code 1 hour, Morning run"
                          className={`w-full p-2.5 rounded-xl border bg-transparent ${
                            isDark ? 'border-neutral-800 focus:border-indigo-500' : 'border-neutral-200 focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase">Frequency</label>
                        <select
                          value={newHabitFreq}
                          onChange={e => setNewHabitFreq(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border bg-transparent ${
                            isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-white'
                          }`}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm"
                      >
                        Register Routine
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="routines-list">
                {habits.map(habit => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const isLoggedToday = habit.logs.includes(todayStr);
                  return (
                    <div
                      key={habit.id}
                      className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
                        isDark ? 'bg-neutral-900 border-neutral-800/80' : 'bg-white border-neutral-200 shadow-sm'
                      }`}
                      id={`routine-card-${habit.id}`}
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm tracking-tight">{habit.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span className="capitalize">{habit.frequency}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                            <Flame className="w-3.5 h-3.5" />
                            {habit.streak} day streak
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => logHabitDay(habit.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isLoggedToday
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isLoggedToday ? 'Logged' : 'Complete'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Voice Assistant Tab */}
          {activeTab === 'assistant' && (
            <div className="max-w-2xl mx-auto">
              <VoiceAssistant
                isDark={isDark}
                onAddTask={handleAddTask}
                onPrioritize={handleAIPrioritize}
                onTriggerSpeak={triggerSpeech}
              />
            </div>
          )}

          {/* Performance Metrics Tab */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              tasks={tasks}
              habits={habits}
              goals={goals}
              isDark={isDark}
            />
          )}

        </main>
      </div>

    </div>
  );
}
