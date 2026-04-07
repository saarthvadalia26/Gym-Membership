import { CheckInScreen } from "@/components/CheckInScreen";

export default function CheckInPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Member Check-in
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Type a name or phone number to verify membership.
        </p>
      </div>
      <CheckInScreen />
    </div>
  );
}
