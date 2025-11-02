import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Why SOMVI", href: "#why-somvi" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <nav className="section-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-primary">SOMVI Somalia</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-foreground hover:text-accent transition-colors font-medium"
              >
                {link.name}
              </a>
            ))}
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90">
              <a
                href="https://wa.me/252615401195?text=Hi%20SOMVI!%20I%20need%20a%20quote%20for..."
                target="_blank"
                rel="noopener noreferrer"
              >
                Get a Quote
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 animate-fade-in">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-foreground hover:text-accent transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90">
              <a
                href="https://wa.me/252615401195?text=Hi%20SOMVI!%20I%20need%20a%20quote%20for..."
                target="_blank"
                rel="noopener noreferrer"
              >
                Get a Quote
              </a>
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
