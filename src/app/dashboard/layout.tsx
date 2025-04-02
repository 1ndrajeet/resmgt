"use client";
import { Sidebar } from '@/components/Sidebar';
import { UserButton } from '@clerk/nextjs';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Result Management</h1>
          <UserButton showName/>
        </header>
        {children}
      </div>
    </div>
  );
}