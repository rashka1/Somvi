import { MessageSquare, FileCheck, Truck } from "lucide-react";
import stepRequest from "@/assets/step-request.png";
import stepCompare from "@/assets/step-compare.png";
import stepDelivery from "@/assets/step-delivery.png";

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      icon: MessageSquare,
      image: stepRequest,
      title: "Send Your Request",
      description: "Contact us via WhatsApp or our platform with your material requirements",
    },
    {
      number: "2",
      icon: FileCheck,
      image: stepCompare,
      title: "Get Verified Quotes",
      description: "Receive competitive quotes from multiple verified suppliers instantly",
    },
    {
      number: "3",
      icon: Truck,
      image: stepDelivery,
      title: "Confirm and Receive",
      description: "Choose your supplier and get reliable delivery with real-time tracking",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-primary text-primary-foreground">
      <div className="section-container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Simplified in 3 Easy Steps
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            From request to delivery, we make the entire process seamless
          </p>
        </div>

        {/* Visual Step Images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <img 
                src={step.image}
                alt={`${step.title}: ${step.description}`}
                className="w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-accent/30" />
                )}

                {/* Step Circle */}
                <div className="relative z-10 w-32 h-32 mx-auto mb-6 bg-accent rounded-full flex items-center justify-center">
                  <Icon className="w-12 h-12 text-accent-foreground" />
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-primary-foreground text-primary rounded-full flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                </div>

                <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                <p className="text-primary-foreground/80 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
