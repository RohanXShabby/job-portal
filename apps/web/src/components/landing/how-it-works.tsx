import { steps } from "@/data/landing";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Go from signup to hired in four simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item) => (
            <div key={item.step} className="relative text-center group">
              {/* Step number */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground text-lg font-bold mb-6 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                {item.step}
              </div>
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <item.icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
