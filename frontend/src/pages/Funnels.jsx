import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProjectStore } from '../store/projectStore';
import api from '../services/api';
import { 
  GitMerge, Plus, Trash2, Play, Users, 
  Percent, ArrowRight, TrendingDown
} from 'lucide-react';

const DEFAULT_STEPS = [
  'Landing Page View',
  'Pricing Page View',
  'Signup Started',
  'Signup Completed',
  'Checkout Page View',
  'Purchase Successful'
];

export default function Funnels() {
  const activeProject = useProjectStore(state => state.activeProject);
  
  // Custom Funnel steps builder state
  const [funnelSteps, setFunnelSteps] = useState(DEFAULT_STEPS);
  const [newStepText, setNewStepText] = useState('');

  // Fetch funnel statistics
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['funnel', activeProject?._id, funnelSteps],
    queryFn: async () => {
      if (!activeProject?._id || funnelSteps.length === 0) return null;
      const res = await api.post('/analytics/funnel', {
        projectId: activeProject._id,
        steps: funnelSteps
      });
      return res.data.funnel;
    },
    enabled: !!activeProject?._id && funnelSteps.length > 0
  });

  const handleAddStep = (e) => {
    e.preventDefault();
    if (!newStepText.trim()) return;
    setFunnelSteps([...funnelSteps, newStepText.trim()]);
    setNewStepText('');
  };

  const handleRemoveStep = (index) => {
    const updated = funnelSteps.filter((_, idx) => idx !== index);
    setFunnelSteps(updated);
  };

  const handleResetToDefault = () => {
    setFunnelSteps(DEFAULT_STEPS);
  };

  const stepsData = data?.steps || [];
  const absoluteConversion = data?.absoluteConversion || 0;
  const totalFunnelUsers = data?.totalFunnelUsers || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Funnel Analytics pipeline</h2>
          <p className="text-xs text-slate-400 mt-0.5">Analyze step-by-step conversion and user drop-off journeys.</p>
        </div>
        <button
          onClick={handleResetToDefault}
          className="rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 bg-opacity-40 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          Reset default steps
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Step Builder Panel (Left 1/3) */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-900 pb-3">
            <GitMerge className="h-4.5 w-4.5 text-indigo-400" />
            Funnel Steps Config
          </h3>

          {/* List of steps */}
          <div className="space-y-2 text-xs">
            {funnelSteps.map((step, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2.5 border border-slate-900 group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-905 border border-indigo-600/30 text-[9px] font-bold text-indigo-400">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-slate-300 truncate">{step}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="rounded p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {funnelSteps.length === 0 && (
              <p className="text-slate-500 italic py-4 text-center">Add steps to track a funnel flow.</p>
            )}
          </div>

          {/* Add new step Form */}
          <form onSubmit={handleAddStep} className="mt-4 pt-3 border-t border-slate-900 flex gap-2">
            <input
              type="text"
              required
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              placeholder="e.g. Added to Cart"
              className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 p-2 text-white shadow-neon transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Funnel Visualization Panel (Right 2/3) */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 flex flex-col justify-between min-h-[400px]">
          <div>
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 mb-4">
              Chronological Flow Aggregation
            </h3>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic text-xs">
                <div className="h-8 w-8 border-t-2 border-indigo-500 rounded-full animate-spin mb-3"></div>
                <p>Calculating conversions...</p>
              </div>
            ) : isError || stepsData.length === 0 ? (
              <div className="text-center py-20 text-slate-500 italic text-xs">
                <p>Failed to load funnel analytics. Check project details.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {stepsData.map((step, index) => (
                  <div key={index} className="space-y-1.5">
                    {/* Step details header */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-300">
                          {index + 1}. {step.stepName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 font-semibold">
                        <span>{step.count.toLocaleString()} users</span>
                        <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-400">
                          {step.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress conversion bar */}
                    <div className="relative h-6 w-full rounded-md bg-slate-950 border border-slate-900 overflow-hidden">
                      <div 
                        className="h-full rounded-l bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-neon transition-all duration-500 ease-out"
                        style={{ width: `${step.percentage}%` }}
                      />
                      
                      {/* Step index label inside */}
                      <span className="absolute left-2.5 top-1 text-[9px] font-mono text-slate-500">
                        STAGE_{index + 1}
                      </span>
                    </div>

                    {/* Dropoff metrics display (only if not first step) */}
                    {index > 0 && step.dropOffCount > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-pink-400 font-semibold px-2 py-0.5 bg-pink-500/5 border border-pink-500/10 rounded w-fit">
                        <TrendingDown className="h-3 w-3" />
                        Lost: -{step.dropOffCount} users ({step.dropOffPercentage}% drop-off)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Funnel KPI Summaries (Footer) */}
          {!isLoading && stepsData.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-900 pt-5 text-xs">
              <div className="rounded-lg bg-slate-950 border border-slate-900 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="h-4.5 w-4.5 text-indigo-400" />
                  <span className="font-semibold text-[10px] uppercase tracking-wider">Total Entrants</span>
                </div>
                <h4 className="text-xl font-bold text-slate-200 mt-2">{totalFunnelUsers.toLocaleString()}</h4>
                <p className="text-[9px] text-slate-500 mt-0.5">Users matching the first funnel step</p>
              </div>

              <div className="rounded-lg bg-slate-950 border border-slate-900 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Percent className="h-4.5 w-4.5 text-indigo-400" />
                  <span className="font-semibold text-[10px] uppercase tracking-wider">Overall Conversion</span>
                </div>
                <h4 className="text-xl font-bold text-slate-200 mt-2">{absoluteConversion}%</h4>
                <p className="text-[9px] text-slate-500 mt-0.5">Ratio of entrants who completed all stages</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
