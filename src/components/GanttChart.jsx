import React, { useRef, useEffect } from 'react';
import { Calendar, ZoomIn, ZoomOut, AlertTriangle, CheckCircle, Clock, ChevronUp, ChevronDown } from 'lucide-react';

// Hardcoded current date based on system metadata: 2026-06-26
const CURRENT_DATE = new Date('2026-06-26');

export default function GanttChart({
  activities,
  selectedActivities,
  onSelectActivity,
  zoom,
  setZoom,
  onMoveActivity
}) {
  const timelineRef = useRef(null);
  const hasActivities = activities && activities.length > 0;

  // 1. Calculate timeline range safely
  const dates = hasActivities ? activities.flatMap(act => {
    const list = [new Date(act.plan_start), new Date(act.plan_end)];
    if (act.actual_start) list.push(new Date(act.actual_start));
    if (act.actual_end) list.push(new Date(act.actual_end));
    return list;
  }) : [];

  const minDateVal = dates.length > 0 ? new Date(Math.min(...dates)) : CURRENT_DATE;
  const maxDateVal = dates.length > 0 ? new Date(Math.max(...dates)) : CURRENT_DATE;

  // Round timeline boundaries to start of the first month and end of the last month
  const timelineStart = new Date(minDateVal.getFullYear(), minDateVal.getMonth(), 1);
  const timelineEnd = new Date(maxDateVal.getFullYear(), maxDateVal.getMonth() + 1, 0);

  // Buffer: Ensure timeline has at least 3 months, and extends to cover CURRENT_DATE
  if (timelineStart > CURRENT_DATE) {
    timelineStart.setMonth(CURRENT_DATE.getMonth() - 1);
  }
  if (timelineEnd < CURRENT_DATE) {
    timelineEnd.setMonth(CURRENT_DATE.getMonth() + 2);
  }

  const totalTimeMs = timelineEnd.getTime() - timelineStart.getTime();

  // Helper: Get position percentage for a given date
  const getPositionPercent = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const offsetMs = date.getTime() - timelineStart.getTime();
    return Math.min(Math.max((offsetMs / totalTimeMs) * 100, 0), 100);
  };

  // Helper: Get width percentage for a date range
  const getWidthPercent = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const durationMs = end.getTime() - start.getTime() + 86400000; // include end day
    return Math.min(Math.max((durationMs / totalTimeMs) * 100, 0.5), 100);
  };

  // 2. Generate timeline headers based on zoom level
  const timelineHeaders = [];
  const currentDatePointer = new Date(timelineStart);

  if (zoom === 'month') {
    while (currentDatePointer <= timelineEnd) {
      timelineHeaders.push({
        label: currentDatePointer.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        key: `m-${currentDatePointer.getFullYear()}-${currentDatePointer.getMonth()}`,
        widthPercent: (30.4 * 24 * 60 * 60 * 1000 / totalTimeMs) * 100
      });
      currentDatePointer.setMonth(currentDatePointer.getMonth() + 1);
    }
  } else {
    // Zoom is 'week'
    // Stagger week headers (every week start)
    while (currentDatePointer <= timelineEnd) {
      timelineHeaders.push({
        label: currentDatePointer.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        key: `w-${currentDatePointer.getFullYear()}-${currentDatePointer.getMonth()}-${currentDatePointer.getDate()}`,
        widthPercent: (7 * 24 * 60 * 60 * 1000 / totalTimeMs) * 100
      });
      currentDatePointer.setDate(currentDatePointer.getDate() + 7);
    }
  }

  // Width of the scrollable timeline container based on columns count
  const columnWidth = zoom === 'month' ? 140 : 80;
  const timelineWidth = timelineHeaders.length * columnWidth;

  // Scroll to current date area on mount
  useEffect(() => {
    if (timelineRef.current && hasActivities) {
      const todayOffsetPercent = getPositionPercent(CURRENT_DATE.toISOString().split('T')[0]) / 100;
      const scrollPosition = (timelineWidth * todayOffsetPercent) - 200; // center it slightly
      timelineRef.current.scrollLeft = Math.max(scrollPosition, 0);
    }
  }, [zoom, timelineWidth, hasActivities]);

  // If there are no activities, show an empty state safely here
  if (!hasActivities) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl shadow-sm text-center h-full">
        <Calendar className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">No Activities Found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          There are no activities registered for this project yet. Use the "Add Activity" button to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full w-full">
      
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-2.5 py-1 rounded-full">
            Gantt Chart
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100/50">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse-subtle"></span>
            <span>Current Date: 26 Jun 2026</span>
          </div>
        </div>

        {/* Zoom Controls & Legend */}
        <div className="flex items-center flex-wrap gap-6">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-slate-300 rounded-sm"></span>
              <span>Plan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-emerald-500 rounded-sm"></span>
              <span>Actual (On Track)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-rose-500 rounded-sm"></span>
              <span>Actual (Delayed)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 border-b-2 border-dashed border-teal-500"></span>
              <span>In Progress</span>
            </div>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            <button
              onClick={() => setZoom('month')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                zoom === 'month'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ZoomOut className="w-3.5 h-3.5" />
              Monthly
            </button>
            <button
              onClick={() => setZoom('week')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                zoom === 'week'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              Weekly
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Chart Body */}
      <div className="overflow-x-auto flex-1 flex flex-col custom-scrollbar" ref={timelineRef}>
        
        {/* Timeline Grid Table */}
        <div style={{ width: `${timelineWidth + 280}px` }} className="flex-1 flex flex-col select-none">
          
          {/* Header Row */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 h-12 items-stretch z-10 sticky top-0">
            {/* Sticky Sidebar Header Column */}
            <div className="w-[280px] min-w-[280px] bg-slate-50 border-r border-slate-200 sticky left-0 flex items-center px-6 z-20 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.12)]">
              Activity Description
            </div>
            {/* Timeline columns */}
            <div className="flex-1 flex relative">
              {timelineHeaders.map((hdr, idx) => (
                <div
                  key={hdr.key}
                  style={{ width: `${columnWidth}px` }}
                  className={`flex-none border-r border-slate-200/50 flex items-center justify-center text-center px-1 font-medium ${
                    idx % 2 === 0 ? 'bg-slate-50/20' : 'bg-slate-50/50'
                  }`}
                >
                  {hdr.label}
                </div>
              ))}
            </div>
          </div>

          {/* Activity Rows */}
          <div className="flex-1 divide-y divide-slate-100 bg-white relative">
            
            {/* Today vertical line overlay */}
            <div
              style={{
                left: `${280 + (timelineWidth * (getPositionPercent(CURRENT_DATE.toISOString().split('T')[0]) / 100))}px`
              }}
              className="absolute top-0 bottom-0 w-[2px] bg-teal-500/40 z-1 pointer-events-none"
            >
              <div className="absolute -top-1.5 -left-[5px] w-3 h-3 rounded-full bg-teal-500 shadow-sm border border-white"></div>
            </div>

            {/* Render rows */}
            {activities.map((act, idx) => {
              const planStartPercent = getPositionPercent(act.plan_start);
              const planWidthPercent = getWidthPercent(act.plan_start, act.plan_end);

              const hasActualStart = act.actual_start && act.actual_start !== '';
              const hasActualEnd = act.actual_end && act.actual_end !== '';

              let actualStartPercent = 0;
              let actualWidthPercent = 0;
              let isDelayed = false;
              let delayDays = 0;
              let isCompleted = false;
              let isInProgress = false;

              if (hasActualStart) {
                actualStartPercent = getPositionPercent(act.actual_start);
                
                if (hasActualEnd) {
                  // Completed
                  isCompleted = true;
                  actualWidthPercent = getWidthPercent(act.actual_start, act.actual_end);
                  const planEnd = new Date(act.plan_end);
                  const actualEnd = new Date(act.actual_end);
                  delayDays = Math.round((actualEnd - planEnd) / (1000 * 60 * 60 * 24));
                  isDelayed = delayDays > 0;
                } else {
                  // In Progress: Draw bar up to today's date (or plan_end, whichever is larger, but mark as in progress)
                  isInProgress = true;
                  const planEnd = new Date(act.plan_end);
                  const endDateToUse = CURRENT_DATE > planEnd ? CURRENT_DATE : planEnd;
                  actualWidthPercent = getWidthPercent(act.actual_start, endDateToUse.toISOString().split('T')[0]);
                  
                  // Overdue calculation
                  if (CURRENT_DATE > planEnd) {
                    delayDays = Math.round((CURRENT_DATE - planEnd) / (1000 * 60 * 60 * 24));
                    isDelayed = delayDays > 0;
                  }
                }
              }

              const isSelected = selectedActivities.some(a => Number(a.id) === Number(act.id));
              const selectionIndex = selectedActivities.findIndex(a => Number(a.id) === Number(act.id)) + 1;

              return (
                <div
                  key={act.id}
                  onClick={() => onSelectActivity(act)}
                  className={`flex group items-stretch min-h-[76px] transition-colors duration-150 cursor-pointer ${
                    isSelected 
                      ? 'bg-brand-50/80 hover:bg-brand-100/60' 
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`w-[280px] min-w-[280px] border-r border-slate-200/80 sticky left-0 px-6 py-3 flex flex-col justify-center gap-1.5 z-10 transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.12)] ${
                      isSelected 
                        ? 'bg-brand-50 border-r-2 border-r-brand-500' 
                        : 'bg-white group-hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2 truncate">
                        {/* Selection order indicator */}
                        {isSelected && (
                          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold">
                            {selectionIndex}
                          </span>
                        )}
                        <span className={`text-xs font-semibold leading-tight truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'} flex items-center gap-1.5`}>
                          {act.project_name && (
                            <span className="flex-shrink-0 text-teal-600 font-extrabold bg-teal-50/80 border border-teal-200/60 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {act.project_name}
                            </span>
                          )}
                          <span className="truncate">{act.activity_name}</span>
                        </span>
                      </div>

                      {/* Reordering Controls (Only in individual project view, hidden in overall integrated view) */}
                      {!act.project_name && onMoveActivity && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveActivity('up', idx);
                            }}
                            disabled={idx === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 rounded transition-colors"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveActivity('down', idx);
                            }}
                            disabled={idx === activities.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 rounded transition-colors"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        Plan: {new Date(act.plan_start).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                      </span>
                      {isDelayed && (
                        <span className="flex items-center gap-0.5 text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-sm">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          +{delayDays}d
                        </span>
                      )}
                      {isCompleted && !isDelayed && (
                        <span className="flex items-center gap-0.5 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                          <CheckCircle className="w-2.5 h-2.5" />
                          Done
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Relative timeline canvas */}
                  <div className="flex-1 relative flex items-center min-h-full py-2 bg-slate-50/5">
                    
                    {/* Background grid vertical stripes */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timelineHeaders.map((hdr) => (
                        <div
                          key={`bg-${hdr.key}`}
                          style={{ width: `${columnWidth}px` }}
                          className="flex-none border-r border-slate-100 h-full"
                        />
                      ))}
                    </div>

                    {/* Dual bar wrapper */}
                    <div className="w-full relative h-12">
                      
                      {/* PLAN BAR (Top Bar - Soft slate-blue/gray) */}
                      <div
                        style={{
                          left: `${planStartPercent}%`,
                          width: `${planWidthPercent}%`
                        }}
                        title={`[Plan] ${act.activity_name}\nStart: ${act.plan_start}\nEnd: ${act.plan_end}`}
                        className={`absolute top-0 h-4 rounded-md bg-slate-300/80 border border-slate-400/20 group-hover:bg-slate-300 transition-all z-2 shadow-xs`}
                      >
                        <div className="w-full h-full flex items-center px-2 overflow-hidden">
                          <span className="text-[9px] font-bold text-slate-700 truncate select-none opacity-0 group-hover:opacity-100 transition-opacity">
                            Plan
                          </span>
                        </div>
                      </div>

                      {/* ACTUAL BAR (Bottom Bar) */}
                      {hasActualStart && (
                        <div
                          style={{
                            left: `${actualStartPercent}%`,
                            width: `${actualWidthPercent}%`
                          }}
                          title={`[Actual] ${act.activity_name}\nStart: ${act.actual_start}\nEnd: ${act.actual_end || 'In Progress'}\nStatus: ${isInProgress ? 'In Progress' : 'Completed'}`}
                          className={`absolute bottom-0 h-[18px] rounded-md transition-all z-2 shadow-xs border flex items-center justify-between px-2 overflow-hidden ${
                            isDelayed
                              ? 'bg-rose-500/90 text-white border-rose-600/30 hover:bg-rose-500'
                              : 'bg-teal-500/95 text-white border-teal-600/30 hover:bg-teal-500'
                          } ${isInProgress ? 'border-dashed border-2 animate-pulse-subtle' : ''}`}
                        >
                          {/* Inner status and label */}
                          <div className="flex items-center gap-1 overflow-hidden">
                            <span className="text-[9px] font-extrabold uppercase tracking-wide truncate">
                              {isInProgress ? 'Active' : 'Actual'}
                            </span>
                          </div>

                          {/* Delay badge floating at the end of the actual bar */}
                          {isDelayed && (
                            <span className="absolute -right-1 translate-x-full ml-2 bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap z-20">
                              +{delayDays} Days Delay
                            </span>
                          )}
                          {isCompleted && !isDelayed && (
                            <span className="absolute -right-1 translate-x-full ml-2 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap z-20">
                              On Track
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Legend/Tips footer */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-brand-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">✓</span>
          <span>Click on any activity row to select it for the <strong>Activity Gap Calculator</strong>.</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 border border-dashed border-teal-500 rounded-xs bg-teal-50"></span>
            <span>Dashed bar = In progress</span>
          </span>
          <span>Double-click a row to deselect all.</span>
        </div>
      </div>

    </div>
  );
}
