import React, { useState } from 'react';
import { X, Calendar, PlusCircle } from 'lucide-react';

export default function ActivityForm({ isOpen, onClose, onSubmit }) {
  const [activityName, setActivityName] = useState('');
  const [planStart, setPlanStart] = useState('');
  const [planEnd, setPlanEnd] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!activityName.trim()) {
      setError('Activity Name is required.');
      return;
    }
    if (!planStart) {
      setError('Planned Start Date is required.');
      return;
    }
    if (!planEnd) {
      setError('Planned End Date is required.');
      return;
    }

    const start = new Date(planStart);
    const end = new Date(planEnd);

    if (end < start) {
      setError('Planned End Date cannot be earlier than Planned Start Date.');
      return;
    }

    // Submit to parent
    onSubmit(activityName.trim(), planStart, planEnd);
    
    // Reset form
    setActivityName('');
    setPlanStart('');
    setPlanEnd('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">Add New Activity</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Activity Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Activity Name
            </label>
            <input
              type="text"
              placeholder="e.g., Boiler Steel Structure Erection"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              required
            />
          </div>

          {/* Planned Dates Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Planned Start
              </label>
              <input
                type="date"
                value={planStart}
                onChange={(e) => setPlanStart(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                required
              />
            </div>
            
            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Planned End
              </label>
              <input
                type="date"
                value={planEnd}
                onChange={(e) => setPlanEnd(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-xs border border-teal-700/10 transition-all"
            >
              Add Activity
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
