import React, { useState, useEffect } from 'react';
import { dbService } from './services/dbService';
import GanttChart from './components/GanttChart';
import ActivityTable from './components/ActivityTable';
import ActivityForm from './components/ActivityForm';
import DuplicateModal from './components/DuplicateModal';
import PrintSetupModal from './components/PrintSetupModal';
import {
  LayoutDashboard,
  Calendar,
  Search,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Database,
  RefreshCw,
  SlidersHorizontal,
  FolderKanban,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Printer
} from 'lucide-react';

export default function App() {
  // Database States
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(1);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState('month'); // 'month' or 'week'
  const [selectedActivities, setSelectedActivities] = useState([]); // Max 2 for gap measurement
  const [selectedOverallActivities, setSelectedOverallActivities] = useState([]); // Selected activity IDs in overall comparison view
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [activityToDuplicate, setActivityToDuplicate] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [collapsedGroups, setCollapsedGroups] = useState([]);

  // Print configuration states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printStart, setPrintStart] = useState(null);
  const [printEnd, setPrintEnd] = useState(null);
  const [printVisibleIds, setPrintVisibleIds] = useState([]);
  const [isPrintingActive, setIsPrintingActive] = useState(false);

  // Overall display comparison mode: 'project' or 'compare'
  const [overallMode, setOverallMode] = useState('project');

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const projs = await dbService.getProjects();
        setProjects(projs);
        if (projs.length > 0) {
          setSelectedProjectId(projs[0].id);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to connect to the database. Please verify your schema and connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch activities when selected project changes
  const fetchActivities = async () => {
    try {
      setLoading(true);
      if (selectedProjectId === 'overall') {
        const allActs = await dbService.getAllActivities();
        setActivities(allActs);
        // Pre-select all activities by default in overall view so the chart shows data immediately
        setSelectedOverallActivities(prev => {
          if (prev.length > 0) return prev;
          return allActs.map(a => a.id);
        });
      } else {
        const acts = await dbService.getActivities(selectedProjectId);
        setActivities(acts);
      }
      // Reset gap selection when project changes
      setSelectedActivities([]);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load project activities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchActivities();
    }
  }, [selectedProjectId]);

  // Handle adding a new activity
  const handleAddActivity = async (name, start, end, isGroup = false, parentId = null, color = '#0D9488') => {
    try {
      await dbService.addActivity(selectedProjectId, name, start, end, isGroup, parentId, color);
      await fetchActivities(); // refresh lists
    } catch (err) {
      console.error('Error adding activity:', err);
      alert('Failed to add activity. Check database connection.');
    }
  };

  // Handle updating activity details (both plan and actual)
  const handleUpdateActivity = async (id, name, planStart, planEnd, start, end, isGroup = false, parentId = null, color = '#0D9488') => {
    try {
      await dbService.updateActivity(id, name, planStart, planEnd, start, end, isGroup, parentId, color);
      await fetchActivities(); // refresh lists
      return true;
    } catch (err) {
      console.error('Error updating activity:', err);
      alert('Failed to update activity.');
      return false;
    }
  };

  // Trigger duplication modal
  const handleStartDuplicate = (activity) => {
    setActivityToDuplicate(activity);
    setIsDuplicateOpen(true);
  };

  // Handle duplicating an activity to target projects
  const handleDuplicateActivity = async (activityId, targetProjectIds) => {
    try {
      await dbService.duplicateActivity(activityId, targetProjectIds);
      await fetchActivities(); // refresh lists
    } catch (err) {
      console.error('Error duplicating activity:', err);
      alert('Failed to duplicate activity.');
    }
  };

  // Handle print settings confirmation
  const handleConfirmPrint = ({ customStart, customEnd, selectedIds, paperSize }) => {
    setPrintStart(customStart);
    setPrintEnd(customEnd);
    setPrintVisibleIds(selectedIds);
    setIsPrintingActive(true);
    setIsPrintModalOpen(false);

    // Apply paper size dynamically via style sheet injection
    const styleId = 'print-page-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      @media print {
        @page {
          size: ${paperSize || 'A3'} landscape !important;
          margin: 15mm 10mm 15mm 10mm !important;
        }
      }
    `;

    // Give state updates time to render, then open the print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Clean up printing state after print window closes
  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrintingActive(false);
      const styleEl = document.getElementById('print-page-style');
      if (styleEl) {
        styleEl.remove();
      }
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      const styleEl = document.getElementById('print-page-style');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  const getBlockRange = (list, startIdx) => {
    const startDepth = list[startIdx].depth || 0;
    let endIdx = startIdx + 1;
    while (endIdx < list.length && (list[endIdx].depth || 0) > startDepth) {
      endIdx++;
    }
    return { start: startIdx, end: endIdx };
  };

  // Handle manual custom reordering of activities (up/down) in WBS WtE Hierarchy
  const handleMoveActivity = async (direction, index) => {
    if (selectedProjectId === 'overall') return;

    // Get the current flattened list of activities for this project
    const flatList = getFlattenedActivities(activities);
    if (index < 0 || index >= flatList.length) return;

    const targetItem = flatList[index];
    
    // Find siblings (items with the same parent_id)
    const siblings = flatList.filter(a => a.parent_id === targetItem.parent_id);
    const sibIdx = siblings.findIndex(s => s.id === targetItem.id);

    let siblingItem = null;
    if (direction === 'up' && sibIdx > 0) {
      siblingItem = siblings[sibIdx - 1];
    } else if (direction === 'down' && sibIdx < siblings.length - 1) {
      siblingItem = siblings[sibIdx + 1];
    }

    if (!siblingItem) return;

    // Find indices of target and sibling in the flatList
    const targetFlatIdx = flatList.findIndex(a => a.id === targetItem.id);
    const siblingFlatIdx = flatList.findIndex(a => a.id === siblingItem.id);

    // Get block ranges (the item plus all its children)
    const targetBlock = getBlockRange(flatList, targetFlatIdx);
    const siblingBlock = getBlockRange(flatList, siblingFlatIdx);

    // Determine which block is first in the array
    const firstBlock = targetFlatIdx < siblingFlatIdx ? targetBlock : siblingBlock;
    const secondBlock = targetFlatIdx < siblingFlatIdx ? siblingBlock : targetBlock;

    const before = flatList.slice(0, firstBlock.start);
    const part1 = flatList.slice(firstBlock.start, firstBlock.end);
    const part2 = flatList.slice(secondBlock.start, secondBlock.end);
    const after = flatList.slice(secondBlock.end);

    // Swap the two WBS blocks (elements and their children move together)
    const reorderedFlat = [...before, ...part2, ...part1, ...after];

    // Optimistic UI update
    setActivities(reorderedFlat);

    try {
      await dbService.updateActivitiesOrder(reorderedFlat);
    } catch (err) {
      console.error('Error saving activity order:', err);
      fetchActivities();
    }
  };

  // Automatically sort activities in ascending order of planned start date
  const handleSortByPlannedStart = async () => {
    if (selectedProjectId === 'overall') return;

    // Sort by planned start date (earliest first)
    const sorted = [...activities].sort((a, b) => new Date(a.plan_start) - new Date(b.plan_start));

    // Optimistic local state update for a highly responsive UI
    setActivities(sorted);

    try {
      await dbService.updateActivitiesOrder(sorted);
    } catch (err) {
      console.error('Error saving sorted activities order:', err);
      // Revert if saving failed
      fetchActivities();
    }
  };

  // Toggle project checklist collapse/expand state
  const toggleProjectExpand = (projId) => {
    setExpandedProjects(prev =>
      prev.includes(projId) ? prev.filter(id => id !== projId) : [...prev, projId]
    );
  };

  // Toggle summary group collapse/expand state
  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  // WBS Tree Helpers
  const rollupDates = (activitiesList) => {
    const getDescendants = (nodes, parentId) => {
      let result = [];
      const children = nodes.filter(n => n.parent_id === parentId);
      for (const child of children) {
        result.push(child);
        result = [...result, ...getDescendants(nodes, child.id)];
      }
      return result;
    };

    return activitiesList.map(act => {
      if (!act.is_group) return act;

      const descendants = getDescendants(activitiesList, act.id).filter(d => !d.is_group);
      if (descendants.length === 0) {
        return {
          ...act,
          plan_start: null,
          plan_end: null,
          actual_start: null,
          actual_end: null
        };
      }

      const planStarts = descendants.map(d => d.plan_start).filter(Boolean).map(d => new Date(d));
      const planEnds = descendants.map(d => d.plan_end).filter(Boolean).map(d => new Date(d));
      const minPlanStart = planStarts.length > 0 ? new Date(Math.min(...planStarts)) : null;
      const maxPlanEnd = planEnds.length > 0 ? new Date(Math.max(...planEnds)) : null;

      const actualStarts = descendants.map(d => d.actual_start).filter(Boolean).map(d => new Date(d));
      const actualEnds = descendants.map(d => d.actual_end).filter(Boolean).map(d => new Date(d));
      const minActualStart = actualStarts.length > 0 ? new Date(Math.min(...actualStarts)) : null;

      const allDescendantsCompleted = descendants.every(d => !d.actual_start || d.actual_end);
      const maxActualEnd = allDescendantsCompleted && actualEnds.length === descendants.filter(d => d.actual_start).length && actualEnds.length > 0
        ? new Date(Math.max(...actualEnds))
        : null;

      return {
        ...act,
        plan_start: minPlanStart ? minPlanStart.toISOString().split('T')[0] : null,
        plan_end: maxPlanEnd ? maxPlanEnd.toISOString().split('T')[0] : null,
        actual_start: minActualStart ? minActualStart.toISOString().split('T')[0] : null,
        actual_end: maxActualEnd ? maxActualEnd.toISOString().split('T')[0] : null
      };
    });
  };

  const getFlattenedActivities = (activitiesList) => {
    const rolledUpList = rollupDates(activitiesList);

    const flatten = (nodes, parentId = null, depth = 0) => {
      const result = [];
      const levelNodes = nodes.filter(n => n.parent_id === parentId);
      levelNodes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      for (const node of levelNodes) {
        result.push({ ...node, depth });
        if (node.is_group && !collapsedGroups.includes(node.id)) {
          result.push(...flatten(nodes, node.id, depth + 1));
        }
      }
      return result;
    };

    const projectIds = [...new Set(activitiesList.map(a => Number(a.project_id)))];
    let result = [];
    for (const pid of projectIds) {
      const projNodes = rolledUpList.filter(n => Number(n.project_id) === pid);
      result = [...result, ...flatten(projNodes, null, 0)];
    }
    return result;
  };

  // Groups and stacks same-named activities from all projects next to each other
  const getComparisonFlattenedActivities = (activitiesList) => {
    const rolledUpList = rollupDates(activitiesList);

    const projectIds = [...new Set(activitiesList.map(a => Number(a.project_id)))];
    const masterProjectId = projectIds.length > 0 ? Math.min(...projectIds) : 1;

    // Establishing the master sequence of activity names from TPP (master project)
    const masterProjNodes = rolledUpList.filter(n => Number(n.project_id) === masterProjectId);
    const masterFlattened = getFlattenedActivities(masterProjNodes);

    const result = [];
    const processedIds = new Set();

    for (const masterAct of masterFlattened) {
      const nameKey = masterAct.activity_name.trim().toLowerCase();
      const matches = rolledUpList.filter(act => 
        act.activity_name.trim().toLowerCase() === nameKey &&
        !processedIds.has(act.id)
      );

      // Sort matching rows consistently by project ID
      matches.sort((a, b) => Number(a.project_id) - Number(b.project_id));

      for (const match of matches) {
        processedIds.add(match.id);
        result.push({
          ...match,
          depth: masterAct.depth // copy visual WBS depth for aligned indentation
        });
      }
    }

    // Append any extra activities that exist in other projects but not in TPP
    const remaining = rolledUpList.filter(act => !processedIds.has(act.id));
    if (remaining.length > 0) {
      result.push(...getFlattenedActivities(remaining));
    }

    return result;
  };

  // Handle deleting an activity
  const handleDeleteActivity = async (id) => {
    try {
      await dbService.deleteActivity(id);
      await fetchActivities(); // refresh lists
    } catch (err) {
      console.error('Error deleting activity:', err);
      alert('Failed to delete activity.');
    }
  };

  // Handle selecting an activity in Gantt Chart for the Gap Calculator
  const handleSelectActivity = (activity) => {
    setSelectedActivities(prev => {
      // Check if already selected, if so deselect it
      const isSelected = prev.some(a => Number(a.id) === Number(activity.id));
      if (isSelected) {
        return prev.filter(a => Number(a.id) !== Number(activity.id));
      }
      
      // Add to selection (max 2)
      if (prev.length < 2) {
        return [...prev, activity];
      } else {
        // If 2 already selected, clear and start with the new one
        return [activity];
      }
    });
  };

  // Calculate project metrics dynamically for display in Sidebar and KPI Cards
  const getProjectMetrics = (targetActivities) => {
    const total = targetActivities.length;
    if (total === 0) {
      return {
        percentComplete: 0,
        delayCount: 0,
        onTimePercent: 100,
        total: 0,
        completed: 0,
        inProgress: 0
      };
    }

    const today = new Date('2026-06-26');
    let completed = 0;
    let delayed = 0;
    let onTimeCompleted = 0;

    targetActivities.forEach(act => {
      const hasStart = act.actual_start && act.actual_start !== '';
      const hasEnd = act.actual_end && act.actual_end !== '';
      const planEnd = new Date(act.plan_end);

      if (hasEnd) {
        completed++;
        const actualEnd = new Date(act.actual_end);
        if (actualEnd > planEnd) {
          delayed++;
        } else {
          onTimeCompleted++;
        }
      } else if (hasStart) {
        // In progress
        if (today > planEnd) {
          delayed++; // Overdue
        }
      }
    });

    const percentComplete = Math.round((completed / total) * 100);
    const onTimePercent = completed > 0 ? Math.round((onTimeCompleted / completed) * 100) : 100;

    return {
      percentComplete,
      delayCount: delayed,
      onTimePercent,
      total,
      completed,
      inProgress: total - completed - (targetActivities.filter(a => !a.actual_start).length)
    };
  };

  const currentMetrics = getProjectMetrics(activities);

  // Filter activities dynamically: in overall view, only show checked activities from the selector panel
  const displayActivities = selectedProjectId === 'overall'
    ? (overallMode === 'compare' 
        ? getComparisonFlattenedActivities(activities) 
        : getFlattenedActivities(activities)
      ).filter(act => selectedOverallActivities.includes(act.id))
    : getFlattenedActivities(activities.filter(act => Number(act.project_id) === Number(selectedProjectId)));

  // Filter by selected print IDs if print is active
  const printFilteredActivities = isPrintingActive
    ? displayActivities.filter(act => printVisibleIds.includes(act.id))
    : displayActivities;

  // Filter activities by search term
  const filteredActivities = printFilteredActivities.filter(act =>
    act.activity_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate gap between two selected activities
  const getGapCalculation = () => {
    if (selectedActivities.length !== 2) return null;
    
    // Sort activities by plan_start so we know which is first
    const [actA, actB] = [...selectedActivities].sort(
      (a, b) => new Date(a.plan_start) - new Date(b.plan_start)
    );

    const endA = new Date(actA.plan_end);
    const startB = new Date(actB.plan_start);

    // Calculate Planned Gap
    // Gap = B.start - A.end
    // Subtract 1 day for a clean gap (e.g. A ends on Mon, B starts on Tue = 0 days gap, starts next day)
    const planGapTime = startB.getTime() - endA.getTime();
    const planGapDays = Math.round(planGapTime / (1000 * 60 * 60 * 24)) - 1;

    // Calculate Actual Gap (if actual dates are available)
    let actualGapDays = null;
    let actualGapStatus = 'pending'; // 'pending', 'gap', 'overlap'

    const actualEndA = actA.actual_end ? new Date(actA.actual_end) : null;
    const actualStartB = actB.actual_start ? new Date(actB.actual_start) : null;

    if (actualEndA && actualStartB) {
      const actualGapTime = actualStartB.getTime() - actualEndA.getTime();
      actualGapDays = Math.round(actualGapTime / (1000 * 60 * 60 * 24)) - 1;
      actualGapStatus = actualGapDays >= 0 ? 'gap' : 'overlap';
    }

    return {
      firstAct: actA,
      secondAct: actB,
      planGapDays,
      actualGapDays,
      actualGapStatus
    };
  };

  const gapResult = getGapCalculation();


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="bg-slate-900 text-slate-300 px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 shadow-md print:hidden">
        <div className="flex items-center gap-4">
          
          {/* Hamburger Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center border border-slate-700/30"
              title="Select Project"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Floating Dropdown Selector */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsMenuOpen(false)}
                />
                
                <div className="absolute left-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl py-4 px-3 flex flex-col gap-2 z-40">
                  <div className="px-3 pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Dashboard</span>
                    <span className="text-[9px] font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">7 Sites</span>
                  </div>
                  
                  {/* Master View Link */}
                  <button
                    onClick={() => {
                      setSelectedProjectId('overall');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all border ${
                      selectedProjectId === 'overall'
                        ? 'bg-gradient-to-r from-teal-500/15 to-brand-500/15 text-white font-bold border-teal-500/35 shadow-xs'
                        : 'hover:bg-slate-800/50 hover:text-slate-200 border-transparent text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className={`w-4 h-4 ${selectedProjectId === 'overall' ? 'text-teal-400' : 'text-slate-500'}`} />
                      <span className="text-sm">Overall IWTE Integration</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-widest">
                      Master
                    </span>
                  </button>

                  <div className="border-t border-slate-800/50 my-1"></div>

                  <span className="text-[9px] font-bold text-slate-500 px-3 uppercase tracking-widest mb-1 block">
                    Individual Projects
                  </span>

                  {/* Scrollable list of individual sites */}
                  <div className="max-h-[350px] overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                    {projects.map((proj) => {
                      const isActive = selectedProjectId === proj.id;
                      return (
                        <button
                          key={proj.id}
                          onClick={() => {
                            setSelectedProjectId(proj.id);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all group border ${
                            isActive 
                              ? 'bg-teal-500/10 text-white font-semibold border-teal-500/20' 
                              : 'hover:bg-slate-800/50 hover:text-slate-300 border-transparent text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full transition-colors ${
                              isActive ? 'bg-teal-400' : 'bg-slate-600 group-hover:bg-slate-400'
                            }`}></div>
                            <span className="text-sm">{proj.name} Project</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                            51w
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Database Status inside dropdown footer */}
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 px-2">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-teal-400" />
                      <span>{dbService.isSupabaseActive() ? 'Supabase DB' : 'Local Sandbox'}</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Logo and App Title */}
          <div className="flex items-center gap-2.5 border-l border-slate-800 pl-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-950/40">
              <FolderKanban className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-wider leading-none">IWTE</h1>
              <p className="text-[8px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">Integrated Progress Hub</p>
            </div>
          </div>
        </div>

        {/* Current Active Dashboard Title in Header */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/30 px-4 py-1.5 rounded-xl border border-slate-800/50">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Site:</span>
          <span className="text-white text-xs font-bold bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">
            {selectedProjectId === 'overall' ? 'Overall Integrated Master' : `${projects.find(p => p.id === selectedProjectId)?.name} Project`}
          </span>
        </div>

        {/* Action Controls in Header (Search & Add Activity) */}
        <div className="flex items-center gap-3">
          {/* Search bar inside top header */}
          <div className="relative w-48 lg:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-hidden focus:bg-slate-850 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Print Button */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Configure & Print Gantt Chart"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            Print
          </button>

          {/* Add Activity Button (Hidden in overall view) */}
          {selectedProjectId !== 'overall' && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl border border-teal-700/15 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Activity
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN HUB (Full Width) */}
      <main className="flex-1 flex flex-col w-full overflow-y-auto">
        
        {/* Dashboard Area */}
        <div className="p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto flex-1 print:p-0 print:gap-4 print:max-w-none">
          {/* Print Header (Only visible when printing) */}
          <div className="hidden print:block mb-6 border-b-2 border-slate-300 pb-4">
            <div className="flex items-baseline justify-between">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {selectedProjectId === 'overall' 
                  ? 'Overall IWTE Integrated Master Schedule' 
                  : `${projects.find(p => Number(p.id) === Number(selectedProjectId))?.name || ''} Project Schedule`}
              </h1>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                IWTE Progress Report
              </span>
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs text-slate-500 font-semibold">
              <div>Report Date: <span className="font-bold">{new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</span></div>
              <div>Database Status: <span className="font-bold">{dbService.isSupabaseActive() ? 'Live Supabase DB' : 'Local Sandbox'}</span></div>
            </div>
          </div>

          {/* Compact Page Title Header */}
          <div className="flex flex-col gap-1 print:hidden">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
              <span>IWTE Master Report</span>
              <ArrowRight className="w-2.5 h-2.5" />
              <span className="text-slate-600 font-bold">
                {selectedProjectId === 'overall' ? 'Overall Integrated' : `${projects.find(p => Number(p.id) === Number(selectedProjectId))?.name || ''} Site`}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {selectedProjectId === 'overall' ? 'Overall IWTE Integrated Master' : projects.find(p => Number(p.id) === Number(selectedProjectId))?.name} Waste-to-Energy Project Schedule
            </h2>
          </div>
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 print:hidden">
            
            {/* KPI 1: Overall Progress */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Overall Progress</span>
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-800">{currentMetrics.percentComplete}%</span>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden border border-slate-200/50">
                  <div 
                    style={{ width: `${currentMetrics.percentComplete}%` }} 
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {currentMetrics.completed} of {currentMetrics.total} activities completed
              </span>
            </div>

            {/* KPI 2: Schedule Adherence */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Schedule Adherence</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-800">{currentMetrics.onTimePercent}%</span>
                <p className="text-xs text-slate-500 mt-2 font-medium">Completed on-time execution</p>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Targeting zero delays across 51 weeks
              </span>
            </div>

            {/* KPI 3: Active Delays */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Delays</span>
                <AlertTriangle className={`w-5 h-5 ${currentMetrics.delayCount > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
              </div>
              <div>
                <span className={`text-2xl font-black ${currentMetrics.delayCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {currentMetrics.delayCount} Activities
                </span>
                <p className="text-xs text-slate-500 mt-2 font-medium">Overdue or delayed completions</p>
              </div>
              <span className={`text-[10px] font-bold ${currentMetrics.delayCount > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                {currentMetrics.delayCount > 0 ? 'Requires executive review' : 'All milestones on track'}
              </span>
            </div>

            {/* KPI 4: Active Workload */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workload Status</span>
                <Clock className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-800">{currentMetrics.inProgress} In-Progress</span>
                <p className="text-xs text-slate-500 mt-2 font-medium">Currently active on-site activities</p>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {currentMetrics.total - currentMetrics.completed - currentMetrics.inProgress} activities in pipeline
              </span>
            </div>

          </div>

          {/* 3. ACTIVITY GAP MEASUREMENT PANEL */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col gap-4 print:hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-800">Activity Gap Measurement Tool</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded-sm">
                Interactive Analyzer
              </span>
            </div>

            {!gapResult ? (
              <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 max-w-md mx-auto px-4">
                  Select <strong>two activities</strong> inside the Gantt Chart below. The system will instantly compute the planned schedule buffer and actual progress gap between them.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Activity A Summary */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-center gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold">1</span>
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">First Activity</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 truncate">{gapResult.firstAct.activity_name}</h4>
                  <div className="text-xs text-slate-600 space-y-0.5 mt-1">
                    <div>Plan End: <span className="font-semibold">{new Date(gapResult.firstAct.plan_end).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span></div>
                    <div>Actual End: <span className="font-semibold">{gapResult.firstAct.actual_end ? new Date(gapResult.firstAct.actual_end).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Pending'}</span></div>
                  </div>
                </div>

                {/* Gap Visual and Calculations */}
                <div className="border border-slate-200 p-4 rounded-xl flex flex-col justify-center items-center text-center gap-2 bg-teal-50/20">
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Gap Metrics</div>
                  
                  {/* Plan Gap Display */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-medium text-slate-500">Planned Gap</span>
                    <span className={`text-lg font-black ${gapResult.planGapDays >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                      {gapResult.planGapDays >= 0 
                        ? `${gapResult.planGapDays} Days Buffer` 
                        : `Overlap of ${Math.abs(gapResult.planGapDays)} Days`}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="w-full border-t border-slate-200/60 my-1"></div>

                  {/* Actual Gap Display */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-medium text-slate-500">Actual Progress Gap</span>
                    {gapResult.actualGapDays !== null ? (
                      <span className={`text-lg font-black ${gapResult.actualGapDays >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                        {gapResult.actualGapDays >= 0 
                          ? `${gapResult.actualGapDays} Days Gap` 
                          : `Overlap of ${Math.abs(gapResult.actualGapDays)} Days`}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-sm mt-0.5">
                        Pending (Requires Actual Dates)
                      </span>
                    )}
                  </div>
                </div>

                {/* Activity B Summary */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-center gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold">2</span>
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Second Activity</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 truncate">{gapResult.secondAct.activity_name}</h4>
                  <div className="text-xs text-slate-600 space-y-0.5 mt-1">
                    <div>Plan Start: <span className="font-semibold">{new Date(gapResult.secondAct.plan_start).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span></div>
                    <div>Actual Start: <span className="font-semibold">{gapResult.secondAct.actual_start ? new Date(gapResult.secondAct.actual_start).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Pending'}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. GANTT CHART DASHBOARD VIEW (With Integrated Selector in Overall View) */}
          <div className="flex flex-col lg:flex-row print:flex-row gap-6 items-stretch">
            
            {/* Master Activity Checklist Panel (Only rendered in Overall IWTE Integration View) */}
            {selectedProjectId === 'overall' && (
              <div className="w-full lg:w-[290px] overall-selector flex-shrink-0 bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col gap-4 max-h-[580px] overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Integrated Selector</h3>
                    <p className="text-[9px] text-slate-500 mt-0.5">Filter timeline comparison</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedOverallActivities(activities.map(a => a.id))}
                      className="text-[9px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded transition-all"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedOverallActivities([])}
                      className="text-[9px] font-bold text-slate-500 hover:text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded transition-all border border-slate-200"
                    >
                      None
                    </button>
                  </div>
                </div>

                {/* Grouping / Comparison Mode Selector */}
                <div className="flex flex-col gap-1.5 flex-shrink-0 border-b border-slate-100 pb-3.5 mt-1 print:hidden">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Display Mode / จัดเรียงกิจกรรม
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-205/40">
                    <button
                      type="button"
                      onClick={() => setOverallMode('project')}
                      className={`px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        overallMode === 'project'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      By Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverallMode('compare')}
                      className={`px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        overallMode === 'compare'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-550 hover:text-slate-800'
                      }`}
                    >
                      Compare Activities
                    </button>
                  </div>
                </div>

                {/* Scrollable list grouped by project */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                  {projects.map(proj => {
                    const projActs = getFlattenedActivities(activities.filter(a => Number(a.project_id) === Number(proj.id)));
                    if (projActs.length === 0) return null;

                    const projActIds = projActs.map(a => a.id);
                    const isAllSelected = projActIds.every(id => selectedOverallActivities.includes(id));
                    const isSomeSelected = projActIds.some(id => selectedOverallActivities.includes(id)) && !isAllSelected;

                    const handleToggleProject = () => {
                      if (isAllSelected) {
                        setSelectedOverallActivities(prev => prev.filter(id => !projActIds.includes(id)));
                      } else {
                        setSelectedOverallActivities(prev => [...new Set([...prev, ...projActIds])]);
                      }
                    };

                    return (
                      <div key={proj.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        {/* Project Header Checkbox & Collapse Toggle */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleProjectExpand(proj.id)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                          >
                            {expandedProjects.includes(proj.id) ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                          
                          <label className="flex items-center gap-2 font-bold text-xs text-slate-700 cursor-pointer hover:text-teal-600 transition-colors flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              ref={el => {
                                if (el) el.indeterminate = isSomeSelected;
                              }}
                              onChange={handleToggleProject}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="truncate">{proj.name} Project</span>
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-full ml-auto">
                              {projActs.filter(a => selectedOverallActivities.includes(a.id)).length}/{projActs.length}
                            </span>
                          </label>
                        </div>

                        {/* Sub-activities List */}
                        {expandedProjects.includes(proj.id) && (
                          <div className="pl-6.5 space-y-1.5 animate-in fade-in duration-150">
                            {projActs.map(act => {
                              const isChecked = selectedOverallActivities.includes(act.id);
                              const handleToggleActivity = () => {
                                setSelectedOverallActivities(prev =>
                                  isChecked ? prev.filter(id => id !== act.id) : [...prev, act.id]
                                );
                              };

                              return (
                                <label
                                  key={act.id}
                                  className="flex items-start gap-2 text-[11px] font-medium text-slate-600 hover:text-slate-800 cursor-pointer select-none leading-tight"
                                  style={{ paddingLeft: `${(act.depth || 0) * 12}px` }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={handleToggleActivity}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3 h-3 mt-0.5 cursor-pointer"
                                  />
                                  <span className={act.is_group ? "font-bold text-slate-700 truncate" : "truncate"} title={act.activity_name}>
                                    {act.activity_name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gantt Chart Panel */}
            <div className="flex-1 min-h-[450px] min-w-0 overflow-hidden">
              <GanttChart
                activities={filteredActivities}
                selectedActivities={selectedActivities}
                onSelectActivity={handleSelectActivity}
                zoom={zoom}
                setZoom={setZoom}
                onMoveActivity={handleMoveActivity}
                onSortByPlannedStart={handleSortByPlannedStart}
                isOverallView={selectedProjectId === 'overall'}
                collapsedGroups={collapsedGroups}
                onToggleGroupCollapse={toggleGroupCollapse}
                customStart={isPrintingActive ? printStart : null}
                customEnd={isPrintingActive ? printEnd : null}
              />
            </div>
          </div>

          {/* 5. DATA MANAGEMENT TABLE */}
          <div className="mb-8 print:hidden">
            <ActivityTable
              activities={filteredActivities}
              onUpdateActivity={handleUpdateActivity}
              onDeleteActivity={handleDeleteActivity}
              onDuplicateClick={handleStartDuplicate}
              onMoveActivity={handleMoveActivity}
              onSortByPlannedStart={handleSortByPlannedStart}
              isOverallView={selectedProjectId === 'overall'}
              collapsedGroups={collapsedGroups}
              onToggleGroupCollapse={toggleGroupCollapse}
              parentGroups={activities.filter(a => a.is_group)}
            />
          </div>

        </div>
      </main>

      {/* 6. ADD ACTIVITY MODAL */}
      <ActivityForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddActivity}
        parentGroups={activities.filter(a => a.is_group)}
      />

      {/* 7. DUPLICATE ACTIVITY MODAL */}
      <DuplicateModal
        isOpen={isDuplicateOpen}
        activity={activityToDuplicate}
        projects={projects}
        onClose={() => setIsDuplicateOpen(false)}
        onDuplicate={handleDuplicateActivity}
      />

      {/* 8. PRINT CONFIGURATION MODAL */}
      <PrintSetupModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activities={displayActivities}
        onConfirmPrint={handleConfirmPrint}
      />

    </div>
  );
}
