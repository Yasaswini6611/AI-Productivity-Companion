import React, { useState } from 'react';
import { Task } from '../types';
import { AlertCircle, Calendar, Sparkles, CheckSquare, Clock, User, Trash2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskPrioritizationProps {
  tasks: Task[];
  isDark: boolean;
  onPrioritize: () => Promise<void>;
  loadingPrioritization: boolean;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskPrioritization({
  tasks,
  isDark,
  onPrioritize,
  loadingPrioritization,
  onToggleComplete,
  onDeleteTask
}: TaskPrioritizationProps) {
  const [showExplanation, setShowExplanation] = useState<string | null>(null);

  // Filter tasks into quadrants
  // If the task has aiQuadrant set from Gemini, we use it. Otherwise, we do a fallback assignment
  const getQuadrantTasks = (quadrant: string) => {
    return tasks.filter(t => {
      if (t.aiQuadrant) {
        return t.aiQuadrant === quadrant;
      }
      // Fallback categorization based on priority and due dates
      const isHighPriority = t.priority === 'high';
      const isMediumPriority = t.priority === 'medium';
      
      const dueDays = t.dueDate ? Math.ceil((new Date(t.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 10;
      const isUrgent = dueDays <= 3;

      if (isHighPriority && isUrgent) return quadrant === 'urgent_important';
      if (isHighPriority || isMediumPriority) return quadrant === 'not_urgent_important';
      if (isUrgent) return quadrant === 'urgent_not_important';
      return quadrant === 'not_urgent_not_important';
    });
  };

  const renderQuadrantHeader = (title: string, subtitle: string, badgeColor: string) => (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${badgeColor}`} />
        <h3 className="font-semibold text-sm uppercase tracking-wider">{title}</h3>
      </div>
      <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
    </div>
  );

  const quadrants = [
    {
      id: 'urgent_important',
      title: 'Do First (Urgent & Important)',
      subtitle: 'Critical deadlines, immediate actions, high impact.',
      color: 'bg-rose-500',
      bgColor: isDark ? 'bg-rose-950/20 border-rose-500/20' : 'bg-rose-50 border-rose-200'
    },
    {
      id: 'not_urgent_important',
      title: 'Schedule/Plan (Not Urgent & Important)',
      subtitle: 'Goal setting, planning, long-term success.',
      color: 'bg-indigo-500',
      bgColor: isDark ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
    },
    {
      id: 'urgent_not_important',
      title: 'Delegate/Limit (Urgent & Not Important)',
      subtitle: 'Interruptions, busywork, secondary requests.',
      color: 'bg-amber-500',
      bgColor: isDark ? 'bg-amber-950/20 border-amber-500/20' : 'bg-amber-50 border-amber-200'
    },
    {
      id: 'not_urgent_not_important',
      title: 'Postpone/Eliminate (Not Urgent & Not Important)',
      subtitle: 'Low-priority tasks, trivialities, distractions.',
      color: 'bg-emerald-500',
      bgColor: isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Intelligent Prioritization Matrix</h2>
          <p className="text-sm text-neutral-500">
            Powered by the Eisenhower Matrix. Use AI to organize and schedule tasks dynamically.
          </p>
        </div>
        <button
          onClick={onPrioritize}
          disabled={loadingPrioritization || tasks.length === 0}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
          id="ai-prioritize-btn"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loadingPrioritization ? 'AI Analyzing Tasks...' : 'AI Prioritize & Organize'}</span>
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className={`p-8 text-center rounded-2xl border border-dashed ${
          isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-200 bg-neutral-50'
        }`}>
          <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h3 className="font-semibold text-lg">No tasks to prioritize</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            Create some tasks first, then run the AI Prioritization engine to categorize them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="eisenhower-matrix-grid">
          {quadrants.map(q => {
            const quadrantTasks = getQuadrantTasks(q.id);
            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border min-h-[250px] flex flex-col ${q.bgColor}`}
                id={`quadrant-${q.id}`}
              >
                {renderQuadrantHeader(q.title, q.subtitle, q.color)}

                <div className="space-y-3 flex-1 mt-2">
                  {quadrantTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-6 text-neutral-400 text-xs">
                      No tasks in this quadrant
                    </div>
                  ) : (
                    quadrantTasks.map(task => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                          isDark 
                            ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' 
                            : 'bg-white border-neutral-200 hover:shadow-sm'
                        }`}
                        id={`matrix-task-${task.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <button
                              onClick={() => onToggleComplete(task.id)}
                              className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors ${
                                task.status === 'completed'
                                  ? 'bg-emerald-500 border-emerald-600 text-white'
                                  : isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-neutral-300 hover:bg-neutral-100'
                              }`}
                            >
                              {task.status === 'completed' && <CheckSquare className="w-3.5 h-3.5" />}
                            </button>
                            <div>
                              <p className={`text-sm font-medium ${
                                task.status === 'completed' ? 'line-through text-neutral-500' : ''
                              }`}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{task.description}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="text-neutral-400 hover:text-rose-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {task.dueDate}
                          </span>
                          {task.aiExplanation && (
                            <button
                              onClick={() => setShowExplanation(showExplanation === task.id ? null : task.id)}
                              className="text-indigo-500 hover:underline font-medium"
                            >
                              {showExplanation === task.id ? 'Hide AI Reason' : 'Why this?'}
                            </button>
                          )}
                        </div>

                        {showExplanation === task.id && task.aiExplanation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className={`mt-2 p-2.5 rounded-lg text-xs flex gap-2 ${
                              isDark ? 'bg-indigo-950/40 text-indigo-200' : 'bg-indigo-50 text-indigo-900'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <p>{task.aiExplanation}</p>
                          </motion.div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
