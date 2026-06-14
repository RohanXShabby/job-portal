import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ctaContent } from "@/data/landing";

export default function Cta() {
  return (
    <section className="py-24 px-4 bg-primary">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary-foreground">
          {ctaContent.headline}
        </h2>
        <p className="text-lg text-primary-foreground/80 mb-10 max-w-xl mx-auto">
          {ctaContent.description}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center whitespace-nowrap bg-card text-foreground hover:bg-card/90 rounded-xl px-10 h-14 text-base font-medium shadow-lg transition-all gap-2 hover:-translate-y-0.5 hover:shadow-xl"
        >
          {ctaContent.buttonText}
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}
