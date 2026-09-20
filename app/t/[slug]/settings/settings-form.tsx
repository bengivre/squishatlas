"use client";

import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { inputClassName, labelClassName } from "@/components/tenant/tenant-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { TenantAppShell } from "@/components/tenant/tenant-app-shell";
import type { PublicPageKey } from "@/lib/public/unlock-cookie";

import {
  updateGeneralSettingsAction,
  updatePagePasswordAction,
  updatePageVisibilityAction,
} from "./actions";

type SettingsFormProps = {
  slug: string;
  displayName: string;
  origin: string;
  settings: {
    hubEnabled: boolean;
    galleryEnabled: boolean;
    treeEnabled: boolean;
    hubIntro: string | null;
    allowIndexing: boolean;
    hubPassword: string | null;
    galleryPassword: string | null;
    treePassword: string | null;
    hasHubPassword: boolean;
    hasGalleryPassword: boolean;
    hasTreePassword: boolean;
  };
};

const saveButtonClassName =
  "rounded-input bg-moon-gold text-night-deep px-4 py-2 text-sm font-semibold disabled:opacity-60";

export function SettingsForm({
  slug,
  displayName,
  origin,
  settings,
}: SettingsFormProps) {
  const [generalPending, startGeneralTransition] = useTransition();
  const [generalMessage, setGeneralMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const router = useRouter();

  function onGeneralSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralMessage(null);
    setGeneralError(null);
    const formData = new FormData(event.currentTarget);

    startGeneralTransition(async () => {
      const result = await updateGeneralSettingsAction(slug, formData);
      if (!result.ok) {
        setGeneralError(result.message);
        return;
      }
      setGeneralMessage(result.message ?? "Configuration General saved.");
      router.refresh();
    });
  }

  const hubUrl = `${origin}/t/${slug}`;
  const galleryUrl = `${origin}/t/${slug}/gallery`;
  const treeUrl = `${origin}/t/${slug}/tree`;

  return (
    <TenantAppShell
      slug={slug}
      eyebrow={displayName}
      title="Settings"
      activeTab="settings"
    >
      <div className="space-y-6">
        <form onSubmit={onGeneralSubmit} className="stat-panel space-y-4">
          <h2 className="text-lamplight text-lg">General</h2>

          <label className="block space-y-1">
            <span className={labelClassName}>
              A short welcome on your public hub, gallery, and family tree
            </span>
            <textarea
              name="hub_intro"
              rows={4}
              defaultValue={settings.hubIntro ?? ""}
              className={inputClassName}
              placeholder="Welcome to our squish family…"
            />
          </label>

          <div className="space-y-3">
            <h3 className="text-lamplight text-sm font-semibold">
              Search engines
            </h3>
            <p className="text-star-dim text-sm">
              Public pages default to{" "}
              <code className="text-lamplight">noindex</code> — these
              collections are often made by children. Opt in only if you want
              them discoverable.
            </p>
            <label className="text-lamplight flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="allow_indexing"
                defaultChecked={settings.allowIndexing}
                className="border-star-dim/30 rounded"
              />
              Allow search engines to index my public pages
            </label>
          </div>

          {generalError ? (
            <p className="text-blush text-sm" role="status" aria-live="polite">
              {generalError}
            </p>
          ) : null}
          {generalMessage ? (
            <p
              className="text-moon-gold text-sm"
              role="status"
              aria-live="polite"
            >
              {generalMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={generalPending}
            className={saveButtonClassName}
          >
            {generalPending ? "Saving…" : "Save config"}
          </button>
        </form>

        <section className="stat-panel space-y-4">
          <h2 className="text-lamplight text-lg">Public pages</h2>
          <p className="text-star-dim text-sm">
            These pages are private by default and can only be seen by you, the
            owner. To let someone else open a share link, set that page to
            Public. You can still add an optional password so only people who
            know it can get in.
          </p>

          <PageToggle
            key={`hub-${settings.hasHubPassword}-${settings.hubPassword ?? ""}`}
            slug={slug}
            id="hub"
            page="hub"
            title="Hub"
            description="Your collection home page"
            defaultEnabled={settings.hubEnabled}
            savedPassword={settings.hubPassword}
            hasPassword={settings.hasHubPassword}
            shareUrl={hubUrl}
          />
          <PageToggle
            key={`gallery-${settings.hasGalleryPassword}-${settings.galleryPassword ?? ""}`}
            slug={slug}
            id="gallery"
            page="gallery"
            title="Gallery"
            description="A photo gallery of your squishies"
            defaultEnabled={settings.galleryEnabled}
            savedPassword={settings.galleryPassword}
            hasPassword={settings.hasGalleryPassword}
            shareUrl={galleryUrl}
          />
          <PageToggle
            key={`tree-${settings.hasTreePassword}-${settings.treePassword ?? ""}`}
            slug={slug}
            id="tree"
            page="tree"
            title="Family tree"
            description="Family connections between squishies"
            defaultEnabled={settings.treeEnabled}
            savedPassword={settings.treePassword}
            hasPassword={settings.hasTreePassword}
            shareUrl={treeUrl}
          />
        </section>

        <section className="stat-panel space-y-3">
          <h2 className="text-lamplight text-lg">Account</h2>
          <p className="text-star-dim text-sm">
            Sign out of Squishatlas on this device.
          </p>
          <SignOutButton />
        </section>
      </div>
    </TenantAppShell>
  );
}

function PageToggle({
  slug,
  id,
  page,
  title,
  description,
  defaultEnabled,
  savedPassword,
  hasPassword,
  shareUrl,
}: {
  slug: string;
  id: string;
  page: PublicPageKey;
  title: string;
  description: string;
  defaultEnabled: boolean;
  savedPassword: string | null;
  hasPassword: boolean;
  shareUrl: string;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordValue, setPasswordValue] = useState(savedPassword ?? "");
  const [clearPassword, setClearPassword] = useState(false);
  const [visibilityPending, startVisibilityTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canRevealSaved = Boolean(savedPassword);
  const passwordLocked = hasPassword && !canRevealSaved;

  function onEnabledChange(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    setMessage(null);
    setError(null);

    startVisibilityTransition(async () => {
      const result = await updatePageVisibilityAction(slug, page, next);
      if (!result.ok) {
        setEnabled(previous);
        setError(result.message);
        return;
      }
      setMessage(result.message ?? `Configuration ${title} saved.`);
      router.refresh();
    });
  }

  function onPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(event.currentTarget);

    startPasswordTransition(async () => {
      const result = await updatePagePasswordAction(slug, page, formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message ?? `Configuration ${title} saved.`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onPasswordSubmit}
      className="rounded-input border-star-dim/20 bg-night-deep space-y-4 border p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lamplight font-semibold">{title}</p>
          <p className="text-star-dim text-xs">{description}</p>
        </div>
        <EnableSwitch
          id={`${id}-enabled`}
          enabled={enabled}
          onEnabledChange={onEnabledChange}
          disabled={visibilityPending}
          label={`${title} visibility`}
        />
      </div>

      <p
        className={`text-xs font-semibold ${
          enabled ? "text-aurora" : "text-star-dim"
        }`}
      >
        {enabled
          ? "Public — anyone with the link can open this page"
          : "Private — only you can view this page"}
      </p>

      <label className="block space-y-1">
        <span className={labelClassName}>Password (optional)</span>
        {canRevealSaved ? (
          <input type="hidden" name={`${page}_had_reveal`} value="on" />
        ) : null}
        <div className="relative">
          <input
            type={passwordVisible ? "text" : "password"}
            name={`${page}_password`}
            autoComplete="new-password"
            value={passwordValue}
            onChange={(event) => {
              setPasswordValue(event.target.value);
              if (event.target.value) {
                setClearPassword(false);
              }
            }}
            disabled={clearPassword}
            placeholder={
              passwordLocked
                ? "Password is set — type it here to see it next time"
                : "Leave empty for open access"
            }
            className={`${inputClassName} pr-12`}
          />
          <button
            type="button"
            className="rounded-input text-star-dim hover:text-lamplight absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center transition"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? "Hide password" : "Show password"}
          >
            {passwordVisible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {passwordLocked ? (
          <span className="text-star-dim block text-xs">
            This password was saved before reveal was added. Enter it (or a new
            one) and save to show it here next time.
          </span>
        ) : null}
      </label>

      {hasPassword ? (
        <label className="text-star-dim flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            name={`${page}_clear_password`}
            checked={clearPassword}
            onChange={(event) => {
              const checked = event.target.checked;
              setClearPassword(checked);
              if (checked) {
                setPasswordValue("");
                setPasswordVisible(false);
              } else {
                setPasswordValue(savedPassword ?? "");
              }
            }}
            className="border-star-dim/30 rounded"
          />
          Remove password (make fully public while enabled)
        </label>
      ) : null}

      <CopyField id={`${id}-share`} label="Share link" value={shareUrl} />

      {error ? (
        <p className="text-blush text-sm" role="status" aria-live="polite">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-moon-gold text-sm" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={passwordPending}
        className={saveButtonClassName}
      >
        {passwordPending ? "Saving…" : "Save config"}
      </button>
    </form>
  );
}

function EnableSwitch({
  id,
  enabled,
  onEnabledChange,
  disabled,
  label,
}: {
  id: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span
        className={`min-w-14 text-right text-xs font-extrabold ${
          enabled ? "text-moon-gold" : "text-star-dim"
        }`}
      >
        {enabled ? "Public" : "Private"}
      </span>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={disabled}
        onClick={() => onEnabledChange(!enabled)}
        className={`focus-visible:outline-moon-gold relative h-8 w-14 rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${
          enabled ? "bg-moon-gold" : "bg-star-dim/35"
        }`}
      >
        <span
          className={`bg-night-deep absolute top-1 left-1 size-6 rounded-full shadow-sm transition ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function CopyField({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function onCopy() {
    const copied = await copyText(value, inputRef.current);
    setStatus(copied ? "copied" : "failed");
    window.setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div className="space-y-1">
      <p className={labelClassName}>{label}</p>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          readOnly
          value={value}
          className={`${inputClassName} text-xs`}
          aria-label={label}
          id={id}
        />
        <button
          type="button"
          className={`rounded-input inline-flex min-h-11 shrink-0 items-center gap-1.5 border px-3 py-2 text-xs font-semibold transition ${
            status === "copied"
              ? "border-moon-gold/50 bg-moon-gold text-night-deep"
              : "border-star-dim/30 text-lamplight hover:border-moon-gold/40"
          }`}
          onClick={() => {
            void onCopy();
          }}
        >
          {status === "copied" ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {status === "copied" ? "Copied!" : "Copy"}
        </button>
      </div>
      {status === "copied" ? (
        <p className="text-moon-gold text-xs" role="status" aria-live="polite">
          Copied — paste it anywhere you like.
        </p>
      ) : null}
      {status === "failed" ? (
        <p className="text-blush text-xs" role="status" aria-live="polite">
          Couldn&apos;t copy automatically. Select the link and copy it
          yourself.
        </p>
      ) : null}
    </div>
  );
}

async function copyText(
  text: string,
  input?: HTMLInputElement | null,
): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Insecure origins (plain HTTP on a LAN IP) reject the Clipboard API.
  }

  if (input) {
    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);
    try {
      if (document.execCommand("copy")) {
        return true;
      }
    } catch {
      // Keep going to the textarea fallback.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
