import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { itemCreateSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const includeDeleted = url.searchParams.get("includeDeleted") === "true";

  const where: any = { userId: user.id };
  if (type) where.type = type;
  if (!includeDeleted) where.deletedAt = null;

  const items = await prisma.item.findMany({
    where,
    orderBy: [{ sortHint: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = itemCreateSchema.parse(await req.json());

  const item = await prisma.item.create({
    data: {
      userId: user.id,
      ...body,
      revisions: {
        create: { title: body.title, content: body.content, tags: body.tags },
      },
    },
  });

  return NextResponse.json(item, { status: 201 });
}
