import React from 'react';
import { Recommendation } from '../types';
import { Sparkles, ArrowRight, Zap, Target, Flame, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface ProactiveRecommendationsProps {
  recommendations: Recommendation[];
  productivityScore: number;
  scoreReason: string;
  isDark: boolean;
  onRefresh: () => void;
  loading: boolean;
}

export default function ProactiveRecommendations({
  recommendations,
  productivityScore,
  scoreReason,
  isDark,
  onRefresh,
  loading
}: ProactiveRecommendationsProps) {
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'medium':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Productivity Score Card */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center gap-6 ${
        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <div className="relative shrink-0 flex items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              className={`${isDark ? 'stroke-neutral-800' : 'stroke-neutral-100'}`}
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              className="stroke-indigo-500"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * productivityScore) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black">{productivityScore}%</span>
            <span className="text-[9px] uppercase font-bold text-neutral-500">Balance</span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-1.5">
          <h3 className="font-bold text-lg flex items-center justify-center md:justify-start gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span>AI Productivity Health</span>
          </h3>
          <p className="text-sm font-medium text-neutral-400">{scoreReason}</p>
          <p className="text-xs text-neutral-500">
            Based on active tasks, deadlines, habit streak consistency, and overall completion momentum.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 text-xs font-semibold rounded-xl border border-indigo-500/20 transition-all shrink-0"
        >
          {loading ? 'Refreshing Coach...' : 'Get New AI Review'}
        </button>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-base">Proactive Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="recommendations-container">
          {recommendations.length === 0 ? (
            <div className={`col-span-3 p-8 text-center rounded-2xl border border-dashed ${
              isDark ? 'border-neutral-800' : 'border-neutral-200'
            }`}>
              <p className="text-xs text-neutral-500">No suggestions available. Click 'Get New AI Review' above.</p>
            </div>
          ) : (
            recommendations.map(rec => (
              <div
                key={rec.id}
                className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all hover:scale-[1.01] ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800' 
                    : 'bg-white border-neutral-200 shadow-sm hover:shadow-md'
                }`}
                id={`recommendation-card-${rec.id}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getUrgencyColor(rec.urgency)}`}>
                      {rec.urgency} Action
                    </span>
                    <Zap className={`w-4 h-4 ${rec.urgency === 'high' ? 'text-rose-500' : 'text-indigo-500'}`} />
                  </div>
                  <h4 className="font-bold text-sm tracking-tight">{rec.title}</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">{rec.description}</p>
                </div>

                <div className="pt-2 border-t border-neutral-800/10">
                  <span className="text-[11px] font-semibold text-indigo-500 flex items-center gap-1">
                    <span>{rec.suggestedAction}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
