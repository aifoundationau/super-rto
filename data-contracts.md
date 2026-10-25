# Super-RTO Strict Data Contracts & Schema Specification

All UI, API, and Agent inputs must strictly conform to these Zod/JSON schemas.
Compliance Mandate: Strict objects (`additionalProperties: false` / `.strict()`), regex sanitization, and Australian Privacy Act 1988 (APP 1–13) standards.

---

## 1. Unified RBAC & Roles Contract

```typescript
import { z } from 'zod';

export const SystemRoleSchema = z.enum([
  'superadmin',
  'director',      // College/University Senior Management (sets institution defaults)
  'chancellor',    // University Board / Ceremonial
  'president',     // Executive President
  'ceo',           // Chief Executive Officer
  'coo',           // Chief Operating Officer
  'cfo',           // Chief Financial Officer
  'accounting',    // Finance & Invoicing
  'administration',// Registrar, admissions, AVETMISS compliance
  'teacher',       // Course Builder, grading rubrics, instruction
  'student',       // Enrolled learner
  'supporter'      // Default public registered user
]);

export const UserClaimsContract = z.object({
  uid: z.string().min(1).max(128),
  email: z.string().email(),
  role: SystemRoleSchema,
  institutionId: z.string().min(1).max(64).optional(), // For Directors & staff
  isSuperAdmin: z.boolean().default(false),
  isDirector: z.boolean().default(false),
  token_balance: z.number().int().min(0), // STRICT INTEGER ONLY (Math.round)
  isCharityApproved: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
}).strict();
```

---

## 2. Compliance Frameworks Contract

```typescript
export const ComplianceFrameworkCodeSchema = z.enum([
  'ASQA',        // Australian Skills Quality Authority (VET Standards) - DEFAULT
  'TEQSA',       // Tertiary Education Quality & Standards Agency (Higher Ed) - DEFAULT
  'NZQA',        // New Zealand Qualifications Authority
  'UK_QAA',      // UK Quality Assurance Agency for Higher Education
  'UK_OFSTED',   // UK Office for Standards in Education
  'US_CHEA',     // US Council for Higher Education Accreditation & Regional
  'AACSB',       // Association to Advance Collegiate Schools of Business
  'SG_SSG',      // SkillsFuture Singapore & Committee for Private Education
  'INTERNATIONAL'// General International Open Framework
]);

export const InstitutionComplianceConfigContract = z.object({
  institutionId: z.string().min(1).max(64),
  institutionName: z.string().min(2).max(120),
  directorUid: z.string().min(1).max(128),
  primaryFramework: ComplianceFrameworkCodeSchema.default('ASQA'),
  secondaryFramework: ComplianceFrameworkCodeSchema.default('TEQSA'),
  additionalFrameworks: z.array(ComplianceFrameworkCodeSchema).default([]),
  rtoCode: z.string().regex(/^[0-9A-Za-z-]{3,16}$/).optional(), // e.g. RTO ID
  cricosCode: z.string().regex(/^[0-9A-Za-z-]{3,16}$/).optional(),
  academicIntegrityPolicyUrl: z.string().url().optional(),
  assessmentGradingType: z.enum(['COMPETENCY_C_NYC', 'FOUR_TIER_RUBRIC', 'PERCENTAGE_GPA']).default('COMPETENCY_C_NYC'),
  updatedAt: z.string().datetime()
}).strict();
```

---

## 3. Dual-Panel Token & Multi-Currency Contract

