import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

import { heroContent } from "@/data/landing";

export default function Hero() {
  return (
    <section className="relative pt-20 pb-32 px-4 overflow-hidden">
      {/* Background radial gradient decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8 font-medium gap-2">
          <Zap className="h-4 w-4" />
          <span>{heroContent.badge}</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground leading-[1.1]">
          {heroContent.headlineStart}{" "}
          <span className="text-primary">{heroContent.headlineHighlight}</span>
          <br />
          {heroContent.headlineEnd}
        </h1>

        {/* Description */}
        <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
          {heroContent.description}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center whitespace-nowrap bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-14 text-base shadow-lg shadow-primary/25 transition-all font-medium gap-2 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            {heroContent.primaryCta}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 h-14 text-base border border-border text-foreground hover:bg-accent bg-card shadow-sm transition-all font-medium hover:-translate-y-0.5"
          >
            {heroContent.secondaryCta}
          </Link>
        </div>

        {/* Trust text */}
        <p className="mt-12 text-sm text-muted-foreground">
          {heroContent.trustText}
        </p>
      </div>
    </section>
  );
}
