import type { Express } from "express";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  insertMaterialSchema, 
  insertRFQSchema, 
  insertRFQItemSchema,
  insertSupplierSchema,
  insertQuoteSchema,
  insertLeadSchema,
  insertSettingsSchema,
  insertMaterialSupplierSchema,
  insertUserSchema,
  insertDealSchema,
  insertProjectSchema,
  insertProjectPhaseSchema,
  insertProjectRfqSchema
} from "@shared/schema";
import { hashPassword, verifyPassword, generateToken, requireAuth, requireRole } from "./auth";
import { sortSuppliersByPriority, calculateSomviPrice } from "./supplier-logic";

export function registerRoutes(app: Express) {
  
  // Authentication Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, user.password);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email!,
        role: user.role,
      });

      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Users Management Routes (Admin only)
  app.get("/api/users", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const ALLOWED_ROLES = ['admin', 'assistant', 'sales', 'procurement', 'logistics'];
      
      const validatedData = insertUserSchema.parse(req.body);
      
      // Validate role
      if (!ALLOWED_ROLES.includes(validatedData.role)) {
        return res.status(400).json({ error: "Invalid role. Allowed roles: " + ALLOWED_ROLES.join(', ') });
      }
      
      // Check for duplicate email
      if (validatedData.email) {
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser) {
          return res.status(400).json({ error: "A user with this email already exists" });
        }
      }
      
      if (validatedData.password) {
        validatedData.password = await hashPassword(validatedData.password);
      }
      
      const user = await storage.createUser(validatedData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const ALLOWED_ROLES = ['admin', 'assistant', 'sales', 'procurement', 'logistics'];
      const ALLOWED_FIELDS = ['name', 'email', 'password', 'role'];
      
      const id = parseInt(req.params.id);
      
      // Filter out non-allowed fields
      const updates: any = {};
      for (const key of Object.keys(req.body)) {
        if (ALLOWED_FIELDS.includes(key)) {
          updates[key] = req.body[key];
        }
      }
      
      // Validate role if provided
      if (updates.role && !ALLOWED_ROLES.includes(updates.role)) {
        return res.status(400).json({ error: "Invalid role. Allowed roles: " + ALLOWED_ROLES.join(', ') });
      }
      
      // Check for duplicate email if email is being updated
      if (updates.email) {
        const existingUser = await storage.getUserByEmail(updates.email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: "A user with this email already exists" });
        }
      }
      
      // Hash password if provided
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }
      
      // Validate partial schema
      const partialSchema = insertUserSchema.partial();
      const validatedUpdates = partialSchema.parse(updates);
      
      const user = await storage.updateUser(id, validatedUpdates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(400).json({ error: "Failed to delete user" });
    }
  });
  
  app.get("/api/materials", async (req, res) => {
    try {
      const materials = await storage.getActiveMaterials();
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.get("/api/materials/all", async (req, res) => {
    try {
      const materials = await storage.getMaterials();
      res.json(materials);
    } catch (error) {
      console.error("Error fetching all materials:", error);
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const validatedData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(validatedData);
      res.json(material);
    } catch (error) {
      console.error("Error creating material:", error);
      res.status(400).json({ error: "Failed to create material" });
    }
  });

  app.patch("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.updateMaterial(id, req.body);
      res.json(material);
    } catch (error) {
      console.error("Error updating material:", error);
      res.status(400).json({ error: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaterial(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(400).json({ error: "Failed to delete material" });
    }
  });

  app.get("/api/rfqs", async (req, res) => {
    try {
      const { clientPhone } = req.query;
      let rfqs;
      
      // Get RFQs filtered by client phone if provided
      if (clientPhone) {
        rfqs = await storage.getRFQsByClient(clientPhone as string);
      } else {
        rfqs = await storage.getRFQs();
      }
      
      // Fetch client and items for each RFQ
      const rfqsWithDetails = await Promise.all(
        rfqs.map(async (rfq) => {
          // Safely fetch client data if clientId exists
          const client = rfq.clientId ? await storage.getClient(rfq.clientId) : null;
          const items = await storage.getRFQItems(rfq.id);
          return {
            ...rfq,
            client,
            items,
          };
        })
      );
      
      res.json(rfqsWithDetails);
    } catch (error) {
      console.error("Error fetching RFQs:", error);
      res.status(500).json({ error: "Failed to fetch RFQs" });
    }
  });

  app.get("/api/rfqs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rfq = await storage.getRFQ(id);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }
      const items = await storage.getRFQItems(id);
      res.json({ ...rfq, items });
    } catch (error) {
      console.error("Error fetching RFQ:", error);
      res.status(500).json({ error: "Failed to fetch RFQ" });
    }
  });

  app.post("/api/rfqs", async (req, res) => {
    try {
      const rfqNumber = await storage.generateRFQNumber();
      const validatedRFQ = insertRFQSchema.parse({
        ...req.body,
        rfqNumber,
        status: 'pending',
      });
      
      const rfq = await storage.createRFQ(validatedRFQ);
      
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          const validatedItem = insertRFQItemSchema.parse({
            ...item,
            rfqId: rfq.id,
          });
          await storage.createRFQItem(validatedItem);
        }
      }
      
      // Auto-create lead from RFQ
      const client = rfq.clientId ? await storage.getClient(rfq.clientId) : null;
      const items = await storage.getRFQItems(rfq.id);
      
      await storage.createLead({
        rfqId: rfq.id,
        clientId: rfq.clientId || null,
        leadSource: 'from_rfq',
        stage: 'new_request',
        contractorName: client?.name || null,
        contractorWhatsapp: client?.whatsapp || null,
        projectName: rfq.projectName || null,
        materials: items.length > 0 ? JSON.stringify(items.map(i => i.materialName)) : null,
        estimatedValue: rfq.totalAmount?.toString() || null,
        notes: `Auto-created from RFQ ${rfq.rfqNumber}`,
      });
      res.json({ ...rfq, items });
    } catch (error) {
      console.error("Error creating RFQ:", error);
      res.status(400).json({ error: "Failed to create RFQ" });
    }
  });

  app.patch("/api/rfqs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rfq = await storage.updateRFQ(id, req.body);
      
      // Auto-sync lead stage when RFQ status changes
      if (req.body.status) {
        const leads = await storage.getLeads();
        const relatedLead = leads.find(lead => lead.rfqId === id);
        if (relatedLead) {
          const statusToStage: Record<string, string> = {
            'pending': 'new_request',
            'quoted': 'contractor_review',
            'completed': 'completed',
          };
          const newStage = statusToStage[req.body.status];
          if (newStage && newStage !== relatedLead.stage) {
            await storage.updateLead(relatedLead.id, { stage: newStage });
          }
        }
      }
      
      res.json(rfq);
    } catch (error) {
      console.error("Error updating RFQ:", error);
      res.status(400).json({ error: "Failed to update RFQ" });
    }
  });

  app.post("/api/rfqs/:id/add-material", async (req, res) => {
    try {
      const rfqId = parseInt(req.params.id);
      const { materialId, quantity } = req.body;

      if (!materialId || !quantity) {
        return res.status(400).json({ error: "Material ID and quantity are required" });
      }

      // Get the material details
      const material = await storage.getMaterial(materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Create the new RFQ item
      const newItem = await storage.createRFQItem({
        rfqId,
        materialId,
        materialName: material.nameEn,
        quantity,
        unit: material.unit,
        supplierPrices: null,
      });

      // Get the updated RFQ with all items
      const rfq = await storage.getRFQ(rfqId);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }

      const allItems = await storage.getRFQItems(rfqId);

      // Note: Totals will need to be manually updated by admin after setting supplier prices
      // Preserve existing totals instead of resetting to 0
      // The admin can update pricing and totals through the edit interface

      res.json({ 
        message: "Material added successfully. Update supplier prices to recalculate totals.",
        rfq,
        items: allItems,
        newItem,
      });
    } catch (error) {
      console.error("Error adding material to RFQ:", error);
      res.status(400).json({ error: "Failed to add material to RFQ" });
    }
  });

  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients/register-or-find", async (req, res) => {
    try {
      const { name, whatsapp, company } = req.body;
      
      if (!name || !whatsapp) {
        return res.status(400).json({ error: "Name and WhatsApp are required" });
      }
      
      const existingClient = await storage.getClientByWhatsapp(whatsapp);
      if (existingClient) {
        return res.json(existingClient);
      }
      
      const validatedData = insertClientSchema.parse({ name, whatsapp, company });
      const client = await storage.createClient(validatedData);
      res.json(client);
    } catch (error) {
      console.error("Error registering/finding client:", error);
      res.status(400).json({ error: "Failed to register client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ error: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.updateClient(id, req.body);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(400).json({ error: "Failed to update client" });
    }
  });

  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(400).json({ error: "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.updateSupplier(id, req.body);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(400).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(400).json({ error: "Failed to delete supplier" });
    }
  });

  app.get("/api/quotes/:rfqId", async (req, res) => {
    try {
      const rfqId = parseInt(req.params.rfqId);
      const quotes = await storage.getQuotes(rfqId);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const validatedData = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(validatedData);
      res.json(quote);
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(400).json({ error: "Failed to create quote" });
    }
  });

  app.get("/api/leads", requireAuth, async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", requireAuth, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(400).json({ error: "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.updateLead(id, req.body);
      
      // Sales personnel can move leads through stages independently
      // RFQ status is NOT updated when lead stage changes
      // This allows sales to manage pipeline without affecting procurement work
      
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(400).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(400).json({ error: "Failed to delete lead" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.createSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error creating settings:", error);
      res.status(400).json({ error: "Failed to create settings" });
    }
  });

  app.patch("/api/settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const settings = await storage.updateSettings(id, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  app.delete("/api/rfqs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRFQ(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting RFQ:", error);
      res.status(400).json({ error: "Failed to delete RFQ" });
    }
  });

  // Create quotation with supplier prices (supports multiple suppliers)
  app.post("/api/rfqs/:id/quotes", requireAuth, async (req, res) => {
    try {
      const rfqId = parseInt(req.params.id);
      const { items, deliveryFee, taxRate, taxAmount, subtotal, profit, totalAmount } = req.body;

      // Validate all items have at least supplier1 with valid price
      const invalidItems = items.filter((item: any) => {
        if (!item.supplierPrices || !item.supplierPrices.supplier1) return true;
        const supplier1 = item.supplierPrices.supplier1;
        return !supplier1.supplierId || !supplier1.unitPrice || supplier1.unitPrice <= 0;
      });

      if (invalidItems.length > 0) {
        return res.status(400).json({ 
          error: "All materials must have at least Supplier 1 with a valid price" 
        });
      }

      // Save multi-supplier pricing and create quote records
      for (const item of items) {
        const { supplierPrices, suppliersToShow } = item;
        
        // Create quote records for each supplier
        for (const key of ['supplier1', 'supplier2', 'supplier3', 'supplier4', 'supplier5']) {
          const supplierData = supplierPrices[key];
          if (supplierData && supplierData.supplierId && supplierData.unitPrice > 0) {
            await storage.createQuote({
              rfqId,
              supplierId: supplierData.supplierId,
              price: supplierData.unitPrice.toString(),
              notes: `${key.charAt(0).toUpperCase() + key.slice(1)} price for item ${item.itemId}`,
            });
          }
        }

        // Update RFQ item with all supplier prices and metadata
        await storage.updateRFQItem(item.itemId, {
          supplierPrices: JSON.stringify({
            ...supplierPrices,
            suppliersToShow: suppliersToShow || 1,
          }),
        });
      }

      // Update RFQ with totals and mark as quoted
      await storage.updateRFQ(rfqId, {
        totalAmount: totalAmount.toString(),
        deliveryFee: deliveryFee.toString(),
        taxAmount: taxAmount.toString(),
        profit: profit.toString(),
        status: 'quoted',
      });

      // Auto-update lead stage when quote is created
      const leads = await storage.getLeads();
      const relatedLead = leads.find(lead => lead.rfqId === rfqId);
      if (relatedLead) {
        await storage.updateLead(relatedLead.id, {
          stage: 'quotes_received',
          estimatedValue: totalAmount.toString(),
        });
      }

      res.json({ success: true, message: "Quotation created successfully" });
    } catch (error) {
      console.error("Error creating quotation:", error);
      res.status(400).json({ error: "Failed to create quotation" });
    }
  });

  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.get("/api/materials/:materialId/suppliers", async (req, res) => {
    try {
      const materialId = parseInt(req.params.materialId);
      const suppliers = await storage.getMaterialSuppliers(materialId);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching material suppliers:", error);
      res.status(500).json({ error: "Failed to fetch material suppliers" });
    }
  });

  app.post("/api/materials/:materialId/suppliers", async (req, res) => {
    try {
      const materialId = parseInt(req.params.materialId);
      const validatedData = insertMaterialSupplierSchema.parse({
        ...req.body,
        materialId,
      });
      const materialSupplier = await storage.createMaterialSupplier(validatedData);
      res.json(materialSupplier);
    } catch (error) {
      console.error("Error assigning supplier to material:", error);
      res.status(400).json({ error: "Failed to assign supplier" });
    }
  });

  app.delete("/api/material-suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaterialSupplier(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing material supplier:", error);
      res.status(400).json({ error: "Failed to remove supplier assignment" });
    }
  });

  // PHASE 2: Deals Routes
  app.get("/api/deals", requireAuth, async (req, res) => {
    try {
      const deals = await storage.getDeals();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/broadcast", async (req, res) => {
    try {
      const allDeals = await storage.getDeals();
      const now = new Date();
      const activeDeals = allDeals.filter(
        deal => deal.broadcast && 
        deal.status === 'active' && 
        new Date(deal.validFrom) <= now && 
        new Date(deal.validTo) >= now
      );
      res.json(activeDeals);
    } catch (error) {
      console.error("Error fetching broadcast deals:", error);
      res.status(500).json({ error: "Failed to fetch broadcast deals" });
    }
  });

  app.post("/api/deals", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validatedData);
      res.json(deal);
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(400).json({ error: "Failed to create deal" });
    }
  });

  app.patch("/api/deals/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingDeal = await storage.getDeal(id);
      if (!existingDeal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      const validatedData = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(id, validatedData);
      res.json(deal);
    } catch (error) {
      console.error("Error updating deal:", error);
      res.status(400).json({ error: "Failed to update deal" });
    }
  });

  app.patch("/api/deals/:id/broadcast", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingDeal = await storage.getDeal(id);
      if (!existingDeal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      const { broadcast } = req.body;
      if (typeof broadcast !== 'boolean') {
        return res.status(400).json({ error: "Invalid broadcast value" });
      }
      const deal = await storage.updateDeal(id, { broadcast });
      res.json(deal);
    } catch (error) {
      console.error("Error toggling deal broadcast:", error);
      res.status(400).json({ error: "Failed to toggle broadcast" });
    }
  });

  app.delete("/api/deals/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingDeal = await storage.getDeal(id);
      if (!existingDeal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      await storage.deleteDeal(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(400).json({ error: "Failed to delete deal" });
    }
  });

  // PHASE 2: Projects Routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      await storage.deleteProject(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(400).json({ error: "Failed to delete project" });
    }
  });

  // PHASE 2: Project Phases Routes
  app.get("/api/projects/:projectId/phases", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const phases = await storage.getProjectPhases(projectId);
      res.json(phases);
    } catch (error) {
      console.error("Error fetching project phases:", error);
      res.status(500).json({ error: "Failed to fetch project phases" });
    }
  });

  app.post("/api/projects/:projectId/phases", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const validatedData = insertProjectPhaseSchema.parse({ ...req.body, projectId });
      const phase = await storage.createProjectPhase(validatedData);
      res.json(phase);
    } catch (error) {
      console.error("Error creating project phase:", error);
      res.status(400).json({ error: "Failed to create project phase" });
    }
  });

  app.patch("/api/project-phases/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProjectPhaseSchema.partial().parse(req.body);
      const phase = await storage.updateProjectPhase(id, validatedData);
      if (!phase) {
        return res.status(404).json({ error: "Project phase not found" });
      }
      res.json(phase);
    } catch (error) {
      console.error("Error updating project phase:", error);
      res.status(400).json({ error: "Failed to update project phase" });
    }
  });

  app.delete("/api/project-phases/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const phases = await storage.getProjectPhases(0); 
      await storage.deleteProjectPhase(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project phase:", error);
      res.status(400).json({ error: "Failed to delete project phase" });
    }
  });

  // PHASE 2: Project RFQs Routes
  app.get("/api/projects/:projectId/rfqs", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const projectRfqs = await storage.getProjectRfqs(projectId);
      res.json(projectRfqs);
    } catch (error) {
      console.error("Error fetching project RFQs:", error);
      res.status(500).json({ error: "Failed to fetch project RFQs" });
    }
  });

  app.post("/api/projects/:projectId/rfqs", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { rfqId } = req.body;
      const validatedData = insertProjectRfqSchema.parse({ projectId, rfqId });
      const projectRfq = await storage.createProjectRfq(validatedData);
      res.json(projectRfq);
    } catch (error) {
      console.error("Error linking RFQ to project:", error);
      res.status(400).json({ error: "Failed to link RFQ to project" });
    }
  });

  app.delete("/api/project-rfqs/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProjectRfq(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unlinking RFQ from project:", error);
      res.status(400).json({ error: "Failed to unlink RFQ from project" });
    }
  });

  // PHASE 2: District-based Supplier Matching
  app.get("/api/suppliers/district/:district", requireAuth, async (req, res) => {
    try {
      const { district } = req.params;
      const suppliers = await storage.getSuppliersByDistrict(district);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers by district:", error);
      res.status(500).json({ error: "Failed to fetch suppliers by district" });
    }
  });

  // PHASE 3: RFQ Price Update with Market Price Refresh
  app.post("/api/rfqs/:id/update-prices", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rfq = await storage.getRFQ(id);
      
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }

      const items = await storage.getRFQItems(id);
      const newVersion = (rfq.version || 1) + 1;

      // Update each item with latest market prices from materials
      for (const item of items) {
        if (item.materialId) {
          const material = await storage.getMaterial(item.materialId);
          if (material) {
            // Calculate market price from min/max range
            const marketPrice = material.minPrice && material.maxPrice
              ? (parseFloat(material.minPrice.toString()) + parseFloat(material.maxPrice.toString())) / 2
              : null;
            
            await storage.updateRFQItem(item.id, {
              priceVersion: newVersion,
              marketPrice: marketPrice ? marketPrice.toString() : item.marketPrice,
            });
          }
        } else {
          // Non-material items just update version
          await storage.updateRFQItem(item.id, {
            priceVersion: newVersion,
          });
        }
      }

      const updatedRFQ = await storage.updateRFQ(id, {
        version: newVersion,
        lastEditedAt: new Date(),
        updatedAt: new Date(),
        status: 'pending', // Mark for re-quoting
      });

      res.json({ success: true, rfq: updatedRFQ, version: newVersion, message: "Prices updated successfully" });
    } catch (error) {
      console.error("Error updating RFQ prices:", error);
      res.status(400).json({ error: "Failed to update RFQ prices" });
    }
  });
}
