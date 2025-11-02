import { db } from "./db";
import { materials } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface MaterialJSON {
  id: string;
  name: string;
  description: string;
  unit: string;
  category: string;
  image: string;
  priceRange: string;
  deliveryDays: string;
}

async function migrateMaterials() {
  try {
    console.log("Starting materials migration...");
    
    const materialsPath = path.resolve("public/data/materials.json");
    const materialsJSON: MaterialJSON[] = JSON.parse(fs.readFileSync(materialsPath, "utf-8"));
    
    for (const material of materialsJSON) {
      const priceRange = material.priceRange.split("-");
      const minPrice = priceRange[0];
      const maxPrice = priceRange[1] || priceRange[0];
      
      const deliveryMatch = material.deliveryDays.match(/(\d+)/);
      const deliveryDays = deliveryMatch ? parseInt(deliveryMatch[0]) : 3;
      
      const existingMaterial = await db
        .select()
        .from(materials)
        .where(eq(materials.nameEn, material.name))
        .limit(1);
      
      if (existingMaterial.length === 0) {
        await db.insert(materials).values({
          nameEn: material.name,
          nameSo: null,
          unitSo: material.unit,
          category: material.category,
          description: material.description,
          imageUrl: material.image,
          active: true,
          minPrice: minPrice,
          maxPrice: maxPrice,
          deliveryDays: deliveryDays,
        });
        console.log(`✓ Migrated: ${material.name}`);
      } else {
        console.log(`- Skipped (already exists): ${material.name}`);
      }
    }
    
    console.log("Materials migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

migrateMaterials();
