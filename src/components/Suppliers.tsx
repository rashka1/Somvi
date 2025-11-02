import { HardHat, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Suppliers = () => {
  const cards = [
    {
      icon: HardHat,
      heading: "Our Buyers",
      text: "Our top priority is supporting our buyers to access the best prices, services and options.",
      points: [
        "Access a wide pool of suppliers and materials",
        "Easy registration and fast RFQ issuance via WhatsApp or website",
        "Multiple delivery and payment options based on your needs",
      ],
      buttonText: "Buy Material",
      buttonLink: "https://wa.me/252615401195?text=Hi%20SOMVI!%20I%20need%20a%20quote%20for...",
    },
    {
      icon: FileText,
      heading: "Our Suppliers",
      text: "Our suppliers are our success partners that we aim to satisfy with every transaction.",
      points: [
        "Access a wide customer base with a click of a button",
        "Provide competitive prices; we'll handle your sales and operations",
        "Customize prices by size, location, and delivery options",
      ],
      buttonText: "Connect with Us",
      buttonLink: "https://wa.me/252615401195?text=Hi%20SOMVI!%20I%20want%20to%20become%20a%20supplier",
    },
  ];

  return (
    <section id="suppliers" className="py-16 md:py-24 bg-background">
      <div className="section-container">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">
            Our Added Value
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            It's not only about being digital. It's about better prices, faster logistics, and wider selection.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                className="border-2 border-accent/20 rounded-2xl hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary">{card.heading}</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 text-base">
                    {card.text}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {card.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <ArrowRight className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                  >
                    <a href={card.buttonLink} target="_blank" rel="noopener noreferrer">
                      {card.buttonText}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Suppliers;
