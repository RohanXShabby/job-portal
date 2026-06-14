import { testimonials } from "@/data/landing";

export default function Testimonials() {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Loved by professionals everywhere
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Hear from real people who transformed their careers with JobPortal.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              {/* Quote */}
              <blockquote className="text-foreground leading-relaxed mb-8 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
