import { FileText, TrendingDown, Package, Tag } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const Services = () => {
  const services = [
    {
      icon: FileText,
      title: "Unified RFQs",
      description: "Submit one request, get multiple verified quotes from trusted suppliers instantly.",
    },
    {
      icon: TrendingDown,
      title: "Transparent Pricing",
      description: "Compare suppliers and delivery costs easily with no hidden fees or surprises.",
    },
    {
      icon: Package,
      title: "Trusted Logistics",
      description: "Reliable deliveries 24/7 with real-time tracking and professional handling.",
    },
    {
      icon: Tag,
      title: "Clearance Deals",
      description: "Access discounted stock directly from suppliers and save on bulk orders.",
    },
  ];

  return (
    <section id="services" className="py-20 md:py-32 bg-background">
      <div className="section-container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">
            What We Offer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive solutions for all your construction material and logistics needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="hover-lift animate-fade-in border-border"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 mb-4 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-3">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
