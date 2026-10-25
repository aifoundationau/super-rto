'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { UnifiedCourseBuilder } from '@/components/courseBuilder/UnifiedCourseBuilder';
import { SystemRole } from '@/lib/auth/roles';

export default function BuilderPage() {
  const [currentRole, setCurrentRole] = useState<SystemRole>('director');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        tokenBalance={75}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <UnifiedCourseBuilder />
      </main>
      <Footer />
    </div>
  );
}
