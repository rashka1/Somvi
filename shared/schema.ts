import { pgTable, serial, text, varchar, integer, timestamp, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  role: varchar('role', { length: 50 }).notNull().default('viewer'),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  whatsapp: varchar('whatsapp', { length: 50 }).notNull().unique(),
  company: varchar('company', { length: 255 }),
  district: varchar('district', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const materials = pgTable('materials', {
  id: serial('id').primaryKey(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameSo: varchar('name_so', { length: 255 }),
  unit: varchar('unit', { length: 50 }),
  unitSo: varchar('unit_so', { length: 50 }),
  category: varchar('category', { length: 100 }).notNull(),
  subcategory: varchar('subcategory', { length: 100 }),
  description: text('description'),
  descriptionSo: text('description_so'),
  imageUrl: text('image_url'),
  active: boolean('active').notNull().default(true),
  minPrice: decimal('min_price', { precision: 10, scale: 2 }),
  maxPrice: decimal('max_price', { precision: 10, scale: 2 }),
  deliveryDays: integer('delivery_days'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  contact: varchar('contact', { length: 255 }),
  whatsapp: varchar('whatsapp', { length: 50 }),
  email: varchar('email', { length: 255 }),
  category: varchar('category', { length: 100 }),
  district: varchar('district', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const rfqs = pgTable('rfqs', {
  id: serial('id').primaryKey(),
  rfqNumber: varchar('rfq_number', { length: 50 }).notNull().unique(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  projectName: varchar('project_name', { length: 255 }).notNull(),
  projectDetails: text('project_details'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }),
  profit: decimal('profit', { precision: 12, scale: 2 }),
  version: integer('version').notNull().default(1),
  lastEditedAt: timestamp('last_edited_at'),
  notes: text('notes'),
  attachedFile: text('attached_file'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const rfqItems = pgTable('rfq_items', {
  id: serial('id').primaryKey(),
  rfqId: integer('rfq_id').references(() => rfqs.id).notNull(),
  materialId: integer('material_id').references(() => materials.id),
  materialName: varchar('material_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 50 }),
  supplierPrices: text('supplier_prices'),
  marketPrice: decimal('market_price', { precision: 10, scale: 2 }),
  priceVersion: integer('price_version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  rfqId: integer('rfq_id').references(() => rfqs.id).notNull(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  leadTime: integer('lead_time'),
  logistics: text('logistics'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id),
  rfqId: integer('rfq_id').references(() => rfqs.id),
  
  // Pipeline stage management
  stage: varchar('stage', { length: 100 }).notNull().default('new_request'),
  leadSource: varchar('lead_source', { length: 50 }).notNull().default('from_rfq'), // 'from_rfq' or 'manual'
  
  // Basic lead info
  contractorName: varchar('contractor_name', { length: 255 }),
  contractorWhatsapp: varchar('contractor_whatsapp', { length: 50 }),
  projectName: varchar('project_name', { length: 255 }),
  location: varchar('location', { length: 255 }),
  materials: text('materials'), // JSON array of materials
  
  // RFQ Sent to Suppliers stage
  supplierNames: text('supplier_names'), // Comma-separated supplier names
  rfqSentDate: timestamp('rfq_sent_date'),
  
  // Supplier Quotes Received stage
  supplierPrices: text('supplier_prices'), // JSON object with supplier pricing
  deliveryTime: integer('delivery_time'), // Days
  logistics: text('logistics'),
  
  // Contractor Review/Confirmation stage
  selectedSupplier: varchar('selected_supplier', { length: 255 }),
  confirmedDate: timestamp('confirmed_date'),
  
  // In Delivery/Logistics stage
  driverName: varchar('driver_name', { length: 255 }),
  truckPlate: varchar('truck_plate', { length: 50 }),
  eta: timestamp('eta'),
  deliveryPhoto: text('delivery_photo'), // URL to delivery photo
  
  // Feedback/Completed stage
  feedback: text('feedback'),
  gmv: decimal('gmv', { precision: 12, scale: 2 }), // Gross Merchandise Value
  commissionPercentage: decimal('commission_percentage', { precision: 5, scale: 2 }),
  
  // General fields
  notes: text('notes'),
  assignedTo: integer('assigned_to').references(() => users.id),
  estimatedValue: decimal('estimated_value', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const materialSuppliers = pgTable('material_suppliers', {
  id: serial('id').primaryKey(),
  materialId: integer('material_id').references(() => materials.id).notNull(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  supplierPrice: decimal('supplier_price', { precision: 10, scale: 2 }),
  supplierPosition: integer('supplier_position').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  companyName: varchar('company_name', { length: 255 }),
  logoUrl: text('logo_url'),
  description: text('description'),
  whatsappNumber: varchar('whatsapp_number', { length: 50 }),
  defaultMarkup: decimal('default_markup', { precision: 5, scale: 2 }),
  markupType: varchar('markup_type', { length: 20 }).default('flat'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// PHASE 2: Deals Management
export const deals = pgTable('deals', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  materialId: integer('material_id').references(() => materials.id),
  discount: decimal('discount', { precision: 5, scale: 2 }).notNull(),
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to').notNull(),
  district: varchar('district', { length: 100 }),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  broadcast: boolean('broadcast').notNull().default(false),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// PHASE 2: Projects Management
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  district: varchar('district', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// PHASE 2: Project Phases
export const projectPhases = pgTable('project_phases', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  phaseName: varchar('phase_name', { length: 255 }).notNull(),
  phaseDate: timestamp('phase_date'),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// PHASE 2: Project RFQs Junction Table
export const projectRfqs = pgTable('project_rfqs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  rfqId: integer('rfq_id').references(() => rfqs.id).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  assignedLeads: many(leads),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  rfqs: many(rfqs),
  leads: many(leads),
  projects: many(projects),
}));

export const materialsRelations = relations(materials, ({ many }) => ({
  rfqItems: many(rfqItems),
  materialSuppliers: many(materialSuppliers),
  deals: many(deals),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  quotes: many(quotes),
  materialSuppliers: many(materialSuppliers),
  deals: many(deals),
}));

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  client: one(clients, {
    fields: [rfqs.clientId],
    references: [clients.id],
  }),
  items: many(rfqItems),
  quotes: many(quotes),
  lead: one(leads),
  projectRfqs: many(projectRfqs),
}));

export const rfqItemsRelations = relations(rfqItems, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [rfqItems.rfqId],
    references: [rfqs.id],
  }),
  material: one(materials, {
    fields: [rfqItems.materialId],
    references: [materials.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [quotes.rfqId],
    references: [rfqs.id],
  }),
  supplier: one(suppliers, {
    fields: [quotes.supplierId],
    references: [suppliers.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  client: one(clients, {
    fields: [leads.clientId],
    references: [clients.id],
  }),
  rfq: one(rfqs, {
    fields: [leads.rfqId],
    references: [rfqs.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
}));

export const materialSuppliersRelations = relations(materialSuppliers, ({ one }) => ({
  material: one(materials, {
    fields: [materialSuppliers.materialId],
    references: [materials.id],
  }),
  supplier: one(suppliers, {
    fields: [materialSuppliers.supplierId],
    references: [suppliers.id],
  }),
}));

// PHASE 2: Relations for new tables
export const dealsRelations = relations(deals, ({ one }) => ({
  material: one(materials, {
    fields: [deals.materialId],
    references: [materials.id],
  }),
  supplier: one(suppliers, {
    fields: [deals.supplierId],
    references: [suppliers.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  phases: many(projectPhases),
  projectRfqs: many(projectRfqs),
}));

export const projectPhasesRelations = relations(projectPhases, ({ one }) => ({
  project: one(projects, {
    fields: [projectPhases.projectId],
    references: [projects.id],
  }),
}));

export const projectRfqsRelations = relations(projectRfqs, ({ one }) => ({
  project: one(projects, {
    fields: [projectRfqs.projectId],
    references: [projects.id],
  }),
  rfq: one(rfqs, {
    fields: [projectRfqs.rfqId],
    references: [rfqs.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertRFQSchema = createInsertSchema(rfqs).omit({ id: true, createdAt: true, updatedAt: true, lastEditedAt: true, version: true });
export const insertRFQItemSchema = createInsertSchema(rfqItems).omit({ id: true, createdAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMaterialSupplierSchema = createInsertSchema(materialSuppliers).omit({ id: true, createdAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, createdAt: true, updatedAt: true });

// PHASE 2: Insert Schemas
export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectPhaseSchema = createInsertSchema(projectPhases).omit({ id: true, createdAt: true });
export const insertProjectRfqSchema = createInsertSchema(projectRfqs).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type RFQ = typeof rfqs.$inferSelect;
export type InsertRFQ = z.infer<typeof insertRFQSchema>;

export type RFQItem = typeof rfqItems.$inferSelect;
export type InsertRFQItem = z.infer<typeof insertRFQItemSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type MaterialSupplier = typeof materialSuppliers.$inferSelect;
export type InsertMaterialSupplier = z.infer<typeof insertMaterialSupplierSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// PHASE 2: Types
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectPhase = typeof projectPhases.$inferSelect;
export type InsertProjectPhase = z.infer<typeof insertProjectPhaseSchema>;

export type ProjectRfq = typeof projectRfqs.$inferSelect;
export type InsertProjectRfq = z.infer<typeof insertProjectRfqSchema>;

// Mogadishu Districts
export const MOGADISHU_DISTRICTS = [
  'Hodan',
  'Wadajir',
  'Hamar Weyne',
  'Hamar Jajab',
  'Shangani',
  'Abdiaziz',
  'Bondhere',
  'Shibis',
  'Karan',
  'Dharkenley',
  'Yaqshid',
  'Daynile',
  'Wardhigley',
  'Howlwadaag',
  'Heliwa',
  'Kahda',
] as const;

export type MogadishuDistrict = typeof MOGADISHU_DISTRICTS[number];
