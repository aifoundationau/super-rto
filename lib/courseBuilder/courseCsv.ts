/**
 * Super-RTO Flexible Course CSV Architecture
 * 
 * Supports both:
 * 1. Short Courses (1–4 weeks / modular bootcamps / micro-credentials)
 * 2. Long Semester Courses (14–15 weeks / university & VET semesters)
 * 
 * Enforces multiple Elements of Competency per unit with hierarchical
 * Performance Criteria (1.1, 1.2, 2.1, 2.2), weekly lessons, and 5-level rubrics.
 */

import { parseCsvLine, createDefaultRubricLevels, DEFAULT_GENERIC_RUBRIC_DESCRIPTORS } from './rubrics.ts';
import type { CourseUnit, UnitPerformanceCriterion, LessonBlock } from './units.ts';
import type { CourseAssessment, AssessmentCriterion } from './rubrics.ts';

export interface CourseImportResult {
  code: string;
  title: string;
  durationWeeks: number;
  aqfLevel: number;
  tokenCost: number;
  description: string;
  units: CourseUnit[];
}

export const COURSE_CSV_HEADERS = [
  'RecordType',
  'CourseCode',
  'CourseTitle',
  'DurationWeeks',
  'UnitCode',
  'UnitTitle',
  'NominalHours',
  'ElementCode',
  'ElementTitle',
  'CriterionCode',
  'CriterionTitle',
  'CriterionDescription',
  'LessonWeek',
  'LessonTitle',
  'LessonMinutes',
  'LessonType',
  'ResourceTitle',
  'ResourceUrl',
  'AssessmentType',
  'AssessmentTitle',
  'ExamNumber',
  'DueWeek',
  'RubricCriterion',
  'Weight',
  'Level1_NYC',
  'Level2_Developing',
  'Level3_Competent',
  'Level4_Advanced',
  'Level5_Exemplary'
];

export const COURSE_CSV_HEADER_ROW = COURSE_CSV_HEADERS.join(',');

