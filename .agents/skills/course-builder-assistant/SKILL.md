---
name: course-builder-assistant
description: "Guides authoring, structuring, and validating compliant courses for vocational (ASQA/VET), higher education (TEQSA), and modular credentials. Generates and validates flexible curriculum schemas for short courses (1-4 weeks/modular bootcamps) and long semester courses (14-15 weeks), ensuring multiple Elements of Competency per unit with hierarchical Performance Criteria, lesson plans, and 5-level rubrics."
---

# Course Builder AI Agent Skill: Curriculum & Assessment Architecture

This skill equips the Antigravity AI Agent to author, architect, validate, and optimize course curricula within the Super-RTO LMS Course Builder. It guarantees pedagogical rigor, regulatory alignment with ASQA and TEQSA frameworks, seamless support for **both short courses (1–4 weeks) and long semester courses (14–15 weeks)**, and mandatory **multiple Elements of Competency** per unit with hierarchical Performance Criteria.

---

## 1. Core Curriculum Architecture & Regulatory Frameworks

When assisting course authors, the agent must align with the target regulatory and qualification standards:

| Framework | Governing Body | Core Benchmarks | Typical Structures |
| :--- | :--- | :--- | :--- |
| **VET / RTO** | ASQA (Australian Skills Quality Authority) | Units of Competency, Elements of Competency, Performance Criteria (PC), Assessment Conditions, 5-Level Rubrics (NYC to Exemplary) | Cert I through Advanced Diploma (AQF 1–6) |
| **Higher Ed** | TEQSA (Tertiary Education Quality Standards Agency) | Subject Learning Outcomes (SLOs), Course Learning Outcomes (CLOs), Bloom's Revised Taxonomy, Academic Rigor, Moderation Protocols | Bachelor, Graduate Cert, Master, Doctorate (AQF 7–10) |
| **Modular / Micro-Credential** | Industry / Professional Bodies | Rapid workplace competency, applied skill checkpoints, modular badges, portfolio evidence | 1–4 Week Bootcamps, Executive Workshops, Skill Sprints |

---

## 2. Flexible Course Duration Strategies

The AI Agent must dynamically adapt curriculum density, pacing, and assessment schedules based on whether the course is a **Short Course** or a **Long Semester Course**:

### A. Short Courses (1–4 Weeks / Intensive Bootcamps / Micro-Credentials)
1. **Nominal Duration**: 1 to 4 weeks (15 to 40 nominal learning hours per unit).
2. **Curriculum Topology**:
   - 1 to 3 targeted Units of Competency.
   - **Multiple Elements per Unit**: Minimum of 2–3 distinct Elements of Competency focusing on immediate practical execution (e.g. *Element 1: Setup & Tooling*, *Element 2: Core Implementation*, *Element 3: Production Deployment & Verification*).
   - **Performance Criteria**: 2 to 3 criteria per Element (e.g. 1.1, 1.2, 2.1, 2.2, 3.1, 3.2).
3. **Pacing & Lesson Blocks**:
   - Rapid modular delivery (2–4 high-impact lesson blocks per week: presentation deck, interactive Google Colab / Notebook, video walkthrough, and practical task).
4. **Assessment Strategy**:
   - Weekly continuous formative diagnostic checks (10–15 min quizzes or lab tasks).
   - 1 Summative Workplace Capstone Portfolio or Practical Demonstration due in the final week (Week 4), evaluated with a 5-level scoring rubric.

### B. Long Semester Courses (14–15 Weeks / University & VET Diplomas)
1. **Nominal Duration**: 14 to 15 calendar weeks (typically 14 teaching weeks + 1 final examination/review week; 100 to 150+ nominal learning hours per unit).
2. **Curriculum Topology**:
   - 3 to 6 comprehensive Units of Competency or academic subjects.
   - **Multiple Elements per Unit**: Minimum of 3–5 comprehensive Elements of Competency mapping end-to-end occupational benchmarks (e.g. *Element 1: Theoretical Foundations & Legislative Frameworks*, *Element 2: Risk Modeling & Systems Architecture*, *Element 3: Applied Execution & Testing*, *Element 4: Quality Assurance & Continuous Improvement*).
   - **Performance Criteria**: 3 to 5 criteria per Element (e.g. 1.1–1.4, 2.1–2.4, 3.1–3.4, 4.1–4.3).
