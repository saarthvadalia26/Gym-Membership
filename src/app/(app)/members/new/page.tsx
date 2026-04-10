import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MemberForm } from "@/components/MemberForm";

export default function NewMemberPage() {
  return (
    <div className="animate-fade-in">
      <Link
        href="/members"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition"
      >
        <ArrowLeft size={14} /> Back to members
      </Link>
      <h1 className="text-3xl font-bold text-slate-100 mb-6 tracking-tight">
        New Member
      </h1>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-soft p-6">
        <MemberForm mode="create" />
      </div>
    </div>
  );
}
