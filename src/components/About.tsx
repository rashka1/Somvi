import { Shield, DollarSign, Truck } from "lucide-react";
import aboutIllustration from "@/assets/about-illustration.png";

const About = () => {
  const features = [
    {
      icon: Shield,
      title: "Trusted Suppliers",
      description: "Verified network of reliable construction material suppliers",
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "Compare quotes and delivery costs with full transparency",
    },
    {
      icon: Truck,
      title: "Reliable Logistics",
      description: "Dependable delivery services available 24/7",
    },
  ];

  return (
    <section id="about" className="py-20 md:py-32 bg-card">
      <div className="section-container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">
            Building Trust in Every Transaction
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            SOMVI Somalia connects contractors, suppliers, and logistics providers through a single 
            transparent platform — making sourcing faster, safer, and smarter.
          </p>
        </div>

        {/* Illustration */}
        <div className="flex justify-center mb-12 animate-fade-in">
          <img 
            src={aboutIllustration}
            alt="SOMVI supply chain partnership: trust and collaboration between suppliers and contractors with logistics trucks" 
            className="max-w-md w-full h-auto rounded-lg shadow-lg"
            loading="lazy"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="text-center p-8 rounded-xl bg-background border border-border hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-accent/10 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;