3. **Pacing & Weekly Syllabus**:
   - Structured 15-week progression:
     - **Weeks 1–6**: Foundational principles, statutory compliance, core lectures, laboratory workshops.
     - **Week 7**: Mid-Semester Review & Mid-Semester Formative/Summative Examination (#1).
     - **Weeks 8–13**: Advanced application, non-routine problem solving, group or industry case studies.
     - **Week 14**: Synthesis, course review, and portfolio finalization.
     - **Week 15**: Formal Summative Examination & Capstone Defense (#2).
4. **Assessment Strategy**:
   - Multi-stage assessment model with strictly balanced weights totaling 100%:
     - Formative Checkpoints (Weeks 3, 5, 10).
     - Mid-Semester Practical Assessment (30–40% weight, Week 7/8).
     - Final Capstone Examination / Comprehensive Portfolio (50–60% weight, Week 14/15).

---

## 3. Multiple Elements of Competency & Performance Criteria Hierarchies

> [!IMPORTANT]
> **Strict Rule**: Every Unit of Competency MUST have multiple Elements of Competency. Never generate or permit a unit with only a single monolithic element.

### Defining the Hierarchy
1. **Unit of Competency**:
   - Identified by national code (e.g., `BSBWHS411`, `ICTPRG527`) and descriptive title.
   - Defines the broad workplace competency area.
2. **Element of Competency**:
   - Describes an essential operational outcome that contributes to the unit.
   - Formatted as: `Element [N]: [Action-Oriented Title]`
   - Example 1: `Element 1: Establish and maintain consultative arrangements`
   - Example 2: `Element 2: Implement hazard identification and risk assessment procedures`
   - Example 3: `Element 3: Monitor, evaluate and report on safety compliance outcomes`
3. **Performance Criteria (PC)**:
   - Specific observable actions and evidence required to prove achievement of that specific element.
   - Coded hierarchically: `[ElementNumber].[CriterionNumber]` (e.g., `1.1`, `1.2`, `2.1`, `2.2`, `3.1`, `3.2`).
   - Accompanied by:
     - **Title**: Actionable statement of the required skill or knowledge outcome.
     - **Description**: Detailed benchmark specifying statutory codes, tolerances, observable evidence, and workplace parameters.

---

## 4. Assessment Architecture: 5-Level Scoring Rubrics

All assessments must feature 5-level scoring rubrics providing transparent developmental milestones for learners and auditors:

| Level | Benchmark Name | Score Band | Pedagogy Interpretation |
| :--- | :--- | :--- | :--- |
| **Level 1** | **Not Yet Competent (NYC)** | 0–49% | Critical gaps in foundational concepts, safety, or compliance. Requires structured remediation and formal re-assessment. |
| **Level 2** | **Developing / Threshold** | 50–64% | Emerging capability under guidance. Grasps basic ideas but lacks independent consistency. |
| **Level 3** | **Competent (C) / Proficient** | 65–74% | **The Core Benchmark**. Consistently, accurately, and independently satisfies all required performance criteria. |
| **Level 4** | **Advanced / Accomplished** | 75–84% | Exceeds baseline competency. Solves non-routine problems, adapts procedures, and exhibits strong quality assurance. |
| **Level 5** | **Exemplary / Mastered** | 85–100% | Comprehensive mastery and industry leadership. Produces publication-grade or audit-ready institutional outcomes. |

---

## 5. Course CSV Schema & Data Contracts

The Course Builder supports bidirectional CSV import and export. The CSV structure handles:
1. **Course Details**: Code, Title, DurationWeeks (e.g., 4 or 15), AQF Level, Token Cost, Faculty, School, Description.
2. **Units**: UnitCode, UnitTitle, NominalHours, Description.
3. **Multiple Elements & Criteria**: ElementCode, ElementTitle, CriterionCode, CriterionTitle, CriterionDescription.
4. **Lessons**: WeekNumber (1–15), LessonTitle, EstimatedMinutes, BlockType, ResourceTitle, ResourceUrl.
5. **Assessments & Rubrics**: AssessmentType (formative/summative), Title, ExamNumber, DueWeek, Weight, RubricCriterion, and 5 Rubric Levels.

### Standard CSV Column Layout:
```csv
RecordType,CourseCode,CourseTitle,DurationWeeks,UnitCode,UnitTitle,NominalHours,ElementCode,ElementTitle,CriterionCode,CriterionTitle,CriterionDescription,LessonWeek,LessonTitle,LessonMinutes,LessonType,ResourceTitle,ResourceUrl,AssessmentType,AssessmentTitle,ExamNumber,DueWeek,RubricCriterion,Weight,Level1_NYC,Level2_Developing,Level3_Competent,Level4_Advanced,Level5_Exemplary
```

### Record Types:
- `COURSE`: Defines top-level course metadata and duration weeks (`4` for short course, `15` for semester).
- `UNIT`: Defines individual units of competency and nominal hours.
- `ELEMENT_CRITERION`: Binds multiple elements and performance criteria hierarchically to their unit.
- `LESSON`: Maps weekly modular lesson blocks and digital learning resources.
- `ASSESSMENT`: Configures formative/summative evaluations and 5-level scoring rubrics.

---

## 6. AI Agent Prompting Guidelines

When a user asks to create or expand a course, follow these steps:
1. **Determine Duration**: Ask or infer if this is a **Short Course (1–4 weeks)** or a **Long Semester Course (14–15 weeks)**.
2. **Generate Multiple Elements**: For every unit, always create at least 2 to 4 distinct Elements of Competency.
3. **Enforce Hierarchical Coding**: Ensure criteria are numbered `1.1, 1.2, 2.1, 2.2, 3.1, 3.2`.
4. **Provide Complete Rubrics**: Define 5 distinct levels (NYC, Developing, Competent, Advanced, Exemplary) for each criterion.
5. **Generate Downloadable CSV**: Format the curriculum into the Course Builder CSV specification for immediate import.
