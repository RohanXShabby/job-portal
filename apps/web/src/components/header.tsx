"use client";
import Link from "next/link";
import { Briefcase } from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all duration-200">
      <div className="container mx-auto max-w-6xl px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              JobPortal
            </span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/jobs" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Find Jobs
            </Link>
            <Link href="/companies" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Companies
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
