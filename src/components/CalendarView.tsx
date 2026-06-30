import React, { useState } from 'react';
import { Task } from '../types';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckSquare, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface CalendarViewProps {
  tasks: Task[];
  isDark: boolean;
  onAddTask: (taskData: Partial<Task>) => void;
}

export default function CalendarView({ tasks, isDark, onAddTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 29)); // Default to June 2026 based on metadata
  const [selectedDay, setSelectedDay] = useState<number | null>(29);
  const [showAddQuick, setShowAddQuick] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Days in month calculation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const getTasksForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.dueDate === dateStr);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || selectedDay === null) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onAddTask({
      title: quickTitle,
      description: 'Added via Interactive Calendar Planner',
      priority: quickPriority,
      dueDate: dateStr,
      status: 'pending',
      subtasks: [],
      category: 'Calendar'
    });
    setQuickTitle('');
    setShowAddQuick(false);
  };

  // Render month days grid
  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const selectedTasks = selectedDay !== null ? getTasksForDate(selectedDay) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="calendar-planner-view">
      {/* Calendar Grid */}
      <div className={`lg:col-span-2 p-5 rounded-2xl border ${
        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-lg">{monthNames[month]} {year}</h3>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={prevMonth}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark ? 'border-neutral-800 hover:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark ? 'border-neutral-800 hover:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of the week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-neutral-500 mb-2">
          <div>Su</div>
          <div>Mo</div>
          <div>Tu</div>
          <div>We</div>
          <div>Th</div>
          <div>Fr</div>
          <div>Sa</div>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dayTasks = getTasksForDate(day);
            const isSelected = selectedDay === day;
            const hasTasks = dayTasks.length > 0;
            const hasHighPriority = dayTasks.some(t => t.priority === 'high' && t.status === 'pending');

            let cellBg = '';
            let textStyle = '';
            if (isSelected) {
              cellBg = 'bg-indigo-600 text-white';
            } else if (hasTasks) {
              cellBg = hasHighPriority 
                ? (isDark ? 'bg-rose-500/10 border border-rose-500/40 text-rose-400' : 'bg-rose-50 border border-rose-200 text-rose-700')
                : (isDark ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border border-indigo-200 text-indigo-700');
            } else {
              cellBg = isDark ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-neutral-100 text-neutral-800';
            }

            return (
              <button
                key={`day-${day}`}
                onClick={() => {
                  setSelectedDay(day);
                  setShowAddQuick(false);
                }}
                className={`aspect-square rounded-xl text-xs font-medium flex flex-col items-center justify-between p-1.5 relative transition-all ${cellBg}`}
              >
                <span>{day}</span>
                {hasTasks && !isSelected && (
                  <span className={`w-1.5 h-1.5 rounded-full ${hasHighPriority ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda View */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-800/10">
          <div>
            <h4 className="font-bold text-sm">Agenda Details</h4>
            <p className="text-xs text-neutral-500">
              {selectedDay !== null ? `${monthNames[month]} ${selectedDay}, ${year}` : 'Select a date'}
            </p>
          </div>
          {selectedDay !== null && (
            <button
              onClick={() => setShowAddQuick(!showAddQuick)}
              className="p-1 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
              title="Add task directly to date"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {showAddQuick && (
          <form onSubmit={handleQuickAdd} className="mb-4 space-y-3 p-3 rounded-xl bg-neutral-500/5 border border-neutral-700/15">
            <h5 className="text-xs font-semibold flex items-center gap-1.5 text-indigo-500">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Plan Task
            </h5>
            <input
              type="text"
              required
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              placeholder="What task needs doing?"
              className={`w-full p-2 rounded-lg text-xs border bg-transparent outline-none ${
                isDark ? 'border-neutral-700 focus:border-indigo-500 text-white' : 'border-neutral-300 focus:border-indigo-500'
              }`}
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuickPriority(p)}
                    className={`px-2 py-1 rounded text-[10px] uppercase font-semibold border ${
                      quickPriority === p
                        ? p === 'high' ? 'bg-rose-500 text-white border-rose-600' : p === 'medium' ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-emerald-500 text-white border-emerald-600'
                        : isDark ? 'border-neutral-700 text-neutral-400' : 'border-neutral-300 text-neutral-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] rounded-lg font-medium transition-colors"
              >
                Plan It
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {selectedDay === null ? (
            <p className="text-center text-xs text-neutral-400 py-6">Select any calendar date to view the scheduled activities.</p>
          ) : selectedTasks.length === 0 ? (
            <div className="text-center text-xs text-neutral-400 py-6">
              No commitments scheduled.
              <button 
                onClick={() => setShowAddQuick(true)} 
                className="block text-indigo-500 hover:underline mx-auto mt-1 font-medium"
              >
                Schedule the first task
              </button>
            </div>
          ) : (
            selectedTasks.map(task => (
              <div
                key={task.id}
                className={`p-3 rounded-xl border flex flex-col gap-1 ${
                  isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50 border-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-indigo-500' : 'bg-emerald-500'
                  }`} />
                  <span className={`text-xs font-semibold ${
                    task.status === 'completed' ? 'line-through text-neutral-500' : ''
                  }`}>
                    {task.title}
                  </span>
                </div>
                {task.description && (
                  <p className="text-[11px] text-neutral-500 ml-4">{task.description}</p>
                )}
                <div className="flex justify-between items-center mt-1 text-[10px] text-neutral-500 ml-4">
                  <span className="capitalize">{task.priority} Priority</span>
                  <span className="capitalize px-1.5 py-0.5 rounded-full bg-neutral-500/10 text-neutral-400">
                    {task.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
