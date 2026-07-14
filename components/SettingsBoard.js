"use client";

// ─── Settings — family/members/pets/tasks CRUD + invite + sign out ───────────
// The gap this closes: before this screen, a family could only be configured
// once, during onboarding. Inviting a second person or fixing a mistyped
// task time required editing the database by hand.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, Trash2, LogOut, ChevronDown, ChevronUp, Globe, Home, UserRound, PawPrint, ListChecks } from "lucide-react";
import { toast } from "sonner";
import {
  fetchSettings, renamePerson, addPet, removePet,
  addTask, updateTask, removeTask, signOut,
} from "@/lib/family";
import { useI18n } from "@/lib/i18n";
import { TaskIcon } from "@/lib/task-icons";
import { personBg } from "@/lib/person-colors";
import NotifyToggle from "@/components/NotifyToggle";

const ICON_OPTIONS = ["paw", "utensils", "pill"];
const SPECIES_OPTIONS = ["dog", "cat", "other"];

// Colored icon badge per section — one glance tells you which list you're
// in, the way a settings app's colored row icons do.
function SectionCard({ title, icon: Icon, tint, children }) {
  return (
    <div className="rounded-card bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2.5">
        {Icon && (
          <span className={`blob flex h-8 w-8 shrink-0 items-center justify-center text-knob ${tint}`}>
            <Icon size={16} strokeWidth={2.4} />
          </span>
        )}
        <h2 className="text-h2">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsBoard({ ctx }) {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [data, setData] = useState(null);
  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] = useState("dog");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [addingTask, setAddingTask] = useState(false);

  const load = useCallback(async () => {
    const settings = await fetchSettings(ctx.familyId);
    setData(settings);
  }, [ctx.familyId]);

  useEffect(() => {
    load();
  }, [load]);

  const copyInvite = () => {
    if (!data?.family?.invite_code) return;
    navigator.clipboard.writeText(data.family.invite_code);
    toast.success(t("settings.invite.copied"));
  };

  const handleRename = async (personId, name) => {
    if (!name.trim()) return;
    try {
      await renamePerson(personId, name.trim());
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddPet = async () => {
    if (!newPetName.trim()) return;
    try {
      await addPet(ctx.familyId, { name: newPetName.trim(), species: newPetSpecies });
      setNewPetName("");
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemovePet = async (petId) => {
    try {
      await removePet(petId);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveTask = async (taskId) => {
    try {
      await removeTask(taskId);
      setEditingTaskId(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
  };

  if (!data) {
    return (
      <div className="flex justify-center pt-24">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-h1">{t("nav.settings")}</h1>
        <button
          onClick={() => setLocale(locale === "he" ? "en" : "he")}
          className="flex items-center gap-1.5 rounded-pill bg-surface2 px-3 py-1.5 text-cap font-semibold text-ink2 active:scale-[0.97]"
        >
          <Globe size={14} />
          {t("locale.switch")}
        </button>
      </div>

      {/* Family + invite */}
      <SectionCard title={data.family?.name || t("settings.family")} icon={Home} tint="bg-accent">
        <p className="mb-2 text-cap text-ink2">{t("settings.invite.hint")}</p>
        <button
          onClick={copyInvite}
          className="flex min-h-[48px] w-full items-center justify-between rounded-btn bg-surface2 px-4 font-mono text-body font-bold tracking-wider text-ink transition-transform active:scale-[0.97]"
        >
          {data.family?.invite_code}
          <Copy size={18} className="text-ink2" />
        </button>
      </SectionCard>

      {/* Members */}
      <SectionCard title={t("settings.members")} icon={UserRound} tint="bg-pal-4">
        <div className="space-y-2">
          {data.persons.map((person) => (
            <div key={person.id} className="flex items-center gap-3">
              <span className={`h-3 w-3 shrink-0 rounded-full ${personBg(person.color_idx)}`} />
              <input
                defaultValue={person.name}
                onBlur={(e) => e.target.value !== person.name && handleRename(person.id, e.target.value)}
                className="flex-1 rounded-btn bg-transparent px-2 py-1.5 text-body text-ink outline-none focus-visible:bg-surface2"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Pets */}
      <SectionCard title={t("settings.pets")} icon={PawPrint} tint="bg-pal-3">
        <div className="space-y-2">
          {data.pets.map((pet) => (
            <div key={pet.id} className="flex items-center justify-between rounded-btn bg-surface2 px-3 py-2">
              <span className="text-sub font-semibold text-ink">
                {pet.name} · {t(`species.${pet.species}`)}
              </span>
              <button onClick={() => handleRemovePet(pet.id)} className="p-1 text-danger">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newPetName}
            onChange={(e) => setNewPetName(e.target.value)}
            placeholder={t("settings.pets.namePlaceholder")}
            className="flex-1 rounded-btn border border-line bg-surface px-3 py-2 text-sub"
          />
          <select
            value={newPetSpecies}
            onChange={(e) => setNewPetSpecies(e.target.value)}
            className="rounded-btn border border-line bg-surface px-2 py-2 text-sub"
          >
            {SPECIES_OPTIONS.map((s) => (
              <option key={s} value={s}>{t(`species.${s}`)}</option>
            ))}
          </select>
          <button onClick={handleAddPet} className="rounded-btn bg-accent px-3 text-accent-fg active:scale-[0.97]">
            <Plus size={18} />
          </button>
        </div>
      </SectionCard>

      {/* Tasks */}
      <SectionCard title={t("settings.tasks")} icon={ListChecks} tint="bg-pal-5">
        <div className="space-y-2">
          {data.tasks.map((task) =>
            editingTaskId === task.id ? (
              <TaskEditor
                key={task.id}
                task={task}
                persons={data.persons}
                onClose={() => setEditingTaskId(null)}
                onSaved={load}
                onDelete={() => handleRemoveTask(task.id)}
                t={t}
              />
            ) : (
              <button
                key={task.id}
                onClick={() => setEditingTaskId(task.id)}
                className="flex w-full items-center justify-between rounded-btn bg-surface2 px-3 py-2.5 text-start"
              >
                <span className="flex items-center gap-2">
                  <TaskIcon icon={task.icon} size={16} className="text-ink2" />
                  <span className="text-sub font-semibold text-ink">{task.label}</span>
                  <span className="text-cap text-ink2">{task.times.join(", ")}</span>
                </span>
                <ChevronDown size={16} className="text-ink2" />
              </button>
            )
          )}
        </div>

        {addingTask ? (
          <TaskEditor
            isNew
            task={{ label: "", icon: "paw", times: [], eligible_ids: data.persons.map((p) => p.id), track_fairness: true }}
            persons={data.persons}
            familyId={ctx.familyId}
            onClose={() => setAddingTask(false)}
            onSaved={() => { setAddingTask(false); load(); }}
            t={t}
          />
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-btn border-2 border-dashed border-line text-sub font-semibold text-ink2"
          >
            <Plus size={16} />
            {t("settings.tasks.add")}
          </button>
        )}
      </SectionCard>

      <NotifyToggle />

      <button
        onClick={handleSignOut}
        className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-btn border border-danger/25 bg-danger/5 text-body font-semibold text-danger active:scale-[0.97]"
      >
        <LogOut size={18} />
        {t("settings.signOut")}
      </button>
    </div>
  );
}

// Inline add/edit form for one task — times are entered as a comma-separated
// "08:00, 16:00" list rather than a multi-picker, deliberately simple.
function TaskEditor({ task, persons, familyId, isNew, onClose, onSaved, onDelete, t }) {
  const [label, setLabel] = useState(task.label);
  const [icon, setIcon] = useState(task.icon);
  const [timesText, setTimesText] = useState(task.times.join(", "));
  const [eligible, setEligible] = useState(new Set(task.eligible_ids));
  const [trackFairness, setTrackFairness] = useState(task.track_fairness);
  const [saving, setSaving] = useState(false);

  const toggleEligible = (id) => {
    const next = new Set(eligible);
    next.has(id) ? next.delete(id) : next.add(id);
    setEligible(next);
  };

  const save = async () => {
    if (!label.trim()) {
      toast.error(t("settings.tasks.labelRequired"));
      return;
    }
    const times = timesText.split(",").map((s) => s.trim()).filter(Boolean);
    setSaving(true);
    try {
      const patch = { label: label.trim(), icon, times, eligible_ids: [...eligible], track_fairness: trackFairness };
      if (isNew) await addTask(familyId, patch);
      else await updateTask(task.id, patch);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2.5 rounded-btn border-2 border-accent/30 bg-surface p-3">
      <div className="flex items-center justify-between">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t("settings.tasks.labelPlaceholder")}
          className="flex-1 rounded-btn border border-line bg-surface px-3 py-2 text-sub font-semibold"
        />
        <button onClick={onClose} className="p-2 text-ink2"><ChevronUp size={16} /></button>
      </div>

      <div className="flex gap-2">
        <select value={icon} onChange={(e) => setIcon(e.target.value)} className="rounded-btn border border-line bg-surface px-2 py-2 text-cap">
          {ICON_OPTIONS.map((i) => <option key={i} value={i}>{t(`icon.${i}`)}</option>)}
        </select>
        <input
          value={timesText}
          onChange={(e) => setTimesText(e.target.value)}
          placeholder="08:00, 16:00, 20:00"
          className="flex-1 rounded-btn border border-line bg-surface px-3 py-2 text-cap font-mono"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {persons.map((p) => (
          <button
            key={p.id}
            onClick={() => toggleEligible(p.id)}
            className={`rounded-pill px-3 py-1.5 text-cap font-semibold transition-colors active:scale-[0.97] ${
              eligible.has(p.id) ? `${personBg(p.color_idx)} text-on-pal` : "bg-surface2 text-ink2"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-cap text-ink2">
        <input type="checkbox" checked={trackFairness} onChange={(e) => setTrackFairness(e.target.checked)} />
        {t("settings.tasks.trackFairness")}
      </label>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-btn bg-accent py-2 text-sub font-bold text-accent-fg disabled:opacity-70"
        >
          {t("common.save")}
        </button>
        {!isNew && (
          <button onClick={onDelete} className="rounded-btn bg-danger/10 px-4 py-2 text-danger">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
