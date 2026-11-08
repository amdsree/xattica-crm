import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.jobPart.deleteMany();
  await prisma.jobSheet.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

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

  const [klm, ktm, cok, clt] = branches;

  const adminHashed = await bcrypt.hash("admin123", 10);
  const techHashed = await bcrypt.hash("tech123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      username: "admin",
      password: adminHashed,
      role: "SUPER_ADMIN",
      branchId: cok.id,
      phone: "+91 98470 00000",
    },
  });

  const ktmTech = await prisma.user.create({
    data: {
      name: "Rahul Nair (In-house)",
      username: "rahul_ktm",
      password: techHashed,
      role: "INHOUSE_TECH",
      branchId: ktm.id,
      phone: "+91 98470 22001",
    },
  });

  const cokChipTech = await prisma.user.create({
    data: {
      name: "Suresh Kumar (Chip-Level)",
      username: "suresh_cok",
      password: techHashed,
      role: "INHOUSE_TECH",
      branchId: cok.id,
      phone: "+91 98470 33001",
    },
  });

  const klmFieldTech = await prisma.user.create({
    data: {
      name: "Anas V (Field Tech)",
      username: "anas_klm",
      password: techHashed,
      role: "FIELD_TECH",
      branchId: klm.id,
      phone: "+91 98470 11002",
    },
  });

  const cltManager = await prisma.user.create({
    data: {
      name: "Faisal K (Branch Manager)",
      username: "faisal_clt",
      password: techHashed,
      role: "BRANCH_MANAGER",
      branchId: clt.id,
      phone: "+91 98470 44001",
    },
  });

  await prisma.stockItem.createMany({
    data: [
      {
        branchId: ktm.id,
        partName: "Kingston 500GB NVMe SSD",
        invoiceNumber: "INV-2026-081",
        vendorName: "Fortune Infotech",
        landingPrice: 2450.0,
        quantity: 8,
      },
      {
        branchId: ktm.id,
        partName: "Thermal Grizzly Kryonaut Paste (1g)",
        invoiceNumber: "INV-2026-082",
        vendorName: "Fortune Infotech",
        landingPrice: 380.0,
        quantity: 15,
      },
      {
        branchId: cok.id,
        partName: "Laptop Power IC (ISL88739)",
        invoiceNumber: "INV-2026-044",
        vendorName: "Chipset Electronics",
        landingPrice: 320.0,
        quantity: 20,
      },
    ],
  });

  const customer1 = await prisma.customer.create({
    data: {
      name: "Thomas Mathew",
      phone: "+91 94471 23456",
      address: "Mathew Villa, Baker Junction, Kottayam",
    },
  });

  await prisma.jobSheet.create({
    data: {
      jobNo: "XAT-KTM-061126-0001",
      originBranchId: ktm.id,
      customerId: customer1.id,
      intakeStaffId: ktmTech.id,
      assignedTechId: ktmTech.id,
      deviceType: "Laptop",
      brand: "Lenovo",
      modelNumber: "IdeaPad Gaming 3 15ACH6",
      serialNumber: "MP2184X9",
      physicalCondition: "Minor scratch on bottom lid, all rubber feet intact",
      complaintDescription: "System overheating, fan rattling noise, sudden thermal shutdowns",
      additionalIssues: "Customer requests deep dust cleaning and thermal paste repasting",
      isWarranty: false,
      status: "DIAGNOSIS_WIP",
      estimatedCost: 1200.0,
      estimatedSpareCost: 400.0,
      tatDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      remarks: "Fans opened, bearing inspected, dust clogging heatsink fins",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeding complete with hashed credentials.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
