import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  Users,
  ShieldCheck,
  Search,
  Zap,
  TrendingUp,
  MessageSquare,
  UserCheck,
  Send,
  Award,
  Clock,
  Globe,
  HeartHandshake,
  BarChart3,
  Lock,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Step {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Benefit {
  icon: LucideIcon;
  text: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
}

export interface FooterSection {
  title: string;
  links: NavLink[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Hero
// ────────────────────────────────────────────────────────────────────────────

export const heroContent = {
  badge: "The #1 Platform for Top Tech Talent",
  headlineStart: "Find Your Next",
  headlineHighlight: "Dream Job",
  headlineEnd: "With Confidence.",
  description:
    "Connect with innovative companies, streamline your application process, and track your career growth on a platform built for modern professionals.",
  primaryCta: "Get Started Free",
  secondaryCta: "See How It Works",
  trustText: "Trusted by 200K+ professionals worldwide",
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Company Logos
// ────────────────────────────────────────────────────────────────────────────

export const companyNames: string[] = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Apple",
  "Netflix",
];

// ────────────────────────────────────────────────────────────────────────────
// Statistics
// ────────────────────────────────────────────────────────────────────────────

export const stats: Stat[] = [
  { value: "25K+", label: "Active Jobs" },
  { value: "5K+", label: "Companies" },
  { value: "200K+", label: "Candidates" },
  { value: "98%", label: "Hiring Success" },
];

// ────────────────────────────────────────────────────────────────────────────
// Features
// ────────────────────────────────────────────────────────────────────────────

export const features: Feature[] = [
  {
    icon: Search,
    title: "Smart Job Matching",
    description:
      "Our AI-driven algorithm connects you with roles that perfectly align with your skills, experience, and career aspirations.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Employers",
    description:
      "Every company on our platform undergoes a rigorous vetting process to ensure high integrity and professional environments.",
  },
  {
    icon: MessageSquare,
    title: "Direct Communication",
    description:
      "Bypass the black box. Chat directly with hiring managers and recruiters to stand out from the applicant pool.",
  },
  {
    icon: TrendingUp,
    title: "Career Analytics",
    description:
      "Track your application progress, salary benchmarks, and market trends with our comprehensive analytics dashboard.",
  },
  {
    icon: Zap,
    title: "Instant Alerts",
    description:
      "Get notified the moment a role matching your profile is posted. Never miss a perfect opportunity again.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description:
      "Control who sees your profile. Browse confidentially and apply only when you're ready to make a move.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// How It Works
// ────────────────────────────────────────────────────────────────────────────

export const steps: Step[] = [
  {
    step: 1,
    icon: UserCheck,
    title: "Create Your Profile",
    description:
      "Sign up in under 2 minutes. Import your LinkedIn or upload a resume to get started instantly.",
  },
  {
    step: 2,
    icon: Search,
    title: "Discover Opportunities",
    description:
      "Browse curated job listings tailored to your skills, location, and salary expectations.",
  },
  {
    step: 3,
    icon: Send,
    title: "Apply With One Click",
    description:
      "Submit polished applications directly to hiring managers with our streamlined apply flow.",
  },
  {
    step: 4,
    icon: Award,
    title: "Get Hired",
    description:
      "Land interviews faster and receive offers from top companies actively looking for talent like you.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Benefits
// ────────────────────────────────────────────────────────────────────────────

export const benefits: Benefit[] = [
  { icon: Clock, text: "Save 10+ hours per week on job applications" },
  { icon: Globe, text: "Access opportunities from 50+ countries" },
  { icon: BarChart3, text: "Real-time salary and market insights" },
  { icon: HeartHandshake, text: "Dedicated career coaching support" },
  { icon: ShieldCheck, text: "100% verified and vetted employers" },
  { icon: Users, text: "Active community of 200K+ professionals" },
];

// ────────────────────────────────────────────────────────────────────────────
// Testimonials
// ────────────────────────────────────────────────────────────────────────────

export const testimonials: Testimonial[] = [
  {
    quote:
      "JobPortal completely changed my job search. I landed my dream role at a Series B startup within 3 weeks of signing up.",
    name: "Sarah Chen",
    role: "Senior Frontend Engineer",
    company: "Vercel",
    initials: "SC",
  },
  {
    quote:
      "As a hiring manager, the quality of candidates on this platform is unmatched. We've reduced our time-to-hire by 60%.",
    name: "Marcus Williams",
    role: "VP of Engineering",
    company: "Stripe",
    initials: "MW",
  },
  {
    quote:
      "The direct messaging feature let me connect with recruiters without the usual runaround. Highly recommend for senior roles.",
    name: "Priya Patel",
    role: "Staff Software Engineer",
    company: "Google",
    initials: "PP",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// FAQ
// ────────────────────────────────────────────────────────────────────────────

export const faqItems: FaqItem[] = [
  {
    question: "Is JobPortal free to use?",
    answer:
      "Yes! Creating a profile, browsing jobs, and applying is completely free for candidates. Premium features like career coaching and advanced analytics are available with our Pro plan.",
  },
  {
    question: "How does the matching algorithm work?",
    answer:
      "Our AI analyzes your skills, experience, preferences, and career goals to surface the most relevant opportunities. The more you interact with the platform, the better it gets.",
  },
  {
    question: "Can employers contact me directly?",
    answer:
      "Only if you enable the 'Open to Work' setting. You have full control over your visibility and can browse confidentially at any time.",
  },
  {
    question: "What makes JobPortal different from other job boards?",
    answer:
      "We combine AI-powered matching, verified employers, direct communication, and real-time analytics into a single platform designed for modern professionals.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// CTA
// ────────────────────────────────────────────────────────────────────────────

export const ctaContent = {
  headline: "Ready to accelerate your career?",
  description:
    "Join thousands of professionals and top-tier companies already using our platform to find their perfect match.",
  buttonText: "Create Your Free Account",
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────────────────────

export const footerSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];
