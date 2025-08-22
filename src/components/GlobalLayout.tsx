"use client";

import React from "react";
import ParticleBackground from "./ParticleBackground";
import { UserButton } from "./auth/UserButton";

interface GlobalLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const GlobalLayout = ({ children, className }: GlobalLayoutProps) => (
  <div className="flex w-full flex-col min-h-screen bg-gradient-main relative">
    <ParticleBackground />
    <div className="relative z-10 flex flex-col flex-1">
      <div className="absolute top-4 right-4 z-20">
        <UserButton />
      </div>
      {children}
    </div>
  </div>
);

export default GlobalLayout; 