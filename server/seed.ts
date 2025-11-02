import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

async function seedDefaultAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@somvi.so'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Default admin user already exists');
      return;
    }

    // Create default admin user
    const hashedPassword = await hashPassword('somvi123');
    
    await db.insert(users).values({
      name: 'Admin User',
      email: 'admin@somvi.so',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('Default admin user created successfully');
    console.log('Email: admin@somvi.so');
    console.log('Password: somvi123');
  } catch (error) {
    console.error('Error seeding default admin:', error);
  }
}

export { seedDefaultAdmin };
