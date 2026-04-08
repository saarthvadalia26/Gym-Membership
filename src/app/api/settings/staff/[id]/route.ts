import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireOwner();
    const { id } = await params;

    if (id === ctx.userId) {
      return NextResponse.json(
        { error: "You cannot remove yourself. Use Delete Account instead." },
        { status: 400 }
      );
    }

    const result = await prisma.user.deleteMany({
      where: { id, gymId: ctx.gymId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Owner only" }, { status: 403 });
    }
    throw e;
  }
}
