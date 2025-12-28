import prisma from "@/lib/prisma";

async function main() {
  console.log("🌱 Seeding friendship...");

  const userA = "1c6bd462-d8ce-4a78-adcb-840a210592e8";
  const userB = "f22245ce-6948-4f86-8ebd-1cb7c64f03d3";

  // Optional: prevent duplicate friendship
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: userA, user2Id: userB },
        { user1Id: userB, user2Id: userA },
      ],
    },
  });

  if (existing) {
    console.log("⚠️ Friendship already exists");
    return;
  }

  await prisma.friendship.create({
    data: {
      user1Id: userA,
      user2Id: userB,
    },
  });

  console.log("✅ Friendship created successfully");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding friendship:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
