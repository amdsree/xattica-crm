const { execSync } = require("child_process");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    console.log("[xattica] DATABASE_URL detected. Synchronizing PostgreSQL schema...");
    try {
      execSync("npx prisma db push --skip-generate --accept-data-loss", {
        stdio: "inherit",
        env: { ...process.env },
      });
      console.log("[xattica] Prisma db push succeeded.");
    } catch (e) {
      console.error("[xattica] Schema push warning:", e && e.message ? e.message : e);
    }

    try {
      const prisma = new PrismaClient();
      const count = await prisma.user.count();
      if (count === 0) {
        console.log("[xattica] Empty database detected. Seeding branches and initial users...");
        const branches = await Promise.all([
          prisma.branch.create({
            data: {
              code: "KLM",
              name: "Xattica Kollam",
              phone: "+91 98470 11111",
              address: "Main Road, Near Railway Station, Kollam",
            },
          }),
          prisma.branch.create({
            data: {
              code: "KTM",
              name: "Xattica Kottayam",
              phone: "+91 98470 22222",
              address: "Kanjikuzhy, Kottayam",
            },
          }),
          prisma.branch.create({
            data: {
              code: "COK",
              name: "Xattica Cochin",
              phone: "+91 98470 33333",
              address: "Palarivattom Bypass Junction, Cochin",
            },
          }),
          prisma.branch.create({
            data: {
              code: "CLT",
              name: "Xattica Calicut",
              phone: "+91 98470 44444",
              address: "Mavoor Road, Calicut",
            },
          }),
        ]);

        const adminHash = await bcrypt.hash("admin123", 10);
        const techHash = await bcrypt.hash("tech123", 10);

        await prisma.user.create({
          data: {
            name: "Super Admin",
            username: "admin",
            password: adminHash,
            role: "SUPER_ADMIN",
            branchId: branches[2].id, // COK
            phone: "+91 98470 00000",
          },
        });

        await prisma.user.create({
          data: {
            name: "Rahul Nair (In-house)",
            username: "rahul_ktm",
            password: techHash,
            role: "INHOUSE_TECH",
            branchId: branches[1].id,
            phone: "+91 98470 22001",
          },
        });

        await prisma.user.create({
          data: {
            name: "Suresh Kumar (Chip-Level)",
            username: "suresh_cok",
            password: techHash,
            role: "INHOUSE_TECH",
            branchId: branches[2].id,
            phone: "+91 98470 33001",
          },
        });

        await prisma.user.create({
          data: {
            name: "Anas V (Field Tech)",
            username: "anas_klm",
            password: techHash,
            role: "FIELD_TECH",
            branchId: branches[0].id,
            phone: "+91 98470 11002",
          },
        });

        console.log("[xattica] Seed completed. Login ready: admin / admin123");
      } else {
        console.log(`[xattica] Database already contains ${count} user(s).`);
      }
      await prisma.$disconnect();
    } catch (err) {
      console.error("[xattica] Seed check warning:", err && err.message ? err.message : err);
    }
  } else {
    console.warn("[xattica] Warning: No DATABASE_URL provided.");
  }

  console.log("[xattica] Launching Next.js server on port", process.env.PORT || 3000);
  const serverPath = path.resolve(__dirname, "../server.js");
  require(serverPath);
}

main().catch((err) => {
  console.error("[xattica] Fatal startup failure:", err);
  process.exit(1);
});