function esc(val: string | number | undefined | null): string {
  const str = String(val ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates a ready-to-use CSV template for an intensive Short Course (1-4 weeks).
 * Features 2 modular units, multiple Elements per unit, weekly lesson blocks, and 5-level rubrics.
 */
export function generateShortCourseTemplateCsv(): string {
  const lines: string[] = [COURSE_CSV_HEADER_ROW];

  // Course Header Row
  lines.push([
    'COURSE',
    esc('CERT-AI-BOOTCAMP'),
    esc('Applied AI and LLM Engineering Bootcamp'),
    '4',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ].join(','));

  // UNIT 1
  lines.push([
    'UNIT',
    esc('CERT-AI-BOOTCAMP'),
    esc('Applied AI and LLM Engineering Bootcamp'),
    '4',
    esc('AIE101'),
    esc('Foundations of LLM Prompt Engineering & Context Design'),
    '20',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ].join(','));

  // Unit 1 - Element 1: Prompt Design & Structuring
  lines.push([
    'ELEMENT_CRITERION',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE101'), '', '',
    esc('Element 1: Structured Prompt Design & Schema Formatting'),
    esc('Structured Prompt Design & Schema Formatting'),
    esc('1.1'),
    esc('Architect deterministic system instructions and negative constraints'),
    esc('Formulate system prompts with explicit operational parameters, guardrails, and role personas.')
  ].concat(Array(17).fill('""')).join(','));

  lines.push([
    'ELEMENT_CRITERION',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE101'), '', '',
    esc('Element 1: Structured Prompt Design & Schema Formatting'),
    esc('Structured Prompt Design & Schema Formatting'),
    esc('1.2'),
    esc('Implement few-shot exemplars and JSON schema validation'),
    esc('Incorporate representative input-output pairs to guarantee valid structured JSON responses.')
  ].concat(Array(17).fill('""')).join(','));

  // Unit 1 - Element 2: Context Grounding & Multi-Modal Ingestion
  lines.push([
    'ELEMENT_CRITERION',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE101'), '', '',
    esc('Element 2: Multi-Modal Ingestion & Hallucination Mitigation'),
    esc('Multi-Modal Ingestion & Hallucination Mitigation'),
    esc('2.1'),
    esc('Ingest multi-modal inputs including PDF documents and images'),
    esc('Pre-process and inject image and document attachments into the context window.')
  ].concat(Array(17).fill('""')).join(','));

  lines.push([
    'ELEMENT_CRITERION',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE101'), '', '',
    esc('Element 2: Multi-Modal Ingestion & Hallucination Mitigation'),
    esc('Multi-Modal Ingestion & Hallucination Mitigation'),
    esc('2.2'),
    esc('Benchmark grounding fidelity and suppress hallucination rates'),
    esc('Verify generated responses against factual source chunks with citation attribution.')
  ].concat(Array(17).fill('""')).join(','));

  // Unit 1 - Lessons (Weeks 1 & 2)
  lines.push([
    'LESSON',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE101'), '', '',
    '', '', '', '', '',
    '1',
    esc('Week 1: System Prompts & Few-Shot Engineering'),
    '45',
    esc('presentation'),
    esc('System Prompts Slide Deck'),
    esc('https://docs.google.com/presentation/d/demo-prompt-engineering')
  ].concat(Array(11).fill('""')).join(','));

  lines.push([
    'LESSON',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE101'), '', '',
    '', '', '', '', '',
    '2',
    esc('Week 2: Multi-Modal Context Ingestion Lab'),
    '45',
    esc('notebook'),
    esc('Context Engineering Google Colab'),
    esc('https://colab.research.google.com/drive/demo-context-injection')
  ].concat(Array(11).fill('""')).join(','));

  // Unit 1 - Assessments
  lines.push([
    'ASSESSMENT',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE101'), '', '',
    '', '', '', '', '',
    '', '', '', '', '', '',
    esc('formative'),
    esc('Formative Prompt Engineering Drill #1'),
    '1',
    '1',
    esc('Prompt Structuring & Few-Shot Precision'),
    '50',
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])
  ].join(','));

  lines.push([
    'ASSESSMENT',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE101'), '', '',
    '', '', '', '', '',
    '', '', '', '', '', '',
    esc('summative'),
    esc('Summative Grounded Application Portfolio #1'),
    '2',
    '2',
    esc('Multi-Modal Grounding & Reliability Evidence'),
    '50',
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])
  ].join(','));

  // UNIT 2
  lines.push([
    'UNIT',
    esc('CERT-AI-BOOTCAMP'),
    esc('Applied AI and LLM Engineering Bootcamp'),
    '4',
    esc('AIE102'),
    esc('Autonomous Agent Workflows & RAG Pipeline Deployment'),
    '20',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ].join(','));

  // Unit 2 - Element 1: Vector Search
  lines.push([
    'ELEMENT_CRITERION',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE102'), '', '',
    esc('Element 1: Vector Embeddings & Hybrid Retrieval'),
    esc('Vector Embeddings & Hybrid Retrieval'),
    esc('1.1'),
    esc('Generate normalized embedding vectors for dense semantic search'),
    esc('Convert corpus documents into dense vector spaces using high-performance embedding models.')
  ].concat(Array(17).fill('""')).join(','));

  lines.push([
    'ELEMENT_CRITERION',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE102'), '', '',
    esc('Element 1: Vector Embeddings & Hybrid Retrieval'),
    esc('Vector Embeddings & Hybrid Retrieval'),
    esc('1.2'),
    esc('Implement cosine similarity retrieval and top-k reranking'),
    esc('Execute vector similarity queries with score filtering and semantic deduplication.')
  ].concat(Array(17).fill('""')).join(','));

  // Unit 2 - Element 2: Autonomous Tool Calling
  lines.push([
    'ELEMENT_CRITERION',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE102'), '', '',
    esc('Element 2: Autonomous Tool Calling & Safe Execution'),
    esc('Autonomous Tool Calling & Safe Execution'),
    esc('2.1'),
    esc('Define typed tool schemas and OpenAPI function interfaces'),
    esc('Establish explicit input contracts and error boundaries for external tool execution.')
  ].concat(Array(17).fill('""')).join(','));

  lines.push([
    'ELEMENT_CRITERION',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE102'), '', '',
    esc('Element 2: Autonomous Tool Calling & Safe Execution'),
    esc('Autonomous Tool Calling & Safe Execution'),
    esc('2.2'),
    esc('Enforce idempotent tool state transitions and backoff retries'),
    esc('Verify that external API side effects are safe, replay-protected, and rate-limited.')
  ].concat(Array(17).fill('""')).join(','));

  // Unit 2 - Lessons (Weeks 3 & 4)
  lines.push([
    'LESSON',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE102'), '', '',
    '', '', '', '', '',
    '3',
    esc('Week 3: Vector Embeddings & RAG Ingestion'),
    '45',
    esc('video'),
    esc('Vector Search Architecture Lecture'),
    esc('https://www.youtube.com/watch?v=demo-vector-rag')
  ].concat(Array(11).fill('""')).join(','));

  lines.push([
    'LESSON',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE102'), '', '',
    '', '', '', '', '',
    '4',
    esc('Week 4: Autonomous Tool Calling & Production Agents'),
    '45',
    esc('notebook'),
    esc('Agent Execution Colab Notebook'),
    esc('https://colab.research.google.com/drive/demo-agent-tools')
  ].concat(Array(11).fill('""')).join(','));

  // Unit 2 - Assessments
  lines.push([
    'ASSESSMENT',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE102'), '', '',
    '', '', '', '', '',
    '', '', '', '', '', '',
    esc('formative'),
    esc('Formative Agent Tool Calling Simulation #3'),
    '3',
    '3',
    esc('Tool Schema Execution & State Verification'),
    '50',
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])
  ].join(','));

  lines.push([
    'ASSESSMENT',
    esc('CERT-AI-BOOTCAMP'), '', '4',
    esc('AIE102'), '', '',
    '', '', '', '', '',
    '', '', '', '', '', '',
    esc('summative'),
    esc('Summative Capstone Agent & RAG System #4'),
    '4',
    '4',
    esc('End-to-End System Reliability & Benchmark Quality'),
    '50',
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])
  ].join(','));

  return lines.join('\n') + '\n';
}

