import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const gymId = (session?.user as { gymId?: string } | undefined)?.gymId;
  if (!gymId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const member = await prisma.member.findFirst({
    where: { id, gymId },
    select: { id: true },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // 24-byte URL-safe base64 string
  const accessToken = crypto.randomBytes(24).toString("base64url");

  await prisma.member.update({
    where: { id: member.id },
    data: { accessToken },
  });

  return NextResponse.json({ ok: true, accessToken });
}
