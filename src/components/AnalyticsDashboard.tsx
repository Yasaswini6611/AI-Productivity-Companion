import React from 'react';
import { Task, Habit, Goal } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, CheckCircle, Award, Target, Calendar } from 'lucide-react';

interface AnalyticsDashboardProps {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  isDark: boolean;
}

export default function AnalyticsDashboard({ tasks, habits, goals, isDark }: AnalyticsDashboardProps) {
  
  // Calculate completion rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate habit consistency
  const totalHabits = habits.length;
  const averageStreak = totalHabits > 0 ? Math.round(habits.reduce((acc, h) => acc + h.streak, 0) / totalHabits) : 0;

  // Calculate goal progress
  const totalGoals = goals.length;
  const averageGoalProgress = totalGoals > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / totalGoals) : 0;

  // 1. Data for Priority Breakdown
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
  const mediumPriorityCount = tasks.filter(t => t.priority === 'medium' && t.status !== 'completed').length;
  const lowPriorityCount = tasks.filter(t => t.priority === 'low' && t.status !== 'completed').length;

  const priorityData = [
    { name: 'High', value: highPriorityCount, color: '#f43f5e' },
    { name: 'Medium', value: mediumPriorityCount, color: '#6366f1' },
    { name: 'Low', value: lowPriorityCount, color: '#10b981' }
  ].filter(d => d.value > 0);

  // 2. Weekly Completion Trends Data (7 days historical simulation)
  const completionTrendData = [
    { day: 'Mon', completed: 2, created: 3 },
    { day: 'Tue', completed: 4, created: 4 },
    { day: 'Wed', completed: 3, created: 5 },
    { day: 'Thu', completed: 5, created: 3 },
    { day: 'Fri', completed: 6, created: 4 },
    { day: 'Sat', completed: 4, created: 2 },
    { day: 'Sun', completed: completedTasks, created: totalTasks }
  ];

  // 3. Category Breakdown Data
  const categoryMap: { [key: string]: number } = {};
  tasks.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + 1;
  });
  const categoryData = Object.keys(categoryMap).map(key => ({
    name: key,
    tasks: categoryMap[key]
  })).slice(0, 5);

  // Export as CSV File
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Title,Description,Priority,Status,Due Date,Category,AI Quadrant\n";

    tasks.forEach(task => {
      const row = [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        `"${task.description.replace(/"/g, '""')}"`,
        task.priority,
        task.status,
        task.dueDate,
        task.category,
        task.aiQuadrant || "Not Analyzed"
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IntelliTask_Productivity_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Summary PDF/Report as formatted Text document
  const exportPDFReport = () => {
    let report = `==============================================\n`;
    report += `      AI PRODUCTIVITY COMPANION REPORT\n`;
    report += `      Generated on: ${new Date().toLocaleString()}\n`;
    report += `==============================================\n\n`;

    report += `1. HIGHLIGHTS & KEY METRICS\n`;
    report += `----------------------------------------------\n`;
    report += `- Total Tasks Tracked: ${totalTasks}\n`;
    report += `- Completed Tasks: ${completedTasks} (${completionRate}% Completion Rate)\n`;
    report += `- Active Habits Tracked: ${totalHabits}\n`;
    report += `- Average Habit Streak: ${averageStreak} days\n`;
    report += `- Total Strategic Goals: ${totalGoals}\n`;
    report += `- Average Goal Progress: ${averageGoalProgress}%\n\n`;

    report += `2. TASKS LIST & DEADLINES\n`;
    report += `----------------------------------------------\n`;
    if (tasks.length === 0) {
      report += `No active tasks.\n`;
    } else {
      tasks.forEach((task, index) => {
        report += `${index + 1}. [${task.status.toUpperCase()}] ${task.title}\n`;
        report += `   Priority: ${task.priority.toUpperCase()} | Due Date: ${task.dueDate} | Category: ${task.category}\n`;
        if (task.description) report += `   Description: ${task.description}\n`;
        report += `\n`;
      });
    }

    report += `3. HABITS CONSISTENCY DIGEST\n`;
    report += `----------------------------------------------\n`;
    if (habits.length === 0) {
      report += `No active habits logged.\n`;
    } else {
      habits.forEach((habit, index) => {
        report += `${index + 1}. ${habit.title} (${habit.frequency})\n`;
        report += `   Current Streak: ${habit.streak} days | Total logs: ${habit.logs.length}\n\n`;
      });
    }

    report += `==============================================\n`;
    report += `        End of Productivity Report\n`;
    report += `==============================================\n`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `IntelliTask_Productivity_Report_${new Date().toISOString().slice(0,10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="analytics-dashboard-panel">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black">{completionRate}%</span>
            <h4 className="text-xs text-neutral-500 font-bold uppercase mt-0.5">Task Completion</h4>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black">{averageStreak} Days</span>
            <h4 className="text-xs text-neutral-500 font-bold uppercase mt-0.5">Habit Streaks</h4>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black">{averageGoalProgress}%</span>
            <h4 className="text-xs text-neutral-500 font-bold uppercase mt-0.5">Goal Progress</h4>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trends Chart */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Weekly Completion Trend</span>
            </h3>
          </div>
          <div className="h-[220px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={completionTrendData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#171717' : '#ffffff', 
                    borderColor: isDark ? '#262626' : '#e5e7eb',
                    color: isDark ? '#ffffff' : '#000000'
                  }} 
                />
                <Area type="monotone" dataKey="completed" name="Completed Tasks" stroke="#6366f1" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
                <Area type="monotone" dataKey="created" name="Total Created" stroke="#a3a5f7" fillOpacity={0} strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority & Categories Breakdown */}
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          <h3 className="font-bold text-sm tracking-tight mb-4">Task Category Analysis</h3>
          {categoryData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-neutral-500 text-xs">
              No categories mapped. Add some tasks first.
            </div>
          ) : (
            <div className="h-[220px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#171717' : '#ffffff', 
                      borderColor: isDark ? '#262626' : '#e5e7eb',
                      color: isDark ? '#ffffff' : '#000000'
                    }} 
                  />
                  <Bar dataKey="tasks" name="Active Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Actions and Export Reports */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <div>
          <h4 className="font-bold text-sm tracking-tight">Proactive Analytics Export</h4>
          <p className="text-xs text-neutral-500 mt-0.5">
            Download your comprehensive task matrices, deadlines, habit logs, and coaching reports instantly.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isDark 
                ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-200' 
                : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportPDFReport}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Digest</span>
          </button>
        </div>
      </div>
    </div>
  );
}
