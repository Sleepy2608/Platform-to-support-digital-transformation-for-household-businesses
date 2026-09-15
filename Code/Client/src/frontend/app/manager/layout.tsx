'use client';

import React from 'react';
import BackToTop from '../components/BackToTop';

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BackToTop variant="light" />
    </>
  );
}
