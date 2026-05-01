/**
 * User Settings Page with Profile Management
 *
 * Demonstrates Effect TS patterns for:
 * - Schema-based form validation
 * - Effect.gen for async save operations with error handling
 * - Ref for state management
 */

import { useState, useCallback } from "react";
import { Effect, Schema, pipe } from "effect";

// ============================================
// Schema Definitions
// ============================================

const ProfileSchema = Schema.Struct({
  displayName: pipe(
    Schema.String,
    Schema.minLength(2, { message: () => "Name must be at least 2 characters" }),
    Schema.maxLength(50, { message: () => "Name must be at most 50 characters" })
  ),
  email: pipe(
    Schema.String,
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => "Must be a valid email address",
    })
  ),
  bio: pipe(
    Schema.String,
    Schema.maxLength(200, { message: () => "Bio must be at most 200 characters" })
  ),
  website: Schema.Union(
    Schema.Literal(""),
    pipe(
      Schema.String,
      Schema.pattern(/^https?:\/\/.+/, {
        message: () => "Website must start with http:// or https://",
      })
    )
  ),
});

type ProfileData = typeof ProfileSchema.Type;

const PreferencesSchema = Schema.Struct({
  theme: Schema.Union(Schema.Literal("dark"), Schema.Literal("light"), Schema.Literal("system")),
  notifications: Schema.Boolean,
  compactMode: Schema.Boolean,
});

type PreferencesData = typeof PreferencesSchema.Type;

// ============================================
// Types
// ============================================

interface SaveResult {
  success: boolean;
  message: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// ============================================
// Effect-based operations
// ============================================

const simulateSaveProfile = (data: ProfileData): Effect.Effect<SaveResult, Error> =>
  Effect.gen(function* () {
    // Simulate network latency
    yield* Effect.sleep("800 millis");

    // Simulate occasional network failure (10% chance)
    if (Math.random() < 0.1) {
      yield* Effect.fail(new Error("Network error: failed to save profile"));
    }

    return { success: true, message: `Profile for "${data.displayName}" saved successfully` };
  });

const validateProfile = (data: ProfileData): Effect.Effect<ProfileData, ValidationError[]> =>
  Effect.gen(function* () {
    const result = Schema.decodeUnknownEither(ProfileSchema)(data);
    if (result._tag === "Left") {
      const errors = result.left.message
        .split("\n")
        .filter((line) => line.trim())
        .map((msg) => ({ field: "unknown", message: msg }));
      yield* Effect.fail(errors);
    }
    return data;
  });

// ============================================
// Profile Section Component
// ============================================

interface ProfileSectionProps {
  profile: ProfileData;
  onSave: (data: ProfileData) => void;
}

function ProfileSection({ profile, onSave }: ProfileSectionProps) {
  const [form, setForm] = useState<ProfileData>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [avatarInitials, setAvatarInitials] = useState(
    profile.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  );

  const updateField = (field: keyof ProfileData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSave = useCallback(async () => {
    setSaveState("saving");
    setErrors({});
    setSaveMessage("");

    const program = pipe(
      validateProfile(form),
      Effect.flatMap((validData) => simulateSaveProfile(validData)),
      Effect.tap((result) =>
        Effect.sync(() => {
          setSaveState("success");
          setSaveMessage(result.message);
          setAvatarInitials(
            form.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          );
          onSave(form);
          setTimeout(() => setSaveState("idle"), 3000);
        })
      ),
      Effect.catchAll((err) =>
        Effect.sync(() => {
          setSaveState("error");
          if (Array.isArray(err)) {
            const fieldErrors: Record<string, string> = {};
            (err as ValidationError[]).forEach((e) => {
              fieldErrors[e.field] = e.message;
            });
            setErrors(fieldErrors);
            setSaveMessage("Please fix the validation errors above.");
          } else {
            setSaveMessage((err as Error).message);
          }
          setTimeout(() => setSaveState("idle"), 4000);
        })
      )
    );

    await Effect.runPromise(program);
  }, [form, onSave]);

  const charCount = form.bio.length;

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Profile Information</h3>
      <p className="settings-section-desc">
        Update your public profile. Changes are saved immediately upon submission.
      </p>

      <div className="profile-avatar-row">
        <div className="profile-avatar" aria-label="Avatar">
          {avatarInitials}
        </div>
        <div className="profile-avatar-info">
          <p className="profile-avatar-label">Profile Avatar</p>
          <p className="profile-avatar-hint">
            Avatar is auto-generated from your display name initials.
          </p>
        </div>
      </div>

      <div className="settings-form">
        <div className="form-field">
          <label className="form-label" htmlFor="displayName">
            Display Name
          </label>
          <input
            id="displayName"
            className={`form-input ${errors.displayName ? "form-input--error" : ""}`}
            type="text"
            value={form.displayName}
            onChange={(e) => updateField("displayName", e.target.value)}
            placeholder="Your display name"
            maxLength={50}
          />
          {errors.displayName && (
            <span className="form-error">{errors.displayName}</span>
          )}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            className={`form-input ${errors.email ? "form-input--error" : ""}`}
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="your@email.com"
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="bio">
            Bio{" "}
            <span className={`char-count ${charCount > 180 ? "char-count--warn" : ""}`}>
              {charCount}/200
            </span>
          </label>
          <textarea
            id="bio"
            className={`form-textarea ${errors.bio ? "form-input--error" : ""}`}
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="Tell us a little about yourself..."
            rows={3}
            maxLength={200}
          />
          {errors.bio && <span className="form-error">{errors.bio}</span>}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="website">
            Website{" "}
            <span className="form-label-optional">(optional)</span>
          </label>
          <input
            id="website"
            className={`form-input ${errors.website ? "form-input--error" : ""}`}
            type="url"
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
            placeholder="https://yourwebsite.com"
          />
          {errors.website && <span className="form-error">{errors.website}</span>}
        </div>

        <div className="form-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saveState === "saving"}
          >
            {saveState === "saving" ? (
              <span className="btn-loading">
                <span className="spinner" /> Saving...
              </span>
            ) : (
              "Save Profile"
            )}
          </button>

          {saveState === "success" && (
            <span className="save-feedback save-feedback--success">
              ✓ {saveMessage}
            </span>
          )}
          {saveState === "error" && (
            <span className="save-feedback save-feedback--error">
              ✗ {saveMessage}
            </span>
          )}
        </div>
      </div>

      <div className="effect-badge">
        <strong>Effect TS:</strong> Schema validation + async save with automatic error handling
      </div>
    </div>
  );
}

// ============================================
// Preferences Section Component
// ============================================

interface PreferencesSectionProps {
  preferences: PreferencesData;
  onSave: (data: PreferencesData) => void;
}

function PreferencesSection({ preferences, onSave }: PreferencesSectionProps) {
  const [prefs, setPrefs] = useState<PreferencesData>(preferences);
  const [saved, setSaved] = useState(false);

  const updatePref = <K extends keyof PreferencesData>(key: K, value: PreferencesData[K]) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);

