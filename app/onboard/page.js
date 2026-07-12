"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ArrowRight, ArrowLeft, Sparkles, Users, X, Check } from "lucide-react";
import { TaskIcon } from "@/lib/task-icons";
import { toast } from "sonner";

const STEPS = {
  CHOICE: "choice",      // Create or Join
  FAMILY: "family",      // Family name + your name
  PETS: "pets",          // Add pets
  TASKS: "tasks",        // Select task templates
};

export default function OnboardPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [step, setStep] = useState(STEPS.CHOICE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [choice, setChoice] = useState(null); // "create" or "join"
  const [inviteCode, setInviteCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [personName, setPersonName] = useState("");
  const [pets, setPets] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);

  // If already onboarded (has a person row), skip straight to the app.
  useEffect(() => {
    const checkFamily = async () => {
      const { data: { user } } = await supabaseBrowser().auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      const { data: person } = await supabaseBrowser()
        .from("persons")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (person) {
        router.push("/app");
        return;
      }
      setIsLoading(false);
    };
    checkFamily();
  }, [router]);

  const handleCreateFamily = async () => {
    if (!familyName.trim() || !personName.trim()) {
      toast.error(t("common.fillAllFields"));
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabaseBrowser().rpc("create_family", {
        family_name: familyName,
        person_name: personName,
      });
      if (error) throw error;
      // Record the language the family was set up in — used later to pick
      // he/en for server-sent push notification text (no session there).
      await supabaseBrowser().from("families").update({ locale }).eq("id", data);
      // Save family_id for next steps
      sessionStorage.setItem("family_id", data);
      setStep(STEPS.PETS);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim() || !personName.trim()) {
      toast.error(t("common.fillAllFields"));
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabaseBrowser().rpc("join_family", {
        code: inviteCode,
        person_name: personName,
      });
      if (error) throw error;
      sessionStorage.setItem("family_id", data);
      setStep(STEPS.PETS);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPet = () => {
    setPets([...pets, { name: "", species: "dog" }]);
  };

  const updatePet = (idx, field, value) => {
    const updated = [...pets];
    updated[idx] = { ...updated[idx], [field]: value };
    setPets(updated);
  };

  const removePet = (idx) => {
    setPets(pets.filter((_, i) => i !== idx));
  };

  const savePetsAndContinue = async () => {
    const familyId = sessionStorage.getItem("family_id");
    if (!familyId) {
      toast.error(t("common.somethingWrong"));
      return;
    }
    const named = pets.filter((p) => p.name.trim());
    setIsSubmitting(true);
    try {
      if (named.length > 0) {
        const { error } = await supabaseBrowser()
          .from("pets")
          .insert(named.map((p) => ({ family_id: familyId, name: p.name.trim(), species: p.species })));
        if (error) throw error;
      }
      setStep(STEPS.TASKS);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sensible defaults per template — editable later from Settings.
  const TASK_TEMPLATES = {
    walks: { label: t("template.walks.label"), icon: "paw", times: ["08:00", "16:00", "20:00"] },
    feeds: { label: t("template.feeds.label"), icon: "utensils", times: ["08:00", "18:00"] },
    meds: { label: t("template.meds.label"), icon: "pill", times: ["09:00"] },
  };

  const finishOnboarding = async () => {
    const familyId = sessionStorage.getItem("family_id");
    if (!familyId) {
      toast.error(t("common.somethingWrong"));
      return;
    }
    setIsSubmitting(true);
    try {
      // Every current family member rotates through the new tasks by default.
      const { data: persons, error: personsErr } = await supabaseBrowser()
        .from("persons")
        .select("id")
        .eq("family_id", familyId);
      if (personsErr) throw personsErr;
      const eligibleIds = (persons || []).map((p) => p.id);

      const rows = selectedTasks.map((id, idx) => ({
        family_id: familyId,
        label: TASK_TEMPLATES[id].label,
        icon: TASK_TEMPLATES[id].icon,
        times: TASK_TEMPLATES[id].times,
        eligible_ids: eligibleIds,
        track_fairness: true,
        sort_order: idx,
      }));
      const { error } = await supabaseBrowser().from("tasks").insert(rows);
      if (error) throw error;

      sessionStorage.removeItem("family_id");
      router.push("/app");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-dvh items-center justify-center">{t("common.loading")}</div>;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10 pb-safe-b">
      {/* Progress indicator */}
      <div className="mb-8 flex gap-2">
        {[STEPS.CHOICE, STEPS.FAMILY, STEPS.PETS, STEPS.TASKS].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-pill transition-colors ${
              s === step
                ? "bg-accent"
                : [STEPS.CHOICE, STEPS.FAMILY, STEPS.PETS, STEPS.TASKS].indexOf(
                    s
                  ) < [STEPS.CHOICE, STEPS.FAMILY, STEPS.PETS, STEPS.TASKS].indexOf(step)
                ? "bg-success"
                : "bg-line"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Create or Join */}
      {step === STEPS.CHOICE && (
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div>
            <h1 className="text-h1 mb-2">{t("onboard.title")}</h1>
            <p className="text-body text-ink2">{t("onboard.subtitle")}</p>
          </div>
          <button
            onClick={() => {
              setChoice("create");
              setStep(STEPS.FAMILY);
            }}
            className="flex items-center gap-4 rounded-tile border-2 border-accent bg-accent/5 px-5 py-4 text-start
                       transition-transform active:scale-[0.97]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-accent text-accent-fg">
              <Sparkles size={22} aria-hidden="true" />
            </span>
            <span className="text-body font-semibold text-accent">{t("onboard.createFamily")}</span>
          </button>
          <button
            onClick={() => {
              setChoice("join");
              setStep(STEPS.FAMILY);
            }}
            className="flex items-center gap-4 rounded-tile border-2 border-line px-5 py-4 text-start
                       transition-transform active:scale-[0.97]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-surface2 text-ink2">
              <Users size={22} aria-hidden="true" />
            </span>
            <span className="text-body font-semibold text-ink">{t("onboard.joinFamily")}</span>
          </button>
        </div>
      )}

      {/* Step 2: Family details */}
      {step === STEPS.FAMILY && (
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div>
            <h2 className="text-h1 mb-2">
              {choice === "create" ? t("onboard.createFamily.title") : t("onboard.joinFamily.title")}
            </h2>
            <p className="text-body text-ink2">
              {choice === "create" ? t("onboard.createFamily.subtitle") : t("onboard.joinFamily.subtitle")}
            </p>
          </div>
          {choice === "create" ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={t("onboard.familyNamePlaceholder")}
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-btn border border-line bg-surface px-4 py-3 text-body
                           disabled:opacity-50 focus-visible:border-accent"
              />
              <input
                type="text"
                placeholder={t("onboard.yourNamePlaceholder")}
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-btn border border-line bg-surface px-4 py-3 text-body
                           disabled:opacity-50 focus-visible:border-accent"
              />
              <button
                onClick={handleCreateFamily}
                disabled={isSubmitting}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-btn bg-accent px-4 text-body font-bold text-accent-fg
                           disabled:opacity-70 active:scale-[0.97]"
              >
                {isSubmitting ? t("onboard.creating") : t("common.next")}
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={t("onboard.invitePlaceholder")}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                disabled={isSubmitting}
                className="w-full rounded-btn border border-line bg-surface px-4 py-3 text-body font-mono
                           disabled:opacity-50 focus-visible:border-accent"
              />
              <input
                type="text"
                placeholder={t("onboard.whoAreYouPlaceholder")}
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-btn border border-line bg-surface px-4 py-3 text-body
                           disabled:opacity-50 focus-visible:border-accent"
              />
              <button
                onClick={handleJoinFamily}
                disabled={isSubmitting}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-btn bg-accent px-4 text-body font-bold text-accent-fg
                           disabled:opacity-70 active:scale-[0.97]"
              >
                {isSubmitting ? t("onboard.verifying") : t("onboard.joinButton")}
                <ArrowRight size={18} />
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setStep(STEPS.CHOICE);
              setChoice(null);
            }}
            className="text-body text-ink2 flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            {t("common.back")}
          </button>
        </div>
      )}

      {/* Step 3: Pets */}
      {step === STEPS.PETS && (
        <div className="flex flex-1 flex-col justify-between gap-6">
          <div>
            <h2 className="text-h1 mb-2">{t("onboard.pets.title")}</h2>
            <p className="text-body text-ink2">{t("onboard.pets.subtitle")}</p>
          </div>
          <div className="space-y-3 flex-1">
            {pets.map((pet, idx) => (
              <div key={idx} className="space-y-2 rounded-btn border border-line bg-surface p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={t("onboard.pets.namePlaceholder")}
                    value={pet.name}
                    onChange={(e) => updatePet(idx, "name", e.target.value)}
                    className="flex-1 rounded-btn bg-surface2 px-3 py-2 text-sub outline-none focus-visible:outline-2 focus-visible:outline-accent"
                  />
                  <button
                    onClick={() => removePet(idx)}
                    aria-label={t("common.remove")}
                    className="rounded-btn p-2 text-danger active:scale-[0.97]"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex gap-2">
                  {[
                    { value: "dog", emoji: "🐕" },
                    { value: "cat", emoji: "🐈" },
                    { value: "other", emoji: "🐾" },
                  ].map((sp) => (
                    <button
                      key={sp.value}
                      type="button"
                      onClick={() => updatePet(idx, "species", sp.value)}
                      aria-pressed={pet.species === sp.value}
                      className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-pill text-sub font-semibold transition-colors active:scale-[0.97] ${
                        pet.species === sp.value
                          ? "bg-accent/10 text-accent ring-2 ring-inset ring-accent"
                          : "bg-surface2 text-ink2"
                      }`}
                    >
                      <span aria-hidden="true">{sp.emoji}</span>
                      {t(`species.${sp.value}`)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={addPet}
              className="w-full rounded-btn border-2 border-dashed border-line px-4 py-3 text-body font-semibold text-ink2
                         transition-colors hover:border-accent hover:text-accent"
            >
              {t("onboard.pets.add")}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(STEPS.FAMILY)}
              className="flex-1 rounded-btn border border-line px-4 py-3 text-body font-semibold text-ink"
            >
              {t("common.back")}
            </button>
            <button
              onClick={savePetsAndContinue}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-btn bg-accent px-4 py-3 text-body font-bold text-accent-fg
                         disabled:opacity-70 active:scale-[0.97]"
            >
              {t("common.next")}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Task templates */}
      {step === STEPS.TASKS && (
        <div className="flex flex-1 flex-col justify-between gap-6">
          <div>
            <h2 className="text-h1 mb-2">{t("onboard.tasks.title")}</h2>
            <p className="text-body text-ink2">{t("onboard.tasks.subtitle")}</p>
          </div>
          <div className="space-y-2 flex-1">
            {[
              { id: "walks", icon: "paw", label: t("onboard.tasks.walks") },
              { id: "feeds", icon: "utensils", label: t("onboard.tasks.feeds") },
              { id: "meds", icon: "pill", label: t("onboard.tasks.meds") },
            ].map((task) => {
              const selected = selectedTasks.includes(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() =>
                    setSelectedTasks(
                      selected
                        ? selectedTasks.filter((t) => t !== task.id)
                        : [...selectedTasks, task.id]
                    )
                  }
                  aria-pressed={selected}
                  className={`flex w-full items-center gap-3 rounded-btn border-2 px-4 py-3 text-start text-body font-semibold transition-colors active:scale-[0.97] ${
                    selected
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line text-ink hover:border-accent/50"
                  }`}
                >
                  <TaskIcon icon={task.icon} size={20} aria-hidden="true" />
                  <span className="flex-1">{task.label}</span>
                  {selected && <Check size={18} strokeWidth={3} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(STEPS.PETS)}
              className="flex-1 rounded-btn border border-line px-4 py-3 text-body font-semibold text-ink"
            >
              {t("common.back")}
            </button>
            <button
              onClick={finishOnboarding}
              disabled={isSubmitting || selectedTasks.length === 0}
              className="flex-1 rounded-btn bg-accent px-4 py-3 text-body font-bold text-accent-fg
                         disabled:opacity-70 active:scale-[0.97]"
            >
              {t("onboard.finish")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