```typescript
export const TokenCurrencyConfigContract = z.object({
  scope: z.enum(['GLOBAL', 'INSTITUTION']),
  institutionId: z.string().optional(),
  configuredByRole: z.enum(['superadmin', 'director']),
  configuredByUid: z.string().min(1).max(128),
  
  // Base Currency Setting
  baseCurrency: z.enum(['USD', 'AUD']).default('USD'),
  
  // Rate Values (Base rate sets the anchor, secondary auto-computed)
  tokenPriceUsd: z.number().min(0.01).max(1000.00),
  tokenPriceAud: z.number().min(0.01).max(1500.00),
  conversionRateUsdToAud: z.number().min(0.1).max(10.0).default(1.54), // Live/manual exchange rate
  
  // Currency System Toggles (Superadmin global & Director localized)
  isTokenSystemEnabled: z.boolean().default(true),
  isAudEnabled: z.boolean().default(true),
  isUsdEnabled: z.boolean().default(true),
  
  // Tokens are strictly integer (Math.round)
  dailyAccessCostTokens: z.number().int().min(0).max(100).default(1),
  aiCourseAssistCostTokens: z.number().int().min(0).max(100).default(10),
  
  // UI Hover Presentation Directive
  hoverDisplayPrice: z.boolean().default(true), // AUD/USD shown strictly on hover over token pill
  geolocateAudOnly: z.boolean().default(true),  // AUD displayed strictly to AU visitors
  
  updatedAt: z.string().datetime()
}).strict();

export const TokenLotPurchaseContract = z.object({
  tokens: z.number().int().min(1).max(10000), // Strict integer
  currency: z.enum(['USD', 'AUD']),
  computedAmount: z.number().min(0.01),
  targetAllocation: z.enum(['SELF', 'EMERGENCY_FUND', 'BENEFICIARY', 'UNREGISTERED_ESCROW']),
  recipientEmail: z.string().email().optional(),
  idempotencyKey: z.string().uuid()
}).strict();
```

---

## 4. Course Builder & Curriculum Contract

```typescript
export const CourseBuilderBlockContract = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'text_description',
    'teacher_guide',
    'youtube_video',
    'google_drive_link',
    'file_upload',
    'quiz'
  ]),
  title: z.string().min(1).max(150),
  content: z.string().max(20000),
  metadata: z.record(z.string(), z.any()).optional()
}).strict();

export const CourseUnitContract = z.object({
  unitCode: z.string().min(2).max(30), // e.g. BSBWHS411
  unitTitle: z.string().min(2).max(150),
  nominalHours: z.number().int().min(1).max(600).default(40),
  description: z.string().max(4000),
  lessons: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(150),
    estimatedMinutes: z.number().int().min(5).max(360).default(45),
    blocks: z.array(CourseBuilderBlockContract)
  })),
  assessments: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['formative', 'summative']),
    title: z.string().min(1).max(150),
    description: z.string().max(4000),
    criteria: z.array(z.object({
      criterionTitle: z.string(),
      weight: z.number().min(1).max(100),
      competentDescriptor: z.string(),
      notYetCompetentDescriptor: z.string()
    }))
  }))
}).strict();
```

---

## 5. Geo, Weather & Time Bar Contract

```typescript
export const GeoTimeWidgetContract = z.object({
  suburb: z.string().min(1).max(100).default('Sydney'),
  state: z.string().min(2).max(30).default('NSW'),
  country: z.string().min(2).max(50).default('Australia'),
  timezone: z.string().default('Australia/Sydney'),
  is24HourFormat: z.boolean().default(false),
  temperatureCelsius: z.number().min(-40).max(60),
  weatherCondition: z.string().max(50),
  weatherIcon: z.string().max(20)
}).strict();
```

---

## 6. Google Drive Direct Resumable Upload Contract

```typescript
export const GoogleDriveAllowedMimeTypeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

export const GoogleDriveStartUploadRequestContract = z.object({
  email: z.string().email().max(255),
  fileName: z.string().min(1).max(200).regex(/^[\w\-. ]+\.(jpe?g|png|webp|pdf|docx)$/i, {
    message: 'Allowed file extensions: .jpg, .jpeg, .png, .webp, .pdf, .docx'
  }),
  mimeType: GoogleDriveAllowedMimeTypeSchema,
  size: z.number().int().min(1).max(100 * 1024 * 1024, {
    message: 'File size must be between 1 byte and 100 MB.'
  })
}).strict();

export const GoogleDriveStartUploadResponseContract = z.object({
  success: z.boolean(),
  uploadUrl: z.string().url(),
  folderPath: z.string(),
  folderId: z.string(),
  fileName: z.string(),
  maxBytes: z.number().int()
}).strict();
```

