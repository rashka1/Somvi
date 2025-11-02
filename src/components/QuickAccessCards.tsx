import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, FolderKanban, ArrowRight } from "lucide-react";

export default function QuickAccessCards() {
  return (
    <section className="section-spacing bg-muted/30">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="section-title">Quick Access</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Browse active deals and manage your construction projects
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Active Deals Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Tag className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">💰 Active Deals</CardTitle>
              <CardDescription>
                Get exclusive discounts on construction materials. Limited time offers on quality supplies!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/deals">
                <Button className="w-full group" data-testid="button-view-deals">
                  View Active Deals
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* My Projects Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FolderKanban className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">🏗️ My Projects</CardTitle>
              <CardDescription>
                Track your construction projects, manage phases, and monitor material requests all in one place.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/my-projects">
                <Button className="w-full group" variant="outline" data-testid="button-view-projects">
                  View My Projects
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
