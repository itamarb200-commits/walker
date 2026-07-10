"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const STEPS = {
  CHOICE: "choice",      // Create or Join
  FAMILY: "family",      // Family name + your name
  PETS: "pets",          // Add pets
  TASKS: "tasks",        // Select task templates
};

export default function OnboardPage() {
  const router = useRouter();
  const { t } = useI18n();
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
        router.push("/");
        return;
      }
      setIsLoading(false);
    };
    checkFamily();
  }, [router]);

  const handleCreateFamily = async () => {
    if (!familyName.trim() || !personName.trim()) {
      toast.error("שנה את כל השדות");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabaseBrowser().rpc("create_family", {
        family_name: familyName,
        person_name: personName,
      });
      if (error) throw error;
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
      toast.error("שנה את כל השדות");
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
      toast.error("משהו השתבש");
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

  // Sensible defaults per template — edited later from Settings (Phase 5).
  const TASK_TEMPLATES = {
    walks: { label: "טיול", icon: "paw", times: ["08:00", "16:00", "20:00"] },
    feeds: { label: "האכלה", icon: "utensils", times: ["08:00", "18:00"] },
    meds: { label: "תרופה", icon: "pill", times: ["09:00"] },
  };

  const finishOnboarding = async () => {
    const familyId = sessionStorage.getItem("family_id");
    if (!familyId) {
      toast.error("משהו השתבש");
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
      router.push("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-dvh items-center justify-center">טוען...</div>;

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
            <h1 className="text-h1 mb-2">בואו נתחיל</h1>
            <p className="text-body text-ink2">בחרו להקים משפחה חדשה או להצטרף לקיימת</p>
          </div>
          <button
            onClick={() => setChoice("create")}
            className="rounded-btn border-2 border-accent bg-accent/5 px-6 py-4 text-body font-semibold text-accent
                       transition-transform active:scale-[0.97]"
          >
            ✨ צרו משפחה חדשה
          </button>
          <button
            onClick={() => setChoice("join")}
            className="rounded-btn border-2 border-line px-6 py-4 text-body font-semibold text-ink
                       transition-transform active:scale-[0.97]"
          >
            👥 הצטרפו למשפחה קיימת
          </button>
        </div>
      )}

      {/* Step 2: Family details */}
      {step === STEPS.FAMILY && (
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div>
            <h2 className="text-h1 mb-2">
              {choice === "create" ? "צרו משפחה" : "הצטרפו למשפחה"}
            </h2>
            <p className="text-body text-ink2">
              {choice === "create"
                ? "תנו שם לקבוצה שלכם"
                : "הזינו את קוד ההזמנה"}
            </p>
          </div>
          {choice === "create" ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="כהן משפחה"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-btn border border-line bg-surface px-4 py-3 text-body
                           disabled:opacity-50 focus-visible:border-accent"
              />
              <input
                type="text"
                placeholder="השם שלך"
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
                {isSubmitting ? "יוצר..." : "המשך"}
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="קוד הזמנה (8 תווים)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                disabled={isSubmitting}
                className="w-full rounded-btn border border-line bg-surface px-4 py-3 text-body font-mono
                           disabled:opacity-50 focus-visible:border-accent"
              />
              <input
                type="text"
                placeholder="מי אתה בקבוצה?"
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
                {isSubmitting ? "מוודא..." : "הצטרפות"}
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
            חזרה
          </button>
        </div>
      )}

      {/* Step 3: Pets */}
      {step === STEPS.PETS && (
        <div className="flex flex-1 flex-col justify-between gap-6">
          <div>
            <h2 className="text-h1 mb-2">הוסיפו חיות</h2>
            <p className="text-body text-ink2">מי אנחנו מטפלים בו?</p>
          </div>
          <div className="space-y-3 flex-1">
            {pets.map((pet, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  placeholder="שם"
                  value={pet.name}
                  onChange={(e) => updatePet(idx, "name", e.target.value)}
                  className="flex-1 rounded-btn border border-line bg-surface px-3 py-2 text-sub"
                />
                <select
                  value={pet.species}
                  onChange={(e) => updatePet(idx, "species", e.target.value)}
                  className="rounded-btn border border-line bg-surface px-3 py-2 text-sub"
                >
                  <option value="dog">כלב</option>
                  <option value="cat">חתול</option>
                  <option value="other">אחר</option>
                </select>
                <button
                  onClick={() => removePet(idx)}
                  className="rounded-btn bg-danger/10 px-3 py-2 text-danger font-semibold"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addPet}
              className="w-full rounded-btn border-2 border-dashed border-line px-4 py-3 text-body font-semibold text-ink2
                         transition-colors hover:border-accent hover:text-accent"
            >
              + הוסף חיית חמד
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(STEPS.FAMILY)}
              className="flex-1 rounded-btn border border-line px-4 py-3 text-body font-semibold text-ink"
            >
              חזרה
            </button>
            <button
              onClick={savePetsAndContinue}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-btn bg-accent px-4 py-3 text-body font-bold text-accent-fg
                         disabled:opacity-70 active:scale-[0.97]"
            >
              המשך
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Task templates */}
      {step === STEPS.TASKS && (
        <div className="flex flex-1 flex-col justify-between gap-6">
          <div>
            <h2 className="text-h1 mb-2">בחרו משימות</h2>
            <p className="text-body text-ink2">אילו טיפול תעקוב אחריו?</p>
          </div>
          <div className="space-y-2 flex-1">
            {[
              { id: "walks", label: "🚶 טיולים (3 פעמים ביום)" },
              { id: "feeds", label: "🥗 האכלות (2 פעמים ביום)" },
              { id: "meds", label: "💊 תרופות" },
            ].map((task) => (
              <button
                key={task.id}
                onClick={() =>
                  setSelectedTasks(
                    selectedTasks.includes(task.id)
                      ? selectedTasks.filter((t) => t !== task.id)
                      : [...selectedTasks, task.id]
                  )
                }
                className={`w-full rounded-btn px-4 py-3 text-body font-semibold transition-all ${
                  selectedTasks.includes(task.id)
                    ? "bg-accent text-accent-fg border-2 border-accent"
                    : "border-2 border-line text-ink hover:border-accent/50"
                }`}
              >
                {selectedTasks.includes(task.id) ? "✓ " : ""}
                {task.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(STEPS.PETS)}
              className="flex-1 rounded-btn border border-line px-4 py-3 text-body font-semibold text-ink"
            >
              חזרה
            </button>
            <button
              onClick={finishOnboarding}
              disabled={isSubmitting || selectedTasks.length === 0}
              className="flex-1 rounded-btn bg-accent px-4 py-3 text-body font-bold text-accent-fg
                         disabled:opacity-70 active:scale-[0.97]"
            >
              סיום 🎉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
