import React, { useState, useEffect } from 'react';
import { X, Printer, Calendar, ListTodo, CheckSquare, Square } from 'lucide-react';

// Generate selectable months from Jan 2025 to Dec 2028
const generateMonths = () => {
  const months = [];
  const startYear = 2025;
  const endYear = 2028;
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 0; m < 12; m++) {
      const monthStr = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const label = new Date(y, m, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push({
        value: monthStr,
        label: label
      });
    }
  }
  return months;
};

export default function PrintSetupModal({ isOpen, onClose, activities, initialSelectedIds, onConfirmPrint }) {
  const months = generateMonths();
  
  const [rangeType, setRangeType] = useState('all'); // 'all' or 'custom'
  const [startMonth, setStartMonth] = useState('2026-01-01');
  const [endMonth, setEndMonth] = useState('2027-12-01');
  const [visibleIds, setVisibleIds] = useState([]);
  const [paperSize, setPaperSize] = useState('A3');

  // Initialize visibleIds with selected activity IDs or all when open
  useEffect(() => {
    if (isOpen && activities) {
      if (initialSelectedIds && initialSelectedIds.length > 0) {
        setVisibleIds(initialSelectedIds.filter(id => activities.some(a => a.id === id)));
      } else {
        setVisibleIds(activities.map(a => a.id));
      }
    }
  }, [isOpen, activities, initialSelectedIds]);

  if (!isOpen) return null;

  const handleToggleActivity = (id) => {
    setVisibleIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setVisibleIds(activities.map(a => a.id));
  };

  const handleClearAll = () => {
    setVisibleIds([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmPrint({
      customStart: rangeType === 'custom' ? startMonth : null,
      customEnd: rangeType === 'custom' ? endMonth : null,
      selectedIds: visibleIds,
      paperSize: paperSize
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">Print Gantt Chart Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          
          {/* 1. Date Range Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Timeline Scope / Month Range</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 border border-slate-200 rounded-xl">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="radio"
                  name="rangeType"
                  checked={rangeType === 'all'}
                  onChange={() => setRangeType('all')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span>Entire Schedule (Auto-fit)</span>
              </label>
              
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="radio"
                  name="rangeType"
                  checked={rangeType === 'custom'}
                  onChange={() => setRangeType('custom')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span>Custom Months</span>
              </label>
            </div>

            {rangeType === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mt-1 bg-white p-3 border border-slate-200 rounded-xl">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Month</label>
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden w-full cursor-pointer"
                  >
                    {months.map(m => (
                      <option key={`start-${m.value}`} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Month</label>
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden w-full cursor-pointer"
                  >
                    {months.map(m => (
                      <option key={`end-${m.value}`} value={m.value} disabled={new Date(m.value) < new Date(startMonth)}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 2. Paper Size Selection Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Paper Size / Print Layout</span>
            </div>
            <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl">
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-full cursor-pointer transition-all"
              >
                <option value="A3">A3 Landscape (Recommended)</option>
                <option value="A4">A4 Landscape</option>
                <option value="A2">A2 Landscape</option>
                <option value="A1">A1 Landscape</option>
                <option value="A0">A0 Landscape</option>
              </select>
            </div>
          </div>

          {/* 3. Activities Checklist Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-slate-400" />
                <span>Select Activities to Print</span>
              </div>
              <div className="flex gap-2 font-bold text-[10px] lowercase text-teal-600">
                <button type="button" onClick={handleSelectAll} className="hover:underline">All</button>
                <span>|</span>
                <button type="button" onClick={handleClearAll} className="hover:underline">None</button>
              </div>
            </div>

            {/* Checklist */}
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[220px] overflow-y-auto bg-slate-50/50 custom-scrollbar p-2 flex flex-col gap-0.5">
              {activities.map((act) => {
                const isChecked = visibleIds.includes(act.id);
                return (
                  <div
                    key={`print-chk-${act.id}`}
                    onClick={() => handleToggleActivity(act.id)}
                    className={`flex items-center gap-2.5 py-2 px-3 hover:bg-slate-100/70 rounded-lg cursor-pointer transition-colors select-none ${
                      act.is_group ? 'font-bold bg-slate-50/30' : ''
                    }`}
                    style={{ paddingLeft: `${12 + (act.depth || 0) * 14}px` }}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-350 flex-shrink-0" />
                    )}
                    {act.project_name && (
                      <span className="flex-shrink-0 text-teal-600 font-extrabold bg-teal-50 border border-teal-200/60 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {act.project_name}
                      </span>
                    )}
                    <span className={`text-xs truncate ${act.is_group ? 'text-slate-800' : 'text-slate-650'}`}>
                      {act.activity_name}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-slate-400 text-right font-medium">
              Selected: {visibleIds.length} of {activities.length} items
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={visibleIds.length === 0}
              className="flex items-center gap-1.5 px-4.5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-xs border border-teal-700/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              Confirm & Print
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
