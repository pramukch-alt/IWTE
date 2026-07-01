import React, { useState, useEffect } from 'react';
import { X, Copy, CheckSquare, Square } from 'lucide-react';

export default function DuplicateModal({ isOpen, activity, projects, onClose, onDuplicate }) {
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);

  // Reset selections when modal opens or activity changes
  useEffect(() => {
    setSelectedProjectIds([]);
  }, [activity, isOpen]);

  if (!isOpen || !activity) return null;

  // Filter out the project the activity already belongs to
  const targetProjects = projects.filter(p => Number(p.id) !== Number(activity.project_id));

  const handleToggleProject = (projectId) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId) 
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjectIds.length === targetProjects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(targetProjects.map(p => p.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedProjectIds.length === 0) {
      alert('Please select at least one project to duplicate to.');
      return;
    }
    onDuplicate(activity.id, selectedProjectIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">Duplicate Activity</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Activity to Clone</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">{activity.activity_name}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Planned schedule ({activity.plan_start} to {activity.plan_end}) will be copied. Actual progress dates will be cleared in the duplicates.
            </span>
          </div>

          <div className="border-t border-slate-100 my-1"></div>

          {/* Project List */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Destination Projects
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[10px] font-bold text-teal-600 hover:text-teal-700 transition-all"
              >
                {selectedProjectIds.length === targetProjects.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar border border-slate-200/60 rounded-xl p-3 bg-slate-50/20">
              {targetProjects.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No other projects available.</p>
              ) : (
                targetProjects.map(proj => {
                  const isChecked = selectedProjectIds.includes(proj.id);
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => handleToggleProject(proj.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-xs font-semibold transition-all ${
                        isChecked
                          ? 'bg-teal-50/80 border-teal-200 text-teal-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span>{proj.name} Project</span>
                    </button>
                  );
                })
              )}
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
              disabled={selectedProjectIds.length === 0}
              className="px-4.5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-xs border border-teal-700/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Duplicate
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