    // Auto-save preferences with Effect
    const program = pipe(
      Effect.sleep("300 millis"),
      Effect.flatMap(() => Effect.sync(() => onSave(next))),
      Effect.tap(() =>
        Effect.sync(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        })
      )
    );

    Effect.runPromise(program);
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Preferences</h3>
      <p className="settings-section-desc">
        Customize your experience. Changes are auto-saved.
        {saved && <span className="auto-saved"> ✓ Auto-saved</span>}
      </p>

      <div className="prefs-list">
        <div className="pref-item">
          <div className="pref-info">
            <span className="pref-label">Theme</span>
            <span className="pref-desc">Choose your preferred color theme</span>
          </div>
          <div className="theme-selector">
            {(["dark", "light", "system"] as const).map((t) => (
              <button
                key={t}
                className={`theme-btn ${prefs.theme === t ? "theme-btn--active" : ""}`}
                onClick={() => updatePref("theme", t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="pref-item">
          <div className="pref-info">
            <label className="pref-label" htmlFor="notifications">
              Notifications
            </label>
            <span className="pref-desc">Receive email notifications for activity</span>
          </div>
          <label className="toggle">
            <input
              id="notifications"
              type="checkbox"
              checked={prefs.notifications}
              onChange={(e) => updatePref("notifications", e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="pref-item">
          <div className="pref-info">
            <label className="pref-label" htmlFor="compactMode">
              Compact Mode
            </label>
            <span className="pref-desc">Use a denser layout with reduced spacing</span>
          </div>
          <label className="toggle">
            <input
              id="compactMode"
              type="checkbox"
              checked={prefs.compactMode}
              onChange={(e) => updatePref("compactMode", e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <div className="effect-badge">
        <strong>Effect TS:</strong> Debounced auto-save with <code>Effect.sleep</code> +{" "}
        <code>Effect.sync</code>
      </div>
    </div>
  );
}

// ============================================
// Account Section Component
// ============================================

function AccountSection() {
  const [deleteState, setDeleteState] = useState<"idle" | "confirm" | "deleting">("idle");
  const [exportState, setExportState] = useState<"idle" | "exporting" | "done">("idle");

  const handleExportData = async () => {
    setExportState("exporting");

    const program = pipe(
      Effect.sleep("1200 millis"),
      Effect.tap(() =>
        Effect.sync(() => {
          // Simulate creating a data export
          const exportData = {
            exportedAt: new Date().toISOString(),
            profile: { displayName: "Demo User", email: "demo@example.com" },
            preferences: { theme: "dark", notifications: true },
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "user-data-export.json";
          a.click();
          URL.revokeObjectURL(url);
        })
      ),
      Effect.tap(() =>
        Effect.sync(() => {
          setExportState("done");
          setTimeout(() => setExportState("idle"), 3000);
        })
      )
    );

    await Effect.runPromise(program);
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Account</h3>
      <p className="settings-section-desc">
        Manage your account data and settings.
      </p>

      <div className="account-actions">
        <div className="account-action-row">
          <div className="account-action-info">
            <span className="account-action-label">Export Data</span>
            <span className="account-action-desc">
              Download all your profile data as a JSON file.
            </span>
          </div>
          <button
            className="btn-secondary"
            onClick={handleExportData}
            disabled={exportState !== "idle"}
          >
            {exportState === "exporting"
              ? "Exporting..."
              : exportState === "done"
              ? "✓ Exported!"
              : "Export Data"}
          </button>
        </div>

        <div className="account-action-row account-action-row--danger">
          <div className="account-action-info">
            <span className="account-action-label account-action-label--danger">
              Delete Account
            </span>
            <span className="account-action-desc">
              Permanently delete your account and all associated data. This cannot be undone.
            </span>
          </div>
          {deleteState === "idle" && (
            <button
              className="btn-danger"
              onClick={() => setDeleteState("confirm")}
            >
              Delete Account
            </button>
          )}
          {deleteState === "confirm" && (
            <div className="delete-confirm">
              <span className="delete-confirm-text">Are you sure?</span>
              <button
                className="btn-danger"
                onClick={() => {
                  setDeleteState("deleting");
                  setTimeout(() => setDeleteState("idle"), 2000);
                }}
              >
                Yes, Delete
              </button>
              <button
                className="btn-secondary"
                onClick={() => setDeleteState("idle")}
              >
                Cancel
              </button>
            </div>
          )}
          {deleteState === "deleting" && (
            <span className="save-feedback save-feedback--error">Processing...</span>
          )}
        </div>
      </div>

      <div className="effect-badge">
        <strong>Effect TS:</strong> Data export pipeline with <code>Effect.gen</code> + side effects
      </div>
    </div>
  );
}

// ============================================
// Main UserSettings Component
// ============================================

type SettingsTab = "profile" | "preferences" | "account";

const defaultProfile: ProfileData = {
  displayName: "Demo User",
  email: "demo@example.com",
  bio: "Effect TS enthusiast. Building reliable software with functional programming.",
  website: "https://effect.website",
};

const defaultPreferences: PreferencesData = {
  theme: "dark",
  notifications: true,
  compactMode: false,
};

export function UserSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [preferences, setPreferences] = useState<PreferencesData>(defaultPreferences);

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "preferences", label: "Preferences" },
    { key: "account", label: "Account" },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2 className="settings-title">User Settings</h2>
        <p className="settings-subtitle">
          Manage your profile, preferences, and account settings
        </p>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`settings-nav-btn ${activeTab === tab.key ? "settings-nav-btn--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeTab === "profile" && (
            <ProfileSection profile={profile} onSave={setProfile} />
          )}
          {activeTab === "preferences" && (
            <PreferencesSection preferences={preferences} onSave={setPreferences} />
          )}
          {activeTab === "account" && <AccountSection />}
        </div>
      </div>
    </div>
  );
}
