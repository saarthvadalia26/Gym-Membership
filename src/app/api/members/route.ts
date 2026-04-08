import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";
import {
  generateReferralCode,
  normalizeReferralCode,
} from "@/lib/referral";

function generateAccessToken(): string {
  // 24-byte URL-safe random string — long enough that brute-forcing is infeasible
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Generate a referral code unique within the gym, retrying if there's a
 * collision (extremely rare with the 30-char alphabet × 4 positions).
 */
async function generateUniqueReferralCode(
  gymId: string,
  gymName: string
): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateReferralCode(gymName);
    const existing = await prisma.member.findFirst({
      where: { gymId, referralCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  // Extremely unlikely fallback — append a random character
  return `${generateReferralCode(gymName)}${Math.floor(Math.random() * 10)}`;
}

const createSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(120),
  phoneNumber: z.string().min(7, "Phone number is required").max(20),
  emergencyContact: z.string().max(120).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  referredByCode: z.string().max(40).optional().or(z.literal("")),
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
    // Look up referrer by code if provided
    let referredById: string | null = null;
    if (data.referredByCode && data.referredByCode.length > 0) {
      const code = normalizeReferralCode(data.referredByCode);
      const referrer = await prisma.member.findFirst({
        where: { gymId, referralCode: code },
        select: { id: true },
      });
      if (!referrer) {
        return NextResponse.json(
          {
            error: {
              referredByCode: ["No member found with that referral code"],
            },
          },
          { status: 400 }
        );
      }
      referredById = referrer.id;
    }

    // Get gym name for prefix-based referral code
    const gym = await prisma.gym.findUniqueOrThrow({
      where: { id: gymId },
      select: { name: true },
    });
    const referralCode = await generateUniqueReferralCode(gymId, gym.name);

    const member = await prisma.member.create({
      data: {
        gymId,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        emergencyContact: data.emergencyContact || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        accessToken: generateAccessToken(),
        referralCode,
        referredById,
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
