import { MessageCircle } from "lucide-react";

const FloatingWhatsApp = () => {
  return (
    <a
      href="https://wa.me/252615401195?text=Hi%20SOMVI!%20I%20need%20a%20quote%20for..."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 group animate-fade-in"
      aria-label="Contact us on WhatsApp"
    >
      {/* Animated text bubble */}
      <div className="hidden sm:block bg-accent text-accent-foreground px-4 py-2 rounded-full shadow-lg font-medium whitespace-nowrap animate-gentle-pulse">
        Ku dalbo 30 il-biriqsi
      </div>
      
      {/* WhatsApp icon button */}
      <div className="relative bg-[#25D366] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(37,211,102,0.6)]">
        <MessageCircle className="w-8 h-8" />
        {/* Pulse ring effect */}
        <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-75" />
      </div>
    </a>
  );
};

export default FloatingWhatsApp;
