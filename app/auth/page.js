"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Mail, PawPrint } from "lucide-react";
import { toast } from "sonner";

const CODE_LENGTH = 6;

// Six separate digit boxes: numeric keyboard, auto-advance, backspace steps
// back, paste fills the whole code. Submits automatically on the last digit.
function CodeInput({ value, onChange, onComplete, disabled }) {
  const refs = useRef([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] || "");

  const commit = (next) => {
    const clean = next.slice(0, CODE_LENGTH);
    onChange(clean);
    if (clean.length === CODE_LENGTH) onComplete(clean);
  };

  const handleChange = (i, raw) => {
    const ch = raw.replace(/\D/g, "");
    if (!ch) return;
    const next = value.slice(0, i) + ch + value.slice(i + ch.length);
    commit(next);
    const focusIdx = Math.min(i + ch.length, CODE_LENGTH - 1);
    refs.current[focusIdx]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted) commit(pasted);
  };

  return (
    // OTP digits always flow left-to-right, matching how the number reads
    <div dir="ltr" className="flex justify-center gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={CODE_LENGTH}
          value={d}
          disabled={disabled}
          autoFocus={i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`digit ${i + 1}`}
          className="h-14 w-11 rounded-btn border border-line bg-surface text-center text-h2 font-bold tabular-nums text-ink
                     outline-none transition-colors disabled:opacity-50
                     focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
        />
      ))}
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email");

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
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email });
    setIsLoading(false);
    if (error) {
      const waitSec = error.message?.match(/after (\d+) seconds/)?.[1];
      toast.error(waitSec ? t("auth.rateLimited", { n: waitSec }) : t("auth.sendFailed"));
    } else {
      toast.success(t("auth.checkEmail"));
      setStep("code");
    }
  };

  const handleVerifyCode = async (fullCode) => {
    const token = (fullCode ?? code).trim();
    if (token.length < CODE_LENGTH || isLoading) return;
    setIsLoading(true);
    const { error } = await supabaseBrowser().auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    setIsLoading(false);
    if (error) {
      toast.error(t("auth.verifyFailed"));
      setCode("");
    } else {
      router.push("/onboard");
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
      <div className="flex flex-col items-center gap-3">
        <span className="blob flex h-16 w-16 items-center justify-center bg-accent text-accent-fg shadow-card">
          <PawPrint size={32} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <h1 className="text-h1">{t("app.name")}</h1>
        <p className="text-sub text-ink2">{t("app.tagline")}</p>
      </div>

      {step === "email" ? (
        <>
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
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyCode();
          }}
          className="w-full space-y-4"
        >
          <p className="text-center text-body text-ink2">{t("auth.enterCode")}</p>
          <CodeInput
            value={code}
            onChange={setCode}
            onComplete={handleVerifyCode}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || code.length < CODE_LENGTH}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-btn bg-accent px-4 text-body font-bold text-accent-fg
                       disabled:opacity-70 transition-transform duration-150 active:scale-[0.97]"
          >
            {t("auth.verifyCode")}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
            }}
            disabled={isLoading}
            className="w-full text-center text-cap text-ink2 underline"
          >
            {t("auth.changeEmail")}
          </button>
        </form>
      )}
    </div>
  );
}
