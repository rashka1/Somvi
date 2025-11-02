import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const BrandsOnboard = () => {
  // Placeholder brand names - replace with actual logos when available
  const brands = [
    "Riyadh Cement",
    "Wacker",
    "Saveto",
    "Awazel",
    "Izomaks",
    "Neproplast",
    "Yamama Cement",
    "BuildTech",
    "ConstructCo",
    "Materials Plus",
    "Supply Chain Pro",
    "Elite Suppliers",
  ];

  return (
    <section className="py-16 md:py-20 bg-card">
      <div className="section-container">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">
            Brands <span className="text-accent">Onboard</span>
          </h2>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 2000,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-4">
            {brands.map((brand, index) => (
              <CarouselItem
                key={index}
                className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/6"
              >
                <div className="p-6 bg-background rounded-lg border border-border flex items-center justify-center h-24 hover:scale-105 transition-transform duration-200 hover:shadow-md">
                  <span className="text-sm font-semibold text-muted-foreground text-center">
                    {brand}
                  </span>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default BrandsOnboard;
