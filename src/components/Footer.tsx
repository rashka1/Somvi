import { MapPin, Mail, Phone, MessageCircle, Linkedin, Facebook, Twitter } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold">SOMVI Somalia</span>
            </div>
            <p className="text-primary-foreground/80 mb-4">
              Simplifying Construction Supply Chains
            </p>
            <p className="text-sm text-primary-foreground/60">
              Your trusted partner for construction materials, logistics, and transparent deals across Somalia.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-primary-foreground/80 text-sm">
                  Mogadishu, Somalia
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:info@somvi.so"
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                >
                  info@somvi.so
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <a
                  href="tel:+252615401195"
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                >
                  +252 615 401 195
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <a
                  href="https://wa.me/252615401195?text=Hi%20SOMVI!%20I%20need%20a%20quote%20for..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                >
                  WhatsApp Support 24/7
                </a>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Get Started Today</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Ready to simplify your construction supply chain? Get a quote now and experience the SOMVI difference.
            </p>
            <Button
              asChild
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <a
                href="https://wa.me/252615401195?text=Hi%20SOMVI!%20I%20need%20a%20quote%20for..."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Request a Quote
              </a>
            </Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/60">
            © 2025 SOMVI Somalia – All Rights Reserved
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent flex items-center justify-center transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
