"use client";
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Shield, BarChart, Users, Zap, Clock, Check, Globe, Cloud, Lock, FileText } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.2 } },
};

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-blue-900 text-white sticky top-0 z-10 shadow-lg"
      >
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">TestForge</h1>
          <nav className="space-x-6">
            <Link href="#features" className="hover:text-blue-300 transition-colors">Features</Link>
            <Link href="#benefits" className="hover:text-blue-300 transition-colors">Benefits</Link>
            <Link href="#how-it-works" className="hover:text-blue-300 transition-colors">How It Works</Link>
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button variant="outline" className="text-white border-blue-300 hover:bg-blue-800">
                  Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <Button variant="outline" className="text-white border-blue-300 hover:bg-blue-800">
                  Sign In
                </Button>
              </SignInButton>
            )}
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center"
      >
        <h2 className="text-5xl font-bold text-blue-900 sm:text-6xl">
          Revolutionize Exam Management with TestForge
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
          A cutting-edge platform designed to streamline exam scheduling, automate administrative tasks, and enhance operational efficiency for MSBTE exam centers.
        </p>
        <motion.div variants={fadeIn} className="mt-8 space-x-4">
          {!isSignedIn && (
            <SignInButton mode="modal">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignInButton>
          )}
          <Link href="#features">
            <Button size="lg" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              Explore Features
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h3
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-3xl font-semibold text-blue-900 text-center"
          >
            Key Features
          </motion.h3>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={fadeIn}>
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Exam Automation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Automate timetables, seating, and block allocation effortlessly.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Shield className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Secure Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Role-based access ensures data integrity and security.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <BarChart className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Smart Reporting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Generate real-time, compliant reports with ease.</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Users className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Resource Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Optimize staff and inventory allocation seamlessly.</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="bg-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h3
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-3xl font-semibold text-blue-900 text-center"
          >
            Why Choose TestForge?
          </motion.h3>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mt-12 grid gap-8 md:grid-cols-3"
          >
            <motion.div variants={fadeIn} className="text-center">
              <Check className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-blue-900">Accuracy</h4>
              <p className="mt-2 text-gray-600">Eliminate errors with automated processes.</p>
            </motion.div>
            <motion.div variants={fadeIn} className="text-center">
              <Globe className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-blue-900">Scalability</h4>
              <p className="mt-2 text-gray-600">Designed to handle large-scale exams effortlessly.</p>
            </motion.div>
            <motion.div variants={fadeIn} className="text-center">
              <Lock className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-blue-900">Security</h4>
              <p className="mt-2 text-gray-600">Role-based access ensures data protection.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h3
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-3xl font-semibold text-blue-900 text-center"
          >
            How It Works
          </motion.h3>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mt-12 grid gap-8 md:grid-cols-3"
          >
            <motion.div variants={fadeIn} className="text-center">
              <Zap className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-blue-900">Setup</h4>
              <p className="mt-2 text-gray-600">Configure exam centers, timetables, and staff in minutes.</p>
            </motion.div>
            <motion.div variants={fadeIn} className="text-center">
              <Clock className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-blue-900">Manage</h4>
              <p className="mt-2 text-gray-600">Automate scheduling and monitor in real-time.</p>
            </motion.div>
            <motion.div variants={fadeIn} className="text-center">
              <FileText className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-blue-900">Report</h4>
              <p className="mt-2 text-gray-600">Generate detailed reports instantly.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h3
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-3xl font-semibold text-center"
          >
            Trusted by Exam Centers
          </motion.h3>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mt-12 grid gap-8 md:grid-cols-2"
          >
            <motion.div variants={fadeIn}>
              <Card className="bg-blue-800 border-none">
                <CardContent className="pt-6">
                  <p className="text-gray-200 italic">
                    "TestForge has transformed our exam process, saving us countless hours."
                  </p>
                  <p className="mt-4 text-blue-300 font-medium">- Exam Center Manager</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Card className="bg-blue-800 border-none">
                <CardContent className="pt-6">
                  <p className="text-gray-200 italic">
                    "The automation and reporting features are a game-changer for us."
                  </p>
                  <p className="mt-4 text-blue-300 font-medium">- Institution Administrator</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h3 className="text-3xl font-semibold">Ready to Simplify Your Exams?</h3>
          <p className="mt-4 max-w-xl mx-auto text-lg">
            Discover how TestForge can enhance efficiency for your institution or exam center.
          </p>
          <motion.div variants={fadeIn} className="mt-8">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="text-primary border-white hover:bg-blue-700">
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Start Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignInButton>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg font-semibold">TestForge</p>
          <p className="mt-2 text-sm">Empowering Institutions & Exam Centers</p>
          <p className="mt-4 text-sm">© 2025 TestForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}