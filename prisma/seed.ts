import prisma from '../lib/prisma'

async function main() {
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'Test User',
      password: '039487jncsuefh',
    },
  })

  console.log('Database seeded')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
