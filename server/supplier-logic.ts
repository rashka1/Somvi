import type { Supplier, Material } from "@shared/schema";
import { MOGADISHU_DISTRICTS } from "@shared/schema";

// District proximity matrix - closer districts get lower scores
const DISTRICT_PROXIMITY: Record<string, Record<string, number>> = {
  "Hodan": { "Hodan": 0, "Wadajir": 1, "Hamar Weyne": 2, "Dharkenley": 2, "Hamar Jajab": 3 },
  "Wadajir": { "Wadajir": 0, "Hodan": 1, "Hamar Weyne": 2, "Kaxda": 1, "Dharkenley": 2 },
  "Hamar Weyne": { "Hamar Weyne": 0, "Hodan": 2, "Shangani": 1, "Hamar Jajab": 1, "Boondheere": 2 },
  "Dharkenley": { "Dharkenley": 0, "Hodan": 2, "Wadajir": 2, "Kaxda": 1, "Daynile": 2 },
  "Kaxda": { "Kaxda": 0, "Wadajir": 1, "Dharkenley": 1, "Daynile": 2, "Hodan": 3 },
  "Shangani": { "Shangani": 0, "Hamar Weyne": 1, "Boondheere": 1, "Hamar Jajab": 2 },
  "Hamar Jajab": { "Hamar Jajab": 0, "Hamar Weyne": 1, "Shangani": 2, "Boondheere": 1 },
  "Boondheere": { "Boondheere": 0, "Shangani": 1, "Hamar Jajab": 1, "Hamar Weyne": 2 },
  "Abdiaziiz": { "Abdiaziiz": 0, "Kaxda": 2, "Waberi": 1, "Daynile": 2 },
  "Waberi": { "Waberi": 0, "Abdiaziiz": 1, "Wadajir": 2, "Kaxda": 2 },
  "Daynile": { "Daynile": 0, "Kaxda": 2, "Dharkenley": 2, "Hodan": 3 },
  "Yaqshiid": { "Yaqshiid": 0, "Daynile": 1, "Kaxda": 2 },
  "Shibis": { "Shibis": 0, "Hamar Weyne": 2, "Boondheere": 2 },
  "Heliwa": { "Heliwa": 0, "Daynile": 1, "Yaqshiid": 2 },
  "Wardhiigley": { "Wardhiigley": 0, "Wadajir": 2, "Hodan": 2 },
  "Kahda": { "Kahda": 0, "Kaxda": 1, "Daynile": 2 },
};

/**
 * Calculate proximity score between two districts
 * Lower score = closer distance
 */
export function getDistrictProximity(district1: string | null, district2: string | null): number {
  if (!district1 || !district2) return 999; // Unknown location penalty
  if (district1 === district2) return 0; // Same district
  
  const proximity = DISTRICT_PROXIMITY[district1]?.[district2];
  return proximity !== undefined ? proximity : 10; // Default penalty for unmapped pairs
}

/**
 * Sort suppliers by smart priority:
 * 1. Location proximity to client/project
 * 2. Lowest price among nearby suppliers
 */
export function sortSuppliersByPriority(
  suppliers: Array<Supplier & { price: number }>,
  clientDistrict: string | null
): Array<Supplier & { price: number }> {
  return suppliers.sort((a, b) => {
    const distanceA = getDistrictProximity(clientDistrict, a.district);
    const distanceB = getDistrictProximity(clientDistrict, b.district);
    
    // If distances are significantly different, prioritize closer supplier
    if (Math.abs(distanceA - distanceB) > 0) {
      return distanceA - distanceB;
    }
    
    // If distances are similar, prioritize lower price
    return a.price - b.price;
  });
}

/**
 * Calculate SOMVI price with smart formula:
 * SOMVI Price = Market Price - Small Discount
 * Profit = SOMVI Price - Supplier Price + Supplier Commission (internal)
 */
export function calculateSomviPrice(params: {
  marketPrice: number;
  supplierPrice: number;
  supplierCommission?: number;
  markupPercentage?: number;
  markupType?: string;
}): { somviPrice: number; profit: number } {
  const { marketPrice, supplierPrice, supplierCommission = 0, markupPercentage = 15, markupType = 'percentage' } = params;
  
  // SOMVI Price = Market Price - Small Discount (typically 5-10%)
  const discountRate = 0.05; // 5% discount from market price
  const somviPrice = marketPrice * (1 - discountRate);
  
  // Profit calculation
  let baseProfit = somviPrice - supplierPrice;
  
  // Add supplier commission to profit (internal, not visible to client)
  const totalProfit = baseProfit + supplierCommission;
  
  return {
    somviPrice: Math.max(0, somviPrice),
    profit: Math.max(0, totalProfit),
  };
}

/**
 * Get best supplier for a material based on location and price
 */
export function getBestSupplier(
  suppliers: Array<Supplier & { price: number }>,
  clientDistrict: string | null
): (Supplier & { price: number }) | null {
  if (suppliers.length === 0) return null;
  
  const sorted = sortSuppliersByPriority(suppliers, clientDistrict);
  return sorted[0];
}
