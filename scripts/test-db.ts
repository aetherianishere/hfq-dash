import { prisma } from "@/lib/db";

async function main() {
  console.log("Testing database connection to db.aurex.lk:3306...");

  // Test connection
  const userCount = await prisma.user.count();
  console.log("Users in DB:", userCount);

  const productCount = await prisma.product.count();
  console.log("Products in DB:", productCount);

  const paymentAccountCount = await prisma.paymentAccount.count();
  console.log("Payment accounts in DB:", paymentAccountCount);

  const orderCount = await prisma.order.count();
  console.log("Orders in DB:", orderCount);

  // Check super admin exists
  const admin = await prisma.user.findUnique({
    where: { email: "navidhuadeesha25@gmail.com" },
    select: { id: true, publicId: true, email: true, role: true, emailVerified: true },
  });
  console.log("Super admin:", admin ? `${admin.email} (${admin.publicId}, role: ${admin.role}, verified: ${admin.emailVerified})` : "NOT FOUND");

  // List products
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, active: true },
    take: 5,
  });
  console.log("Sample products:", products.map((p) => `${p.slug} (${p.name}) - ${p.active ? "active" : "archived"}`));

  console.log("SUCCESS: Database connection and data verified!");
}

main().catch((err) => {
  console.error("DB test failed:", err);
  process.exit(1);
});
