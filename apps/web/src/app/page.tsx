import type { Metadata } from "next";

import Hero from "@/components/landing/hero";
import Stats from "@/components/landing/stats";
import Features from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import Benefits from "@/components/landing/benefits";
import Testimonials from "@/components/landing/testimonials";
import Faq from "@/components/landing/faq";
import Cta from "@/components/landing/cta";
import Footer from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "JobPortal — Find Your Next Dream Job With Confidence",
  description:
    "Connect with innovative companies, streamline your application process, and track your career growth on the #1 platform for modern professionals.",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <Faq />
      <Cta />
      <Footer />
    </div>
  );
}
