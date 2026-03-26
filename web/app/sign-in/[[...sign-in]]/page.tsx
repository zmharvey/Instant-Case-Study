import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Instant Case Study</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to generate case studies</p>
        </div>
        <SignIn />
      </div>
    </main>
  );
}
