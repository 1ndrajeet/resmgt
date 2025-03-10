"use client";
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, BookOpen, BarChart, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {

  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Result Management System</h1>
          {isSignedIn ? (
            <Link href="/dashboard/classes">
              <Button>Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          ) : (
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Manage Academic Results with Ease
            </h2>
            <p className="mt-3 max-w-md mx-auto text-lg text-gray-500 sm:text-xl">
              A comprehensive solution for class management, student registration, marks entry, and report generation.
            </p>
            {!isSignedIn && (
              <div className="mt-5">
                <SignInButton mode="modal">
                  <Button size="lg" className="text-lg">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </SignInButton>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-6 w-6 mr-2 text-blue-500" />
                  Class Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                Organize classes by department, semester, and master code (e.g., CO-5-I).
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-6 w-6 mr-2 text-green-500" />
                  Student Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                Register students with name, seat number, and enrollment number.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-purple-500" />
                  Marks Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                Enter marks for various assessments like FA-TH, SA-PR, and more.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-6 w-6 mr-2 text-orange-500" />
                  Report Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                Generate detailed reports with min, max, and average marks.
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p className="mt-1">© {new Date().getFullYear()} Result Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}