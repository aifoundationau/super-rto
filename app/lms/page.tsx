'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { StudentLearningPanel } from '@/components/lms/StudentLearningPanel';
import { SystemRole } from '@/lib/auth/roles';

export default function LmsPage() {
  const [currentRole, setCurrentRole] = useState<SystemRole>('student');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        tokenBalance={40}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <StudentLearningPanel />
      </main>
      <Footer />
    </div>
  );
}