/**
 * Generates a comprehensive CSV template for a Long Semester Course (14-15 weeks).
 * Features multiple units, 3-4 Elements per unit, 15 weekly syllabus lessons,
 * mid-semester examination (Week 7/8), and final capstone examination (Week 15).
 */
export function generateSemesterCourseTemplateCsv(): string {
  const lines: string[] = [COURSE_CSV_HEADER_ROW];

  // Course Header Row
  lines.push([
    'COURSE',
    esc('CYB401-SEM'),
    esc('Bachelor of Cyber Security & Enterprise Systems Defense'),
    '15',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ].join(','));

  // UNIT 1: Threat Surface Modeling & Perimeter Defense (Weeks 1 to 5)
  lines.push([
    'UNIT',
    esc('CYB401-SEM'),
    esc('Bachelor of Cyber Security & Enterprise Systems Defense'),
    '15',
    esc('CYB401'),
    esc('Enterprise Threat Modeling, Perimeter Defense & Cryptography'),
    '50',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ].join(','));

  // Unit 1 - Element 1: Threat Surface Analysis
  lines.push([
    'ELEMENT_CRITERION',
    esc('CYB401-SEM'), '', '15',
    esc('CYB401'), '', '',
    esc('Element 1: Threat Surface Modeling & Zero Trust Architecture'),
    esc('Threat Surface Modeling & Zero Trust Architecture'),
    esc('1.1'),
    esc('Decompose organizational networks into zero trust micro-segments'),
    esc('Map enterprise assets, network topologies, and egress boundaries against NIST CSF.')
  ].concat(Array(17).fill('""')).join(','));

  lines.push([
    'ELEMENT_CRITERION',
    esc('CYB401-SEM'), '', '15',
    esc('CYB401'), '', '',
    esc('Element 1: Threat Surface Modeling & Zero Trust Architecture'),
    esc('Threat Surface Modeling & Zero Trust Architecture'),
    esc('1.2'),
    esc('Identify threat vectors and quantify business impact tolerances'),
    esc('Apply STRIDE threat modeling methodologies across cloud and on-premise entry points.')
  ].concat(Array(17).fill('""')).join(','));

  // Unit 1 - Element 2: Cryptographic Protocols
  lines.push([
    'ELEMENT_CRITERION',
    esc('CYB401-SEM'), '', '15',
    esc('CYB401'), '', '',
    esc('Element 2: Cryptographic Protocols & Key Management Systems'),
    esc('Cryptographic Protocols & Key Management Systems'),
    esc('2.1'),
    esc('Implement TLS 1.3 encryption and cipher suite hardening'),
    esc('Configure cryptographic algorithms, certificates, and strict transport security.')
  ].concat(Array(17).fill('""')).join(','));

  lines.push([
    'ELEMENT_CRITERION',
    esc('CYB401-SEM'), '', '15',
    esc('CYB401'), '', '',
    esc('Element 2: Cryptographic Protocols & Key Management Systems'),
    esc('Cryptographic Protocols & Key Management Systems'),
    esc('2.2'),
    esc('Manage automated secret rotation and hardware security modules (HSM)'),
    esc('Establish secure envelope encryption and key access policies complying with ISO 27001.')
  ].concat(Array(17).fill('""')).join(','));

  // Unit 1 - Element 3: Regulatory Compliance & Governance
  lines.push([
    'ELEMENT_CRITERION',
    esc('CYB401-SEM'), '', '15',
    esc('CYB401'), '', '',
    esc('Element 3: Statutory WHS, ASQA & TEQSA Security Governance'),
    esc('Statutory WHS, ASQA & TEQSA Security Governance'),
    esc('3.1'),
    esc('Audit institutional operations against the Australian Privacy Act & Notifiable Data Breaches'),
    esc('Evaluate privacy safeguards, personally identifiable information (PII) controls, and reporting timelines.')
  ].concat(Array(17).fill('""')).join(','));

  // Lessons for Weeks 1 through 5
  for (let w = 1; w <= 5; w++) {
    lines.push([
      'LESSON',
      esc('CYB401-SEM'), '', '15',
      esc('CYB401'), '', '',
      '', '', '', '', '',
      `${w}`,
      esc(`Week ${w}: Enterprise Security Lecture & Hands-On Lab`),
      '90',
      esc(w % 2 === 1 ? 'presentation' : 'notebook'),
      esc(`Week ${w} Coursework Materials`),
      esc(`https://drive.google.com/drive/folders/demo-week-${w}`)
    ].concat(Array(11).fill('""')).join(','));
  }

  // Unit 1 Assessments: Formative Quiz (Week 3) + Mid-Semester Exam (Week 7)
  lines.push([
    'ASSESSMENT',
    esc('CYB401-SEM'), '', '15',
    esc('CYB401'), '', '',
    '', '', '', '', '',
    '', '', '', '', '', '',
    esc('formative'),
    esc('Formative Cryptography & Perimeter Defense Checkpoint #1'),
    '1',
    '3',
    esc('Perimeter Hardening & Cipher Implementation'),
    '30',
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])
  ].join(','));

  // UNIT 2: Cloud Infrastructure & Incident Response (Weeks 6 to 15)
  lines.push([
    'UNIT',
    esc('CYB401-SEM'),
    esc('Bachelor of Cyber Security & Enterprise Systems Defense'),
    '15',
    esc('CYB402'),
    esc('Cloud Infrastructure Security, Digital Forensics & Incident Response'),
    '70',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ].join(','));

  // Unit 2 - Element 1: Cloud Architecture Hardening
  lines.push([
    'ELEMENT_CRITERION',
    esc('CYB401-SEM'), '', '15',
    esc('CYB402'), '', '',
    esc('Element 1: Cloud Architecture Hardening & IAM Governance'),
    esc('Cloud Architecture Hardening & IAM Governance'),
    esc('1.1'),
    esc('Configure least-privilege IAM policies and multi-factor authentication enforcement'),
    esc('Enforce strict role-based access control (RBAC) and attribute-based security policies.')
  ].concat(Array(17).fill('""')).join(','));

  lines.push([
    'ELEMENT_CRITERION',
    esc('CYB401-SEM'), '', '15',
    esc('CYB402'), '', '',
    esc('Element 1: Cloud Architecture Hardening & IAM Governance'),
    esc('Cloud Architecture Hardening & IAM Governance'),
    esc('1.2'),
    esc('Isolate serverless containers and enforce runtime firewall restrictions'),
    esc('Configure VPC service controls, private endpoints, and container vulnerability scanning.')
  ].concat(Array(17).fill('""')).join(','));

  // Unit 2 - Element 2: Digital Forensics & Incident Handling
  lines.push([
    'ELEMENT_CRITERION',
    esc('CYB401-SEM'), '', '15',
    esc('CYB402'), '', '',
    esc('Element 2: Digital Forensics, Memory Analysis & Evidence Preservation'),
    esc('Digital Forensics, Memory Analysis & Evidence Preservation'),
    esc('2.1'),
    esc('Preserve volatile memory dumps and disk images with cryptographic hashing'),
    esc('Maintain strict chain-of-custody documentation and write-blockers during digital forensic triage.')
  ].concat(Array(17).fill('""')).join(','));

  lines.push([
    'ELEMENT_CRITERION',
    esc('CYB401-SEM'), '', '15',
    esc('CYB402'), '', '',
    esc('Element 2: Digital Forensics, Memory Analysis & Evidence Preservation'),
    esc('Digital Forensics, Memory Analysis & Evidence Preservation'),
    esc('2.2'),
    esc('Reconstruct lateral movement attacks using SIEM event correlation'),
    esc('Analyze authentication logs, DNS lookups, and PowerShell execution traces to isolate breach root causes.')
  ].concat(Array(17).fill('""')).join(','));

  // Unit 2 - Element 3: Post-Breach Remediation & Executive Audit
  lines.push([
    'ELEMENT_CRITERION',
    esc('CYB401-SEM'), '', '15',
    esc('CYB402'), '', '',
    esc('Element 3: Post-Breach Remediation & Executive Audit Reporting'),
    esc('Post-Breach Remediation & Executive Audit Reporting'),
    esc('3.1'),
    esc('Synthesize forensic findings into executive board risk briefings and statutory breach notifications'),
    esc('Draft transparent incident reports identifying remediation roadmaps and regulatory compliance evidence.')
  ].concat(Array(17).fill('""')).join(','));

  // Lessons for Weeks 6 through 15 (Completing the full 15-week semester)
  for (let w = 6; w <= 15; w++) {
    const isExamWeek = w === 7 || w === 15;
    const title = isExamWeek
      ? w === 7
        ? 'Week 7: Mid-Semester Practical Examination & Review'
        : 'Week 15: Final Comprehensive Examination & Capstone Defense'
      : `Week ${w}: Advanced Systems Defense, Forensics & Lab Exercises`;

    lines.push([
      'LESSON',
      esc('CYB401-SEM'), '', '15',
      esc('CYB402'), '', '',
      '', '', '', '', '',
      `${w}`,
      esc(title),
      '90',
      esc(isExamWeek ? 'quiz' : 'video'),
      esc(`Week ${w} Academic Lecture & Guide`),
      esc(`https://drive.google.com/drive/folders/demo-semester-week-${w}`)
    ].concat(Array(11).fill('""')).join(','));
  }

  // Mid-Semester Exam (Week 7)
  lines.push([
    'ASSESSMENT',
    esc('CYB401-SEM'), '', '15',
    esc('CYB402'), '', '',
    '', '', '', '', '',
    '', '', '', '', '', '',
    esc('summative'),
    esc('Summative Mid-Semester Practical Examination #2'),
    '2',
    '7',
    esc('Perimeter Penetration Defense & IAM Configuration'),
    '40',
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])
  ].join(','));

  // Final Summative Capstone Examination (Week 15)
  lines.push([
    'ASSESSMENT',
    esc('CYB401-SEM'), '', '15',
    esc('CYB402'), '', '',
    '', '', '', '', '',
    '', '', '', '', '', '',
    esc('summative'),
    esc('Final Comprehensive Summative Examination & Capstone Defense #3'),
    '3',
    '15',
    esc('End-to-End Enterprise Defense & Forensic Investigation'),
    '60',
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[0]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[1]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[2]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[3]),
    esc(DEFAULT_GENERIC_RUBRIC_DESCRIPTORS[4])
  ].join(','));

  return lines.join('\n') + '\n';
}

