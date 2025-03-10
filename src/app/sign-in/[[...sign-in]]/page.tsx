"use client";
import { SignIn } from '@clerk/nextjs';

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn redirectUrl="/dashboard/classes" />
    </div>
  );
}