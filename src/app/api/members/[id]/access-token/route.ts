import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { requireGymId } from "@/lib/auth";

export const runtime = "nodejs";

function generateAccessToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Generates (or rotates) the public access token for a member. The owner
 * can call this to:
 *   - Provision a token for a member created before this feature existed
 *   - Rotate a leaked token (the old link stops working immediately)
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gymId = await requireGymId();
  const { id } = await params;

  // Scoped check
  const existing = await prisma.member.findFirst({ where: { id, gymId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.member.update({
    where: { id },
    data: { accessToken: generateAccessToken() },
    select: { id: true, accessToken: true },
  });

  return NextResponse.json(member);
}