/**
 * Exports an existing Course object (from Course Builder) to a valid CSV format.
 */
export function exportCourseToCsv(course: any): string {
  const lines: string[] = [COURSE_CSV_HEADER_ROW];

  const durationWeeks = course.durationWeeks || (course.units && course.units.length > 2 ? 15 : 4);

  // 1. Course Header
  lines.push([
    'COURSE',
    esc(course.code || 'COURSE101'),
    esc(course.title || 'Course Title'),
    String(durationWeeks),
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ].join(','));

  // 2. Units & Children
  const units: CourseUnit[] = course.units || [];
  units.forEach((unit) => {
    // Unit row
    lines.push([
      'UNIT',
      esc(course.code || ''),
      esc(course.title || ''),
      String(durationWeeks),
      esc(unit.unitCode),
      esc(unit.unitTitle),
      String(unit.nominalHours || 40),
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ].join(','));

    // Elements & Performance Criteria
    (unit.performanceCriteria || []).forEach((pc) => {
      lines.push([
        'ELEMENT_CRITERION',
        esc(course.code || ''), '', String(durationWeeks),
        esc(unit.unitCode), '', '',
        esc(pc.element || 'Element 1'),
        esc(pc.element || 'Element 1'),
        esc(pc.code || '1.1'),
        esc(pc.title || 'Performance Criterion'),
        esc(pc.description || '')
      ].concat(Array(17).fill('""')).join(','));
    });

    // Lessons
    (unit.lessons || []).forEach((lesson, lIdx) => {
      const block = (lesson.blocks && lesson.blocks[0]) || null;
      lines.push([
        'LESSON',
        esc(course.code || ''), '', String(durationWeeks),
        esc(unit.unitCode), '', '',
        '', '', '', '', '',
        String(lIdx + 1),
        esc(lesson.title),
        String(lesson.estimatedMinutes || 45),
        esc(block?.type || 'presentation'),
        esc(block?.title || 'Lesson Resource'),
        esc(block?.url || (block?.links && block.links[0]?.url) || '')
      ].concat(Array(11).fill('""')).join(','));
    });

    // Assessments & 5-Level Rubrics
    (unit.assessments || []).forEach((ass) => {
      const criteriaList = (ass.criteria && ass.criteria.length > 0)
        ? ass.criteria
        : [
            {
              id: `crit-${ass.id}-1`,
              name: `${ass.title} Performance Benchmark`,
              weight: 100,
              competentDescriptor: 'Meets competency benchmark against standard performance criteria.',
              notYetCompetentDescriptor: 'Fails to satisfy essential competency requirements.',
              levels: createDefaultRubricLevels(`${ass.title} Performance Benchmark`)
            }
          ];

      criteriaList.forEach((c) => {
        const lvls = (c.levels && c.levels.length >= 5) ? c.levels : createDefaultRubricLevels(c.name);
        lines.push([
          'ASSESSMENT',
          esc(course.code || ''), '', String(durationWeeks),
          esc(unit.unitCode), '', '',
          '', '', '', '', '',
          '', '', '', '', '', '',
          esc(ass.type || 'summative'),
          esc(ass.title),
          String(ass.examNumber || 1),
          esc(ass.dueDate || '1'),
          esc(c.name || 'Assessment Criterion'),
          String(c.weight || 50),
          esc(lvls[0]?.descriptor || ''),
          esc(lvls[1]?.descriptor || ''),
          esc(lvls[2]?.descriptor || ''),
          esc(lvls[3]?.descriptor || ''),
          esc(lvls[4]?.descriptor || '')
        ].join(','));
      });
    });
  });

  return lines.join('\n') + '\n';
}

