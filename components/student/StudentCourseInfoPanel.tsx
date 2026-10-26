'use client';

import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileText,
  User,
  Building2,
  Calendar,
  ExternalLink,
  Download,
  Search,
  HelpCircle,
  ShieldCheck,
  Video,
  Presentation,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import {
  CourseData,
  DEFAULT_COURSE,
  getStudentCourseData,
  getAllSelectableCourses
} from '@/lib/courseBuilder/defaultCourse';
import { CourseUnit, LessonBlock } from '@/lib/courseBuilder/units';
import { CourseAssessment, RubricLevel } from '@/lib/courseBuilder/rubrics';

interface StudentCourseInfoPanelProps {
  initialCourseCode?: string;
  onAskAgentAboutUnit?: (unitCode: string, unitTitle: string) => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const StudentCourseInfoPanel: React.FC<StudentCourseInfoPanelProps> = ({
  initialCourseCode,
  onAskAgentAboutUnit,
  onNavigateToTab
}) => {
  const selectableCourses = useMemo(() => getAllSelectableCourses(), []);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    initialCourseCode || DEFAULT_COURSE.code
  );

  const activeCourse: CourseData = useMemo(() => {
    return getStudentCourseData(selectedCourseCode);
  }, [selectedCourseCode]);

  const [activeUnitIndex, setActiveUnitIndex] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<
    'curriculum' | 'elements' | 'lessons' | 'assessments' | 'faculty' | 'admissions'
  >('curriculum');
  const [searchUnitQuery, setSearchUnitQuery] = useState<string>('');
  const [expandedElement, setExpandedElement] = useState<string | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<string | null>(null);
  const [activeRubricLevelIndex, setActiveRubricLevelIndex] = useState<number>(0);

  const units: CourseUnit[] = activeCourse.units || [];
  const currentUnit: CourseUnit = units[activeUnitIndex] || units[0] || DEFAULT_COURSE.units[0];

  const filteredUnits = useMemo(() => {
    if (!searchUnitQuery.trim()) return units;
    const q = searchUnitQuery.toLowerCase();
    return units.filter(
      (u) =>
        u.unitCode.toLowerCase().includes(q) ||
        u.unitTitle.toLowerCase().includes(q) ||
        (u.description || '').toLowerCase().includes(q)
    );
  }, [units, searchUnitQuery]);

  // Total course statistics
  const totalNominalHours = units.reduce((acc, u) => acc + (u.nominalHours || 40), 0);
  const totalAssessments = units.reduce((acc, u) => acc + (u.assessments || []).length, 0);
  const totalLessons = units.reduce((acc, u) => acc + (u.lessons || []).length, 0);
  const totalElements = units.reduce((acc, u) => {
    const uniqueElements = new Set((u.performanceCriteria || []).map((pc) => pc.element));
    return acc + uniqueElements.size;
  }, 0);

  // Group performance criteria by element for active unit
  const criteriaByElement = useMemo(() => {
    const map = new Map<string, typeof currentUnit.performanceCriteria>();
    (currentUnit.performanceCriteria || []).forEach((pc) => {
      const element = pc.element || 'Element 1: Core Performance Requirements';
      if (!map.has(element)) {
        map.set(element, []);
      }
      map.get(element)!.push(pc);
    });
    return Array.from(map.entries());
  }, [currentUnit]);

