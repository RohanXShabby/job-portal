import { benefits } from "@/data/landing";
import { Briefcase } from "lucide-react";

export default function Benefits() {
  return (
    <section className="py-24 px-4 bg-accent/30">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Why professionals choose us
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              We&apos;ve built every feature around one goal: helping you find
              meaningful work faster.
            </p>
            <ul className="space-y-5">
              {benefits.map((benefit) => (
                <li key={benefit.text} className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-foreground font-medium pt-2">
                    {benefit.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Illustration placeholder */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl bg-card border border-border shadow-lg flex items-center justify-center overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-8 right-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
              <div className="absolute bottom-8 left-8 w-24 h-24 rounded-full bg-secondary/10 blur-2xl" />
              {/* Central icon */}
              <div className="relative flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-10 w-10 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Your career, accelerated
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