/**
 * Parses a flexible course CSV into structured course metadata, units, multiple elements,
 * lessons, and rubrics. Robust against BOM, quoted strings, and varying column orders.
 */
export function parseCourseCsv(csvText: string): CourseImportResult {
  if (!csvText || !csvText.trim()) {
    return {
      code: 'COURSE101',
      title: 'Imported Course',
      durationWeeks: 4,
      aqfLevel: 4,
      tokenCost: 0,
      description: 'Imported course from CSV.',
      units: []
    };
  }

  // Remove potential UTF-8 BOM
  const cleaned = csvText.replace(/^\uFEFF/, '').trim();
  const rawLines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) {
    return {
      code: 'COURSE101',
      title: 'Imported Course',
      durationWeeks: 4,
      aqfLevel: 4,
      tokenCost: 0,
      description: 'Imported course from CSV.',
      units: []
    };
  }

  const headerLine = parseCsvLine(rawLines[0]).map((h) => h.toLowerCase().replace(/[\s_-]/g, ''));

  const findIdx = (terms: string[], fallback: number): number => {
    // 1. Exact match first
    for (let i = 0; i < headerLine.length; i++) {
      if (terms.some((t) => headerLine[i] === t)) return i;
    }
    // 2. Substring match
    for (let i = 0; i < headerLine.length; i++) {
      if (terms.some((t) => headerLine[i].includes(t))) return i;
    }
    return fallback;
  };

  const recTypeIdx = findIdx(['recordtype', 'rectype', 'type', 'section'], 0);
  const courseCodeIdx = findIdx(['coursecode', 'programcode'], 1);
  const courseTitleIdx = findIdx(['coursetitle', 'programtitle', 'coursename'], 2);
  const durationIdx = findIdx(['durationweeks', 'duration', 'weeks'], 3);
  const unitCodeIdx = findIdx(['unitcode', 'unit_code', 'unitno', 'unitid', 'code'], 4);
  const unitTitleIdx = findIdx(['unittitle', 'title'], 5);
  const nomHoursIdx = findIdx(['nominalhours', 'hours'], 6);
  const elementCodeIdx = findIdx(['elementcode', 'element'], 7);
  const elementTitleIdx = findIdx(['elementtitle'], 8);
  const critCodeIdx = findIdx(['criterioncode', 'pccode', 'criterionno'], 9);
  const critTitleIdx = findIdx(['criteriontitle', 'pctitle'], 10);
  const critDescIdx = findIdx(['criteriondesc', 'pcdesc', 'description'], 11);
  const lessonWeekIdx = findIdx(['lessonweek', 'week'], 12);
  const lessonTitleIdx = findIdx(['lessontitle'], 13);
  const lessonMinIdx = findIdx(['lessonminutes', 'minutes'], 14);
  const lessonTypeIdx = findIdx(['lessontype', 'blocktype'], 15);
  const resTitleIdx = findIdx(['resourcetitle'], 16);
  const resUrlIdx = findIdx(['resourceurl', 'lessonurl', 'url'], 17);
  const assTypeIdx = findIdx(['assessmenttype'], 18);
  const assTitleIdx = findIdx(['assessmenttitle'], 19);
  const examNumIdx = findIdx(['examnumber', 'examno'], 20);
  const dueWeekIdx = findIdx(['dueweek', 'duedate'], 21);
  const rubricCritIdx = findIdx(['rubriccriterion', 'rubricname'], 22);
  const weightIdx = findIdx(['weight'], 23);
  const l1Idx = findIdx(['level1', 'nyc'], 24);
  const l2Idx = findIdx(['level2', 'developing'], 25);
  const l3Idx = findIdx(['level3', 'competent'], 26);
  const l4Idx = findIdx(['level4', 'advanced'], 27);
  const l5Idx = findIdx(['level5', 'exemplary'], 28);

  let courseCode = 'COURSE101';
  let courseTitle = 'Imported Course';
  let durationWeeks = 4;
  const unitsMap = new Map<string, CourseUnit>();

  const getOrCreateUnit = (code: string, title?: string, hours?: number): CourseUnit => {
    const safeCode = (code || 'UNIT101').trim();
    if (!unitsMap.has(safeCode)) {
      unitsMap.set(safeCode, {
        id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        unitCode: safeCode,
        unitTitle: (title || safeCode).trim(),
        nominalHours: hours || 40,
        description: `Unit of Competency ${safeCode}: ${(title || '').trim()}`,
        performanceCriteria: [],
        lessons: [],
        assessments: []
      });
    } else {
      const u = unitsMap.get(safeCode)!;
      if (title && (!u.unitTitle || u.unitTitle === safeCode)) {
        u.unitTitle = title.trim();
      }
      if (hours && hours > 0) {
        u.nominalHours = hours;
      }
    }
    return unitsMap.get(safeCode)!;
  };

  for (let r = 1; r < rawLines.length; r++) {
    const cols = parseCsvLine(rawLines[r]);
    if (cols.length === 0 || !cols.some((c) => c.trim().length > 0)) continue;

    const rawRecType = (cols[recTypeIdx] || '').toUpperCase().trim();
    const cCode = cols[courseCodeIdx]?.trim();
    const cTitle = cols[courseTitleIdx]?.trim();
    const dWeeks = parseInt(cols[durationIdx]?.replace(/[^\d]/g, '') || '', 10);

    if (cCode && (!courseCode || courseCode === 'COURSE101')) courseCode = cCode;
    if (cTitle && (!courseTitle || courseTitle === 'Imported Course')) courseTitle = cTitle;
    if (!isNaN(dWeeks) && dWeeks > 0) durationWeeks = dWeeks;

    if (rawRecType === 'COURSE') {
      if (cCode) courseCode = cCode;
      if (cTitle) courseTitle = cTitle;
      if (!isNaN(dWeeks) && dWeeks > 0) durationWeeks = dWeeks;
      continue;
    }

    const uCode = cols[unitCodeIdx]?.trim();
    const uTitle = cols[unitTitleIdx]?.trim();
    const uHours = parseInt(cols[nomHoursIdx]?.replace(/[^\d]/g, '') || '', 10) || undefined;

    if (rawRecType === 'UNIT') {
      if (uCode) {
        getOrCreateUnit(uCode, uTitle, uHours);
      }
      continue;
    }

    // Must belong to a unit
    const targetUnit = getOrCreateUnit(uCode || 'UNIT101', uTitle, uHours);

    // 1. Check for ELEMENT_CRITERION or performance criteria columns
    const rawElementCode = cols[elementCodeIdx]?.trim();
    const rawElementTitle = cols[elementTitleIdx]?.trim();
    const element =
      rawElementCode && rawElementCode.toLowerCase().startsWith('element')
        ? rawElementCode
        : rawElementTitle || rawElementCode || 'Element 1: Core Performance Requirements';
    const critCode = cols[critCodeIdx]?.trim();
    const critTitle = cols[critTitleIdx]?.trim();
    const critDesc = cols[critDescIdx]?.trim();

    if (rawRecType === 'ELEMENT_CRITERION' || (element && (critCode || critTitle))) {
      const existing = targetUnit.performanceCriteria || [];
      const safeElement = element || 'Element 1: Core Performance Requirements';
      const safeCode = critCode || `${existing.length + 1}`;
      const safeTitle = critTitle || `Performance Criterion ${safeCode}`;
      const safeDesc = critDesc || 'Satisfies required industry and regulatory competency benchmarks.';

      existing.push({
        id: `pc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        element: safeElement,
        code: safeCode,
        title: safeTitle,
        description: safeDesc
      });
      targetUnit.performanceCriteria = existing;
    }

    // 2. Check for LESSON
    const lessonTitle = cols[lessonTitleIdx]?.trim();
    const lessonWeek = cols[lessonWeekIdx]?.trim();
    const lessonType = (cols[lessonTypeIdx]?.trim().toLowerCase() as LessonBlock['type']) || 'presentation';
    const resTitle = cols[resTitleIdx]?.trim() || `${lessonTitle || 'Lesson'} Resource`;
    const resUrl = cols[resUrlIdx]?.trim();

    if (rawRecType === 'LESSON' || lessonTitle) {
      const minutes = parseInt(cols[lessonMinIdx]?.replace(/[^\d]/g, '') || '', 10) || 45;
      const weekLabel = lessonWeek ? `Week ${lessonWeek}: ` : '';

      targetUnit.lessons.push({
        id: `les-${Date.now()}-${targetUnit.lessons.length + 1}`,
        title: lessonTitle ? (lessonTitle.startsWith('Week ') ? lessonTitle : `${weekLabel}${lessonTitle}`) : `Modular Lesson ${targetUnit.lessons.length + 1}`,
        estimatedMinutes: minutes,
        blocks: [
          {
            id: `blk-${Date.now()}-1`,
            type: lessonType,
            title: resTitle,
            url: resUrl || '',
            links: resUrl ? [{ id: `lnk-${Date.now()}`, title: resTitle, url: resUrl }] : []
          }
        ]
      });
    }

    // 3. Check for ASSESSMENT & 5-Level Rubrics
    const assTitle = cols[assTitleIdx]?.trim();
    const assTypeRaw = cols[assTypeIdx]?.trim().toLowerCase();
    const rubricCritName = cols[rubricCritIdx]?.trim();

    if (rawRecType === 'ASSESSMENT' || assTitle || rubricCritName) {
      const isFormative = assTypeRaw?.includes('form') || assTitle?.toLowerCase().includes('formative');
      const type: 'formative' | 'summative' = isFormative ? 'formative' : 'summative';
      const title = assTitle || `${type === 'formative' ? 'Formative' : 'Summative'} Assessment`;
      const critName = rubricCritName || `${title} Evaluation Criterion`;
      const weight = parseInt(cols[weightIdx]?.replace(/[^\d]/g, '') || '', 10) || 50;
      const examNumber = parseInt(cols[examNumIdx]?.replace(/[^\d]/g, '') || '', 10) || targetUnit.assessments.length + 1;
      const dueWeek = cols[dueWeekIdx]?.trim();

      const defaultLevels = createDefaultRubricLevels(critName);
      const lvl1 = cols[l1Idx]?.trim() || defaultLevels[0].descriptor;
      const lvl2 = cols[l2Idx]?.trim() || defaultLevels[1].descriptor;
      const lvl3 = cols[l3Idx]?.trim() || defaultLevels[2].descriptor;
      const lvl4 = cols[l4Idx]?.trim() || defaultLevels[3].descriptor;
      const lvl5 = cols[l5Idx]?.trim() || defaultLevels[4].descriptor;

      const criterion: AssessmentCriterion = {
        id: `crit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: critName,
        weight,
        competentDescriptor: lvl3,
        notYetCompetentDescriptor: lvl1,
        levels: [
          { level: 1, label: 'Level 1 - Not Yet Competent (NYC)', descriptor: lvl1 },
          { level: 2, label: 'Level 2 - Developing / Threshold', descriptor: lvl2 },
          { level: 3, label: 'Level 3 - Competent (C) / Proficient', descriptor: lvl3 },
          { level: 4, label: 'Level 4 - Advanced / Accomplished', descriptor: lvl4 },
          { level: 5, label: 'Level 5 - Exemplary / Mastered', descriptor: lvl5 }
        ]
      };

      const existingAss = targetUnit.assessments.find((a) => a.title.toLowerCase() === title.toLowerCase());
      if (existingAss) {
        existingAss.criteria.push(criterion);
      } else {
        targetUnit.assessments.push({
          id: `ass-${type}-${Date.now()}-${targetUnit.assessments.length + 1}`,
          type,
          title,
          description: `Assessment evaluating ${critName} against performance standards.`,
          examNumber,
          dueDate: dueWeek ? `Week ${dueWeek}` : undefined,
          criteria: [criterion]
        });
      }
    }
  }

  const finalUnits = Array.from(unitsMap.values());

  return {
    code: courseCode,
    title: courseTitle,
    durationWeeks,
    aqfLevel: 4,
    tokenCost: 0,
    description: `Structured ${durationWeeks}-week curriculum imported with ${finalUnits.length} Units of Competency.`,
    units: finalUnits
  };
}
