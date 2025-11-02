import { CheckCircle } from "lucide-react";

const WhySomvi = () => {
  const reasons = [
    "Verified supplier network across Somalia",
    "Pay-to-Verify model ensures quality and trust",
    "Transparent pricing with no hidden fees",
    "Real-time WhatsApp updates on your orders",
    "24/7 support available day or night",
  ];

  return (
    <section id="why-somvi" className="py-20 md:py-32 bg-card relative overflow-hidden">
      {/* Trust Overlay Background */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1920&q=80)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-card/50" />
      </div>

      <div className="section-container relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">
              Why Contractors Trust SOMVI
            </h2>
            <p className="text-lg text-muted-foreground">
              Built by contractors, for contractors — we understand your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 rounded-lg bg-background border border-border hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <p className="text-foreground font-medium">{reason}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block p-8 rounded-xl bg-accent/5 border border-accent/20">
              <p className="text-2xl md:text-3xl font-bold text-primary mb-1">
                Join 500+ Contractors
              </p>
              <p className="text-muted-foreground">
                Trusted by Contractors Across Somalia
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySomvi;
