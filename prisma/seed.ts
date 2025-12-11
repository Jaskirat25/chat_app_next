import { PrismaClient, Status } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

  // MAIN USER (fixed ID as requested)
  const mainUser = await prisma.user.create({
    data: {
      id: "aff703cc-107f-4b26-8e30-790417253a4a",
      username: "central_user",
      email: "central_user@example.com",
      password: "hashed_pw_central",
      profilePic: null
    }
  });

  // CREATE 4 FRIENDS
  const friends = await prisma.user.createMany({
    data: [
      {
        id: "f1aaaaaa-1111-1111-1111-111111111111",
        username: "friend1",
        email: "friend1@example.com",
        password: "hashed_pw_f1"
      },
      {
        id: "f2bbbbbb-2222-2222-2222-222222222222",
        username: "friend2",
        email: "friend2@example.com",
        password: "hashed_pw_f2"
      },
      {
        id: "f3cccccc-3333-3333-3333-333333333333",
        username: "friend3",
        email: "friend3@example.com",
        password: "hashed_pw_f3"
      },
      {
        id: "f4dddddd-4444-4444-4444-444444444444",
        username: "friend4",
        email: "friend4@example.com",
        password: "hashed_pw_f4"
      }
    ]
  });

  // FETCH FRIEND USERS BACK
  const friendUsers = await prisma.user.findMany({
    where: {
      id: {
        in: [
          "f1aaaaaa-1111-1111-1111-111111111111",
          "f2bbbbbb-2222-2222-2222-222222222222",
          "f3cccccc-3333-3333-3333-333333333333",
          "f4dddddd-4444-4444-4444-444444444444"
        ]
      }
    }
  });

  // CREATE FRIENDSHIPS: mainUser <-> each friend
  for (const f of friendUsers) {
    await prisma.friendship.create({
      data: {
        userA: { connect: { id: mainUser.id } },
        userB: { connect: { id: f.id } }
      }
    });
  }

  // CREATE A GROUP CONVERSATION WITH MAIN USER + 2 FRIENDS
  const groupConversation = await prisma.conversation.create({
    data: {
      name: "Test Group Chat",
      isGroup: true,
      members: {
        create: [
          { userId: mainUser.id },
          { userId: friendUsers[0].id },
          { userId: friendUsers[1].id }
        ]
      }
    }
  });

  // CREATE A DIRECT (1-on-1) CONVERSATION
  const directConversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: mainUser.id },
          { userId: friendUsers[2].id }
        ]
      }
    }
  });

  // SEED MESSAGES IN GROUP CONVERSATION
  const msg1 = await prisma.message.create({
    data: {
      content: "Hello group!",
      conversationId: groupConversation.id,
      senderId: mainUser.id,
      receiverId: friendUsers[0].id,
      statuses: {
        create: [
          { status: Status.SENT },
          { status: Status.DELIVERED }
        ]
      }
    }
  });

  const msg2 = await prisma.message.create({
    data: {
      content: "Hey there!",
      conversationId: groupConversation.id,
      senderId: friendUsers[0].id,
      receiverId: mainUser.id,
      statuses: {
        create: [
          { status: Status.SENT },
          { status: Status.DELIVERED },
          { status: Status.READ }
        ]
      }
    }
  });

  // SEED MESSAGES IN DIRECT CONVERSATION
  const dm1 = await prisma.message.create({
    data: {
      content: "Hi, this is a DM.",
      conversationId: directConversation.id,
      senderId: mainUser.id,
      receiverId: friendUsers[2].id,
      statuses: {
        create: [{ status: Status.SENT }]
      }
    }
  });

  const dm2 = await prisma.message.create({
    data: {
      content: "Got your message!",
      conversationId: directConversation.id,
      senderId: friendUsers[2].id,
      receiverId: mainUser.id,
      statuses: {
        create: [
          { status: Status.SENT },
          { status: Status.DELIVERED }
        ]
      }
    }
  });

  console.log("Database seeded successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("SEED ERROR:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
