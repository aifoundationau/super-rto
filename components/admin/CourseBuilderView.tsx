'use client';

import React from 'react';
import { UnifiedCourseBuilder } from '@/components/courseBuilder/UnifiedCourseBuilder';

interface CourseBuilderViewProps {
  apiKey?: string;
}

/**
 * CourseBuilderView (PRO-LMS Fusion)
 * Replaces the legacy rto-ai course builder with the modern LMS Course Builder
 * featuring AQF 1-9 & International frameworks, modular lesson blocks,
 * C / NYC assessment rubrics, and AI Ingestion.
 */
export const CourseBuilderView: React.FC<CourseBuilderViewProps> = () => {
  return (
    <div className="space-y-6">
      <UnifiedCourseBuilder />
    </div>
  );
};
