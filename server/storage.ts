import {
  users, clients, materials, suppliers, rfqs, rfqItems, quotes, leads, settings, materialSuppliers,
  deals, projects, projectPhases, projectRfqs,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Material, type InsertMaterial,
  type Supplier, type InsertSupplier,
  type RFQ, type InsertRFQ,
  type RFQItem, type InsertRFQItem,
  type Quote, type InsertQuote,
  type Lead, type InsertLead,
  type Settings, type InsertSettings,
  type MaterialSupplier, type InsertMaterialSupplier,
  type Deal, type InsertDeal,
  type Project, type InsertProject,
  type ProjectPhase, type InsertProjectPhase,
  type ProjectRfq, type InsertProjectRfq,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientByWhatsapp(whatsapp: string): Promise<Client | undefined>;
  createClient(data: InsertClient): Promise<Client>;
  updateClient(id: number, data: Partial<InsertClient>): Promise<Client>;
  
  getMaterials(): Promise<Material[]>;
  getActiveMaterials(): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  createMaterial(data: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, data: Partial<InsertMaterial>): Promise<Material>;
  deleteMaterial(id: number): Promise<void>;
  
  getRFQs(): Promise<RFQ[]>;
  getRFQ(id: number): Promise<RFQ | undefined>;
  getRFQByNumber(rfqNumber: string): Promise<RFQ | undefined>;
  getRFQsByClient(clientPhone: string): Promise<RFQ[]>;
  createRFQ(data: InsertRFQ): Promise<RFQ>;
  updateRFQ(id: number, data: Partial<InsertRFQ>): Promise<RFQ>;
  deleteRFQ(id: number): Promise<void>;
  
  getRFQItems(rfqId: number): Promise<RFQItem[]>;
  createRFQItem(data: InsertRFQItem): Promise<RFQItem>;
  updateRFQItem(id: number, data: Partial<InsertRFQItem>): Promise<RFQItem>;
  deleteRFQItem(id: number): Promise<void>;
  
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;
  
  getQuotes(rfqId: number): Promise<Quote[]>;
  createQuote(data: InsertQuote): Promise<Quote>;
  updateQuote(id: number, data: Partial<InsertQuote>): Promise<Quote>;
  deleteQuote(id: number): Promise<void>;
  
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  getLeadByRFQ(rfqId: number): Promise<Lead | undefined>;
  createLead(data: InsertLead): Promise<Lead>;
  updateLead(id: number, data: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: number): Promise<void>;
  
  getSettings(): Promise<Settings | undefined>;
  createSettings(data: InsertSettings): Promise<Settings>;
  updateSettings(id: number, data: Partial<InsertSettings>): Promise<Settings>;
  
  getMaterialSuppliers(materialId: number): Promise<any[]>;
  createMaterialSupplier(data: InsertMaterialSupplier): Promise<MaterialSupplier>;
  deleteMaterialSupplier(id: number): Promise<void>;
  
  getStatistics(): Promise<any>;
  generateRFQNumber(): Promise<string>;
  
  // PHASE 2: Deals Management
  getDeals(): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  createDeal(data: InsertDeal): Promise<Deal>;
  updateDeal(id: number, data: Partial<InsertDeal>): Promise<Deal>;
  deleteDeal(id: number): Promise<void>;
  
  // PHASE 2: Projects Management
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // PHASE 2: Project Phases
  getProjectPhases(projectId: number): Promise<ProjectPhase[]>;
  createProjectPhase(data: InsertProjectPhase): Promise<ProjectPhase>;
  updateProjectPhase(id: number, data: Partial<InsertProjectPhase>): Promise<ProjectPhase>;
  deleteProjectPhase(id: number): Promise<void>;
  
  // PHASE 2: Project RFQs
  getProjectRfqs(projectId: number): Promise<ProjectRfq[]>;
  createProjectRfq(data: InsertProjectRfq): Promise<ProjectRfq>;
  deleteProjectRfq(id: number): Promise<void>;
  
  // PHASE 2: District-based supplier matching
  getSuppliersByDistrict(district: string): Promise<Supplier[]>;
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByWhatsapp(whatsapp: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.whatsapp, whatsapp));
    return client || undefined;
  }

  async createClient(data: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(data).returning();
    return client;
  }

  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client> {
    const [client] = await db.update(clients).set(data).where(eq(clients.id, id)).returning();
    return client;
  }

  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials).orderBy(materials.nameEn);
  }

  async getActiveMaterials(): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.active, true)).orderBy(materials.nameEn);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material || undefined;
  }

  async createMaterial(data: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values(data).returning();
    return material;
  }

  async updateMaterial(id: number, data: Partial<InsertMaterial>): Promise<Material> {
    const [material] = await db.update(materials).set(data).where(eq(materials.id, id)).returning();
    return material;
  }

  async deleteMaterial(id: number): Promise<void> {
    await db.delete(materials).where(eq(materials.id, id));
  }

  async getRFQs(): Promise<RFQ[]> {
    return await db.select().from(rfqs).orderBy(desc(rfqs.createdAt));
  }

  async getRFQ(id: number): Promise<RFQ | undefined> {
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    return rfq || undefined;
  }

  async getRFQByNumber(rfqNumber: string): Promise<RFQ | undefined> {
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.rfqNumber, rfqNumber));
    return rfq || undefined;
  }

  async getRFQsByClient(clientPhone: string): Promise<RFQ[]> {
    return await db.select().from(rfqs).where(eq(rfqs.clientPhone, clientPhone)).orderBy(desc(rfqs.createdAt));
  }

  async createRFQ(data: InsertRFQ): Promise<RFQ> {
    const [rfq] = await db.insert(rfqs).values(data).returning();
    return rfq;
  }

  async updateRFQ(id: number, data: Partial<InsertRFQ>): Promise<RFQ> {
    const updatedData = { ...data, updatedAt: new Date() };
    const [rfq] = await db.update(rfqs).set(updatedData).where(eq(rfqs.id, id)).returning();
    return rfq;
  }

  async deleteRFQ(id: number): Promise<void> {
    // Delete related records first to avoid foreign key constraint violations
    await db.delete(quotes).where(eq(quotes.rfqId, id));
    await db.delete(leads).where(eq(leads.rfqId, id));
    await db.delete(rfqItems).where(eq(rfqItems.rfqId, id));
    await db.delete(rfqs).where(eq(rfqs.id, id));
  }

  async getRFQItems(rfqId: number): Promise<RFQItem[]> {
    return await db.select().from(rfqItems).where(eq(rfqItems.rfqId, rfqId));
  }

  async createRFQItem(data: InsertRFQItem): Promise<RFQItem> {
    const [item] = await db.insert(rfqItems).values(data).returning();
    return item;
  }

  async updateRFQItem(id: number, data: Partial<InsertRFQItem>): Promise<RFQItem> {
    const [item] = await db.update(rfqItems).set(data).where(eq(rfqItems.id, id)).returning();
    return item;
  }

  async deleteRFQItem(id: number): Promise<void> {
    await db.delete(rfqItems).where(eq(rfqItems.id, id));
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values(data).returning();
    return supplier;
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier> {
    const [supplier] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return supplier;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async getQuotes(rfqId: number): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.rfqId, rfqId));
  }

  async createQuote(data: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(data).returning();
    return quote;
  }

  async updateQuote(id: number, data: Partial<InsertQuote>): Promise<Quote> {
    const [quote] = await db.update(quotes).set(data).where(eq(quotes.id, id)).returning();
    return quote;
  }

  async deleteQuote(id: number): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadByRFQ(rfqId: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.rfqId, rfqId));
    return lead || undefined;
  }

  async createLead(data: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(data).returning();
    return lead;
  }

  async updateLead(id: number, data: Partial<InsertLead>): Promise<Lead> {
    const updatedData = { ...data, updatedAt: new Date() };
    const [lead] = await db.update(leads).set(updatedData).where(eq(leads.id, id)).returning();
    return lead;
  }

  async deleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).limit(1);
    return setting || undefined;
  }

  async createSettings(data: InsertSettings): Promise<Settings> {
    const [setting] = await db.insert(settings).values(data).returning();
    return setting;
  }

  async updateSettings(id: number, data: Partial<InsertSettings>): Promise<Settings> {
    const updatedData = { ...data, updatedAt: new Date() };
    const [setting] = await db.update(settings).set(updatedData).where(eq(settings.id, id)).returning();
    return setting;
  }

  async getMaterialSuppliers(materialId: number): Promise<any[]> {
    const result = await db
      .select({
        id: materialSuppliers.id,
        materialId: materialSuppliers.materialId,
        supplierId: materialSuppliers.supplierId,
        supplierPrice: materialSuppliers.supplierPrice,
        supplierPosition: materialSuppliers.supplierPosition,
        supplierName: suppliers.name,
        supplierCompany: suppliers.company,
        supplierContact: suppliers.contact,
      })
      .from(materialSuppliers)
      .leftJoin(suppliers, eq(materialSuppliers.supplierId, suppliers.id))
      .where(eq(materialSuppliers.materialId, materialId))
      .orderBy(materialSuppliers.supplierPosition);
    
    return result;
  }

  async createMaterialSupplier(data: InsertMaterialSupplier): Promise<MaterialSupplier> {
    const [materialSupplier] = await db.insert(materialSuppliers).values(data).returning();
    return materialSupplier;
  }

  async deleteMaterialSupplier(id: number): Promise<void> {
    await db.delete(materialSuppliers).where(eq(materialSuppliers.id, id));
  }

  async getStatistics(): Promise<any> {
    const [totalClientsResult] = await db.select({ count: count() }).from(clients);
    const [totalRFQsResult] = await db.select({ count: count() }).from(rfqs);
    const [pendingQuotesResult] = await db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, 'pending'));
    const [completedOrdersResult] = await db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, 'completed'));
    
    const [profitResult] = await db.select({ 
      total: sql<number>`COALESCE(SUM(${rfqs.profit}), 0)` 
    }).from(rfqs).where(eq(rfqs.status, 'completed'));

    const monthlyRFQs = await db
      .select({
        month: sql<string>`TO_CHAR(${rfqs.createdAt}, 'Mon YYYY')`,
        total: count(),
        approved: sql<number>`COUNT(*) FILTER (WHERE ${rfqs.status} = 'completed')`,
      })
      .from(rfqs)
      .groupBy(sql`TO_CHAR(${rfqs.createdAt}, 'Mon YYYY')`)
      .orderBy(sql`MIN(${rfqs.createdAt}) DESC`)
      .limit(6);

    return {
      totalClients: totalClientsResult.count || 0,
      totalRFQs: totalRFQsResult.count || 0,
      pendingQuotes: pendingQuotesResult.count || 0,
      completedOrders: completedOrdersResult.count || 0,
      totalProfit: profitResult.total || 0,
      monthlyRFQs: monthlyRFQs.reverse(),
    };
  }

  async generateRFQNumber(): Promise<string> {
    const allRFQs = await db.select().from(rfqs).orderBy(desc(rfqs.id)).limit(1);
    const lastRFQ = allRFQs[0];
    
    let nextNumber = 1;
    if (lastRFQ && lastRFQ.rfqNumber) {
      const match = lastRFQ.rfqNumber.match(/SOMVI-RFQ-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    return `SOMVI-RFQ-${nextNumber.toString().padStart(4, '0')}`;
  }

  // PHASE 2: Deals Management
  async getDeals(): Promise<Deal[]> {
    return await db.select().from(deals).orderBy(desc(deals.createdAt));
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal || undefined;
  }

  async createDeal(data: InsertDeal): Promise<Deal> {
    const [deal] = await db.insert(deals).values(data).returning();
    return deal;
  }

  async updateDeal(id: number, data: Partial<InsertDeal>): Promise<Deal> {
    const updatedData = { ...data, updatedAt: new Date() };
    const [deal] = await db.update(deals).set(updatedData).where(eq(deals.id, id)).returning();
    return deal;
  }

  async deleteDeal(id: number): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  // PHASE 2: Projects Management
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(data: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project> {
    const updatedData = { ...data, updatedAt: new Date() };
    const [project] = await db.update(projects).set(updatedData).where(eq(projects.id, id)).returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projectPhases).where(eq(projectPhases.projectId, id));
    await db.delete(projectRfqs).where(eq(projectRfqs.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  // PHASE 2: Project Phases
  async getProjectPhases(projectId: number): Promise<ProjectPhase[]> {
    return await db.select().from(projectPhases).where(eq(projectPhases.projectId, projectId)).orderBy(projectPhases.phaseDate);
  }

  async createProjectPhase(data: InsertProjectPhase): Promise<ProjectPhase> {
    const [phase] = await db.insert(projectPhases).values(data).returning();
    return phase;
  }

  async updateProjectPhase(id: number, data: Partial<InsertProjectPhase>): Promise<ProjectPhase> {
    const [phase] = await db.update(projectPhases).set(data).where(eq(projectPhases.id, id)).returning();
    return phase;
  }

  async deleteProjectPhase(id: number): Promise<void> {
    await db.delete(projectPhases).where(eq(projectPhases.id, id));
  }

  // PHASE 2: Project RFQs
  async getProjectRfqs(projectId: number): Promise<ProjectRfq[]> {
    return await db.select().from(projectRfqs).where(eq(projectRfqs.projectId, projectId));
  }

  async createProjectRfq(data: InsertProjectRfq): Promise<ProjectRfq> {
    const [projectRfq] = await db.insert(projectRfqs).values(data).returning();
    return projectRfq;
  }

  async deleteProjectRfq(id: number): Promise<void> {
    await db.delete(projectRfqs).where(eq(projectRfqs.id, id));
  }

  // PHASE 2: District-based supplier matching
  async getSuppliersByDistrict(district: string): Promise<Supplier[]> {
    return await db.select().from(suppliers)
      .where(and(eq(suppliers.district, district), eq(suppliers.status, 'active')))
      .orderBy(suppliers.name);
  }
}

export const storage = new DatabaseStorage();
