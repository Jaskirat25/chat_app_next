import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1️⃣ Create Users
  const user1 = await prisma.user.create({
    data: {
      username: "jaskirat",
      email: "jaskirat@example.com",
      password: "hashedpassword1",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: "simran",
      email: "simran@example.com",
      password: "hashedpassword2",
    },
  });

  // 2️⃣ Create a 1–1 Conversation
  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { user: { connect: { id: user1.id } } },
          { user: { connect: { id: user2.id } } },
        ],
      },
    },
  });

  // 3️⃣ Add some messages
  await prisma.message.createMany({
    data: [
      {
        content: "Hey Simran!",
        senderId: user1.id,
        receiverId: user2.id,
        conversationId: conversation.id,
      },
      {
        content: "Hi Jaskirat! What's up?",
        senderId: user2.id,
        receiverId: user1.id,
        conversationId: conversation.id,
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
