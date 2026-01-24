import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth";

async function main() {
  const username = process.env.SEED_USERNAME!;
  const password = process.env.SEED_PASSWORD!;

  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });
}

main().then(() => prisma.$disconnect());
