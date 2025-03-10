"use client";
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SignOutButton, UserButton } from '@clerk/nextjs';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

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