import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seeds an initial gym + admin user for development. In production, gym
 * owners self-register at /register, so this is only useful for fresh
 * local databases.
 */
async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding"
    );
  }

  // Idempotent: skip entirely if this user already exists
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`• Admin user already exists: ${adminEmail} — skipping`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const gym = await prisma.gym.create({
    data: {
      name: process.env.GYM_NAME ?? "My Gym",
      address: process.env.GYM_ADDRESS ?? null,
      phone: process.env.GYM_PHONE ?? null,
    },
  });
  console.log(`✓ Created gym: ${gym.name}`);

  await prisma.user.create({
    data: { email: adminEmail, passwordHash, gymId: gym.id },
  });
  console.log(`✓ Created admin user: ${adminEmail}`);

  await prisma.plan.createMany({
    data: [
      { gymId: gym.id, name: "Monthly", pricePaise: 150000, durationDays: 30 },
      { gymId: gym.id, name: "Quarterly", pricePaise: 400000, durationDays: 90 },
      { gymId: gym.id, name: "Yearly", pricePaise: 1400000, durationDays: 365 },
    ],
  });
  console.log("✓ Seeded 3 default plans");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
