import { Quote } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const Testimonials = () => {
  const testimonials = [
    {
      quote: "SOMVI has completely transformed how we source materials. The transparent pricing and verified suppliers give us confidence in every order.",
      name: "Ahmed Hassan",
      role: "Construction Manager",
      company: "Hassan Building Co.",
    },
    {
      quote: "The real-time WhatsApp updates and 24/7 support make working with SOMVI effortless. Delivery is always on time and reliable.",
      name: "Fatima Omar",
      role: "Project Coordinator",
      company: "Omar Construction Ltd.",
    },
    {
      quote: "Getting multiple quotes from verified suppliers in minutes has saved us both time and money. SOMVI is a game-changer for contractors in Somalia.",
      name: "Ibrahim Mohamed",
      role: "Lead Contractor",
      company: "Mogadishu Builders",
    },
  ];

  return (
    <section 
      className="relative py-20 md:py-32 overflow-hidden"
      style={{
        backgroundImage: `url(https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-background/95" />
      
      <div className="section-container relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">
            Trusted by Contractors Across Somalia
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our partners have to say about working with SOMVI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="hover-lift animate-fade-in border-border"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <CardContent className="p-8">
                <Quote className="w-10 h-10 text-accent/30 mb-4" />
                <p className="text-foreground mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-primary">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-sm text-accent">{testimonial.company}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
