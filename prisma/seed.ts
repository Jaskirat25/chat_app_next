import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user1Id = "aff703cc-107f-4b26-8e30-790417253a4a";
  const user2Id = "f22245ce-6948-4f86-8ebd-1cb7c64f03d3";

  // 1️⃣ Ensure users exist
  const user1 = await prisma.user.upsert({
    where: { id: user1Id },
    update: {},
    create: {
      id: user1Id,
      username: "user_one",
      email: "user1@example.com",
      password: "hashed_password_1",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { id: user2Id },
    update: {},
    create: {
      id: user2Id,
      username: "user_two",
      email: "user2@example.com",
      password: "hashed_password_2",
    },
  });

  // 2️⃣ Check if friendship already exists (either direction)
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: user1.id, user2Id: user2.id },
        { user1Id: user2.id, user2Id: user1.id },
      ],
    },
  });

  // 3️⃣ Create friendship if not exists
  if (!existingFriendship) {
    await prisma.friendship.create({
      data: {
        user1Id: user1.id,
        user2Id: user2.id,
      },
    });

    console.log("Friendship created successfully");
  } else {
    console.log("Friendship already exists");
  }
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