  const handleDownloadSyllabus = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `Course Code,Course Title,AQF Level,Framework\n` +
          `"${activeCourse.code}","${activeCourse.title}","Level ${activeCourse.aqfLevel}","${activeCourse.frameworkCode}"\n\n` +
          `Unit Code,Unit Title,Nominal Hours,Description\n` +
          units
            .map(
              (u) =>
                `"${u.unitCode}","${u.unitTitle}",${u.nominalHours || 40},"${(u.description || '').replace(/"/g, '""')}"`
            )
            .join('\n')
      );
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${activeCourse.code}_Curriculum_Syllabus.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderBlockIcon = (type: LessonBlock['type']) => {
    switch (type) {
      case 'presentation':
        return <Presentation className="w-3.5 h-3.5 text-indigo-600" />;
      case 'video':
      case 'youtube_video':
        return <Video className="w-3.5 h-3.5 text-rose-600" />;
      case 'notebook':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div
      data-agent-id="student-course-info-panel"
      data-testid="student-course-info-panel"
      className="w-full space-y-6 animate-in fade-in duration-300"
    >
      {/* 1. Header Hero Card with Course Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold tracking-wider uppercase border border-indigo-400/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Student Academic Curriculum Hub
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-mono font-bold border border-emerald-400/30">
                {activeCourse.frameworkCode} Accredited
              </span>
              <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-200 rounded-full text-xs font-semibold border border-purple-400/30">
                AQF Level {activeCourse.aqfLevel}
              </span>
            </div>

            {/* Course Selector Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="course-select" className="text-xs text-slate-300 font-semibold hidden sm:inline">
                Curriculum Program:
              </label>
              <select
                id="course-select"
                data-testid="student-course-selector"
                value={selectedCourseCode}
                onChange={(e) => {
                  setSelectedCourseCode(e.target.value);
                  setActiveUnitIndex(0);
                }}
                className="bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer transition-all"
              >
                {selectableCourses.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.code}: {c.title} ({c.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h1
              data-testid="student-course-title"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight"
            >
              {activeCourse.title}
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-2 max-w-3xl leading-relaxed">
              {activeCourse.description ||
                'Accredited vocational and higher education qualification with verified learning outcomes, weekly modular lessons, and 5-level rubric assessments.'}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-indigo-300" /> Units of Study
              </div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">
                {units.length} <span className="text-xs font-normal text-blue-200">Units</span>
              </div>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-300" /> Nominal Hours
              </div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">
                {totalNominalHours} <span className="text-xs font-normal text-blue-200">Hours</span>
              </div>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-300" /> Assessment Tasks
              </div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">
                {totalAssessments} <span className="text-xs font-normal text-blue-200">Tasks</span>
              </div>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-300" /> Competency Elements
              </div>
              <div className="text-lg sm:text-xl font-black text-white mt-0.5">
                {totalElements} <span className="text-xs font-normal text-blue-200">Elements</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 flex-wrap">
        {[
          { id: 'curriculum', label: 'Units & Syllabi', icon: BookOpen, count: units.length, testId: 'student-subtab-curriculum' },
          { id: 'elements', label: 'Competency Elements', icon: Layers, count: totalElements, testId: 'student-subtab-elements' },
          { id: 'lessons', label: 'Lesson Modules', icon: Clock, count: totalLessons, testId: 'student-subtab-lessons' },
          { id: 'assessments', label: 'Assessment Rubrics', icon: Award, count: totalAssessments, testId: 'student-subtab-assessments' },
          { id: 'faculty', label: 'Course Leadership & Faculty', icon: Building2, testId: 'student-subtab-faculty' },
          { id: 'admissions', label: 'Course Entry & Rules', icon: ShieldCheck, testId: 'student-subtab-admissions' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={tab.testId}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-white text-indigo-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 pr-1">
          <button
            type="button"
            data-testid="student-download-syllabus-btn"
            onClick={handleDownloadSyllabus}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Download Syllabus (.csv)</span>
          </button>
        </div>
      </div>

      {/* 3. SUBTAB CONTENT: Curriculum & Units of Study */}
      {activeSubTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Units of Study List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Planned Units ({filteredUnits.length})
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                Core Course Curriculum
              </span>
            </div>

            {/* Search Filter for Units */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                data-testid="student-search-units-input"
                placeholder="Search unit code or competency..."
                value={searchUnitQuery}
                onChange={(e) => setSearchUnitQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredUnits.map((u, idx) => {
                const isSelected = activeUnitIndex === idx;
                return (
                  <div
                    key={u.id || u.unitCode}
                    data-testid={`student-unit-card-${u.unitCode}`}
                    onClick={() => setActiveUnitIndex(idx)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-1 ring-indigo-400/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                        {u.unitCode}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {u.nominalHours || 40}h nominal
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-2">
                      {u.unitTitle}
                    </h4>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{(u.performanceCriteria || []).length} criteria</span>
                      <span>{(u.assessments || []).length} assessments</span>
                      <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Unit Inspection */}
          <div className="lg:col-span-8 space-y-5">
            {currentUnit ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
                {/* Unit Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                        {currentUnit.unitCode}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        Core Competency Unit • {currentUnit.nominalHours || 40} Nominal Study Hours
                      </span>
                      {(currentUnit.enrolledStudents || []).length > 0 && (
                        <span
                          data-testid={`unit-enrolment-status-${currentUnit.unitCode}`}
                          className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"
                        >
                          Enrolled ({(currentUnit.enrolledStudents || []).length} students)
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {currentUnit.unitTitle}
                    </h3>
                  </div>

                  {onAskAgentAboutUnit && (
                    <button
                      type="button"
                      data-testid={`ask-ai-unit-${currentUnit.unitCode}-btn`}
                      onClick={() => onAskAgentAboutUnit(currentUnit.unitCode, currentUnit.unitTitle)}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ask AI Tutor</span>
                    </button>
                  )}
                </div>

                {/* Unit Overview */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Unit Description & Learning Scope
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentUnit.description ||
                      `Accredited syllabus unit for ${currentUnit.unitTitle} (${currentUnit.unitCode}). Aligned with AQF benchmarks and industry requirements.`}
                  </p>
                </div>

                {/* Elements & Performance Criteria Accordion */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Elements of Competency & Performance Criteria ({criteriaByElement.length} Elements)
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {criteriaByElement.map(([elementTitle, criteria], eIdx) => {
                      const isExpanded =
                        expandedElement === elementTitle || (expandedElement === null && eIdx === 0);
                      return (
                        <div
                          key={elementTitle}
                          className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
                        >
                          <div
                            onClick={() =>
                              setExpandedElement(isExpanded ? '__none__' : elementTitle)
                            }
                            className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="p-1 rounded bg-indigo-100 text-indigo-700 shrink-0">
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {elementTitle}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                              {(criteria || []).length} criteria
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="p-3.5 space-y-2 border-t border-slate-100 bg-white animate-in fade-in">
                              {(criteria || []).map((pc) => (
                                <div
                                  key={pc.id || pc.code}
                                  className="p-2.5 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-1"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                                      {pc.code}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800">
                                      {pc.title}
                                    </span>
                                  </div>
                                  {pc.description && (
                                    <p className="text-[11px] text-slate-500 leading-normal pl-7">
                                      {pc.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Weekly Lesson Modules */}
                {currentUnit.lessons && currentUnit.lessons.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Weekly Study Plan & Courseware ({currentUnit.lessons.length} Modules)
                    </h4>

                    <div className="space-y-2.5">
                      {currentUnit.lessons.map((lesson, lIdx) => {
                        const isLessonExpanded =
                          expandedLessonId === lesson.id || (expandedLessonId === null && lIdx === 0);
                        return (
                          <div
                            key={lesson.id}
                            className="border border-slate-200 rounded-2xl overflow-hidden"
                          >
                            <div
                              onClick={() =>
                                setExpandedLessonId(isLessonExpanded ? '__none__' : lesson.id)
                              }
                              className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="p-1 rounded bg-emerald-100 text-emerald-700 shrink-0">
                                  {isLessonExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </span>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 truncate">
                                    Module {lIdx + 1}: {lesson.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {lesson.estimatedMinutes || 60} mins guided study • {(lesson.blocks || []).length} materials
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isLessonExpanded && (
                              <div className="p-3.5 space-y-3 border-t border-slate-100 bg-white animate-in fade-in">
                                {lesson.description && (
                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    {lesson.description}
                                  </p>
                                )}

                                {(lesson.blocks || []).length > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                      Attached Materials & Links
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {lesson.blocks.map((blk) => (
                                        <div
                                          key={blk.id}
                                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            {renderBlockIcon(blk.type)}
                                            <span className="text-xs font-semibold text-slate-800 truncate">
                                              {blk.title}
                                            </span>
                                          </div>
                                          {blk.url && (
                                            <a
                                              href={blk.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                                              title={`Open ${blk.title}`}
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Formative & Summative Assessments */}
                {currentUnit.assessments && currentUnit.assessments.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-600" />
                      Grading & Assessment Framework ({currentUnit.assessments.length} Assessment Tasks)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentUnit.assessments.map((ass) => (
                        <div
                          key={ass.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                ass.type === 'formative'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {ass.type === 'formative' ? 'Formative Activity' : 'Summative Capstone'}
                            </span>
                            {ass.dueDate && (
                              <span className="text-[10px] font-semibold text-slate-500">
                                {ass.dueDate}
                              </span>
                            )}
                          </div>

                          <div>
                            <h5 className="text-xs font-bold text-slate-900">{ass.title}</h5>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                              {ass.description}
                            </p>
                          </div>

                          {ass.criteria && ass.criteria.length > 0 && (
                            <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                Assessment Criteria & Weightings
                              </span>
                              {ass.criteria.map((crit) => (
                                <div
                                  key={crit.id}
                                  className="flex items-center justify-between text-xs text-slate-700"
                                >
                                  <span className="truncate">{crit.name}</span>
                                  <span className="font-mono font-bold text-indigo-600 shrink-0">
                                    {crit.weight}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                No units found. Select another program or verify curriculum data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SUBTAB CONTENT: Competency Elements across Whole Course */}
      {activeSubTab === 'elements' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Full Qualification Competencies & Performance Criteria
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Industry performance benchmarks required to satisfy vocational and higher education standards for {activeCourse.title}.
            </p>
          </div>

          <div className="space-y-6">
            {units.map((unit) => (
              <div key={unit.unitCode} className="space-y-3">
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {unit.unitCode}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{unit.unitTitle}</span>
                  <span className="ml-auto text-[10px] font-semibold text-slate-500">
                    {unit.nominalHours || 40}h nominal
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 sm:pl-4">
                  {(unit.performanceCriteria || []).map((pc) => (
                    <div
                      key={pc.id || pc.code}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                          {pc.code}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">{pc.title}</span>
                      </div>
                      <div className="text-[10px] font-semibold text-indigo-700 pl-6">
                        {pc.element}
                      </div>
                      {pc.description && (
                        <p className="text-[11px] text-slate-500 pl-6 pt-0.5">{pc.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SUBTAB CONTENT: Lessons Modules Roadmap */}
      {activeSubTab === 'lessons' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Course Lesson Modules & Study Roadmap
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Curriculum progression schedule across all units in {activeCourse.title}.
            </p>
          </div>

          <div className="space-y-6">
            {units.map((unit) => (
              <div key={unit.unitCode} className="space-y-3">
                <div className="flex items-center gap-2 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60">
                  <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {unit.unitCode}
                  </span>
                  <span className="text-xs font-bold text-emerald-950">{unit.unitTitle}</span>
                  <span className="ml-auto text-[10px] font-semibold text-emerald-700">
                    {(unit.lessons || []).length} lessons
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 sm:pl-4">
                  {(unit.lessons || []).map((lesson, lIdx) => (
                    <div
                      key={lesson.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Module {lIdx + 1}: {lesson.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {lesson.estimatedMinutes || 60} mins
                        </span>
                      </div>
                      {lesson.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">{lesson.description}</p>
                      )}
                      {(lesson.blocks || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {lesson.blocks.map((b) => (
                            <span
                              key={b.id}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200 flex items-center gap-1"
                            >
                              {renderBlockIcon(b.type)}
                              {b.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SUBTAB CONTENT: Assessment Rubrics with 5-Level AQF Scale */}
      {activeSubTab === 'assessments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              5-Level AQF Grading Rubrics & Competency Benchmark
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Transparent grading standards showing criteria requirements for Competency, High Distinction, Distinction, Credit, and Pass.
            </p>
          </div>

          <div className="space-y-6">
            {units.map((unit) => (
              <div key={unit.unitCode} className="space-y-4">
                <div className="flex items-center gap-2 bg-purple-50/70 p-3 rounded-xl border border-purple-200/60">
                  <span className="font-mono text-xs font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                    {unit.unitCode}
                  </span>
                  <span className="text-xs font-bold text-purple-950">{unit.unitTitle}</span>
                  <span className="ml-auto text-[10px] font-semibold text-purple-700">
                    {(unit.assessments || []).length} assessment tasks
                  </span>
                </div>

                <div className="space-y-4 pl-2 sm:pl-4">
                  {(unit.assessments || []).map((ass) => (
                    <div
                      key={ass.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-4 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                ass.type === 'formative'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {ass.type}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{ass.title}</h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{ass.description}</p>
                        </div>
                        {ass.dueDate && (
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 shrink-0">
                            {ass.dueDate}
                          </span>
                        )}
                      </div>

                      {/* Criteria and Rubric Levels */}
                      <div className="space-y-3">
                        {(ass.criteria || []).map((crit) => (
                          <div
                            key={crit.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">{crit.name}</span>
                              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                Weight: {crit.weight}%
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                                <span className="font-bold text-emerald-800 text-[10px] uppercase block">
                                  ✓ Competency Standard
                                </span>
                                <p className="text-emerald-950 mt-0.5 text-[11px]">
                                  {crit.competentDescriptor || 'Satisfies all benchmark requirements.'}
                                </p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/60">
                                <span className="font-bold text-rose-800 text-[10px] uppercase block">
                                  ✗ Not Yet Competent Standard
                                </span>
                                <p className="text-rose-950 mt-0.5 text-[11px]">
                                  {crit.notYetCompetentDescriptor ||
                                    'Gaps identified in performance criteria.'}
                                </p>
                              </div>
                            </div>

                            {/* 5-Level Rubrics Grid */}
                            {crit.levels && crit.levels.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                  5-Level AQF Performance Descriptors
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                  {crit.levels.map((lvl, lIdx) => (
                                    <div
                                      key={lvl.name || lIdx}
                                      className={`p-2 rounded-lg border text-[11px] space-y-1 ${
                                        lIdx === 0
                                          ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                                          : lIdx === 1
                                          ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                                          : lIdx === 2
                                          ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                                          : lIdx === 3
                                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                                          : 'bg-slate-50 border-slate-200 text-slate-700'
                                      }`}
                                    >
                                      <div className="font-bold text-[10px] flex items-center justify-between">
                                        <span>{lvl.name}</span>
                                        <span className="font-mono text-[9px]">
                                          {lvl.pointsMin}-{lvl.pointsMax}%
                                        </span>
                                      </div>
                                      <p className="text-[10px] leading-tight line-clamp-3">
                                        {lvl.description}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SUBTAB CONTENT: Faculty & Course Leadership */}
      {activeSubTab === 'faculty' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Academic Faculty & Course Leadership
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Governing faculty, course coordinators, and lead academic staff for {activeCourse.title}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                    Program Coordinator
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {activeCourse.facultyInfo?.courseCoordinatorName || 'Dr. Eleanor Vance'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {activeCourse.facultyInfo?.courseCoordinatorTitle ||
                      'Course Coordinator & Senior Academic Fellow'}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-indigo-100 text-xs space-y-1 text-slate-700">
                <div>
                  <span className="font-semibold text-slate-500">Email: </span>
                  <span className="font-mono text-indigo-700">
                    {activeCourse.facultyInfo?.courseCoordinatorEmail || 'curriculum@edupulse.edu.au'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Office: </span>
                  <span>
                    {activeCourse.facultyInfo?.facultyOfficeLocation || 'Curriculum & LMS Hub, Building 4'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Governing Faculty
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {activeCourse.facultyInfo?.facultyName || 'Faculty of Engineering & Computer Science'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Executive Dean: {activeCourse.facultyInfo?.deanName || 'Prof. Arthur Pendelton'}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 text-xs space-y-1 text-slate-700">
                <div>
                  <span className="font-semibold text-slate-500">Accreditations: </span>
                  <span className="text-slate-800">
                    {(activeCourse.facultyInfo?.accreditations || [
                      'ASQA National VET Regulator',
                      'Australian Qualifications Framework (AQF)'
                    ]).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SUBTAB CONTENT: Course Entry & Rules */}
      {activeSubTab === 'admissions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Qualification Admission Rules & Profile
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Admissions criteria, study modes, campus availability, and tuition framework for {activeCourse.title}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Regulatory Framework
              </span>
              <div className="text-sm font-bold text-slate-900">
                {activeCourse.frameworkCode} (AQF Level {activeCourse.aqfLevel})
              </div>
              <p className="text-[11px] text-slate-500">Nationally recognized qualification standard.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Study Mode & Delivery
              </span>
              <div className="text-sm font-bold text-slate-900">
                Blended / Hybrid (On-Campus & Online)
              </div>
              <p className="text-[11px] text-slate-500">Flexible attendance with live virtual LMS seminars.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Total Course Nominal Hours
              </span>
              <div className="text-sm font-bold text-slate-900">
                {totalNominalHours} Hours ({units.length} Units)
              </div>
              <p className="text-[11px] text-slate-500">Self-paced and structured cohort completions.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
