import { Package, FileText, Award } from "lucide-react";

const Stats = () => {
  const stats = [
    {
      icon: Package,
      number: "700+",
      label: "Available Materials",
    },
    {
      icon: FileText,
      number: "20K+",
      label: "Issued RFQs",
    },
    {
      icon: Award,
      number: "20+",
      label: "Trusted Suppliers",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background rounded-t-3xl rounded-b-3xl">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-accent" strokeWidth={1.5} />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-lg text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;
