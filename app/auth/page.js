"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // If already signed in, skip to onboarding or home
    const checkAuth = async () => {
      const { data: { user } } = await supabaseBrowser().auth.getUser();
      if (user) router.push("/onboard");
    };
    checkAuth();
  }, [router]);

  const handleEmailSignup = async () => {
    if (!email.trim()) {
      toast.error(t("auth.enterEmail"));
      return;
    }
    setIsLoading(true);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.checkEmail"));
      setEmail("");
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setIsLoading(false);
    if (error) toast.error(error.message);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-6 pb-safe-b pt-10">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-h1">{t("app.name")}</h1>
        <p className="text-sub text-ink2">{t("app.tagline")}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleEmailSignup();
        }}
        className="w-full space-y-3"
      >
        <input
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="w-full rounded-btn border border-line bg-surface px-4 py-3 text-body outline-none placeholder:text-ink2
                     disabled:opacity-50 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-btn bg-accent px-4 text-body font-bold text-accent-fg
                     disabled:opacity-70 transition-transform duration-150 active:scale-[0.97]"
        >
          <Mail size={18} />
          {t("auth.continueEmail")}
        </button>
      </form>

      <div className="flex w-full gap-2">
        <div className="h-px flex-1 bg-line" />
        <span className="text-cap text-ink2">{t("common.or")}</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <button
        onClick={handleGoogleSignup}
        disabled={isLoading}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-btn border border-line bg-surface px-4 text-body font-semibold text-ink
                   disabled:opacity-70 transition-transform duration-150 active:scale-[0.97]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {t("auth.continueGoogle")}
      </button>

      <p className="text-cap text-center text-ink2">{t("auth.terms")}</p>
    </div>
  );
}
