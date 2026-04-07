import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";

const createSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(120),
  phoneNumber: z.string().min(7, "Phone number is required").max(20),
  emergencyContact: z.string().max(120).optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const gymId = await requireGymId();
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const where = q
    ? {
        gymId,
        OR: [
          { fullName: { contains: q } },
          { phoneNumber: { contains: q } },
        ],
      }
    : { gymId };

  const members = await prisma.member.findMany({
    where,
    orderBy: { fullName: "asc" },
    take: 100,
    include: {
      subscriptions: {
        orderBy: { endDate: "desc" },
        take: 1,
        include: { plan: true },
      },
    },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const gymId = await requireGymId();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  try {
    const member = await prisma.member.create({
      data: {
        gymId,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        emergencyContact: data.emergencyContact || null,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: { phoneNumber: ["A member with this phone number already exists at your gym"] } },
        { status: 409 }
      );
    }
    throw e;
  }
}
