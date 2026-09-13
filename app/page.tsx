"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadFacts, saveFacts } from "@/lib/store";
import { t, type MessageKey } from "@/lib/i18n";

export interface UIFormState {
  name: string;
  consumer_number: string;
  area: string;
  bank_name: string;
  hospital_name: string;
  ui_language: string;
  call_language: string;
  voice_choice: string;
  isl_avatar: boolean;
}

const UI_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ml", label: "Malayalam (മലയാളം)" },
  { code: "mr", label: "Marathi (मराठी)" },
  { code: "bn", label: "Bengali (বাংলা)" },
];

const CALL_LANGUAGES = [
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "en", label: "English" },
];

export default function SetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<UIFormState>({
    name: "",
    consumer_number: "",
    area: "",
    bank_name: "",
    hospital_name: "",
    ui_language: "en",
    call_language: "hi",
    voice_choice: "default",
    isl_avatar: true,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const existing = loadFacts();
    if (existing && Object.keys(existing).length > 0) {
      setFormData({
        name: existing.name ?? "",
        consumer_number: existing.consumer_number ?? "",
        area: existing.area ?? "",
        bank_name: existing.bank_name ?? "",
        hospital_name: existing.hospital_name ?? "",
        ui_language: existing.ui_language ?? "en",
        call_language: existing.call_language ?? "hi",
        voice_choice: existing.voice_choice ?? "default",
        isl_avatar: String(existing.isl_avatar ?? "true") !== "false",
      });
    }
  }, []);

  const handleChange = (
    field: keyof UIFormState,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Store setup information strictly using lib/store/index.ts
    saveFacts({
      name: formData.name,
      consumer_number: formData.consumer_number,
      area: formData.area,
      bank_name: formData.bank_name,
      hospital_name: formData.hospital_name,
      ui_language: formData.ui_language,
      call_language: formData.call_language,
      voice_choice: formData.voice_choice,
      isl_avatar: String(formData.isl_avatar),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      router.push("/start");
    }, 400);
  };

  const activeLang = formData.ui_language;

  return (
    <main className="min-h-screen bg-gray-50/60 py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-sm rounded-2xl p-6 sm:p-8">
        {/* Header Section */}
        <div className="border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 tracking-wide uppercase">
              {t("app.title", undefined, activeLang)}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {t("app.tagline", undefined, activeLang)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-3 tracking-tight">
            {t("setup.title", undefined, activeLang)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("setup.subtitle", undefined, activeLang)}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* User Name Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              {t("setup.name_label", undefined, activeLang)}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t("setup.name_placeholder", undefined, activeLang)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 transition-all outline-none"
            />
          </div>

          {/* Saved Facts Section */}
          <div className="pt-2 border-t border-gray-100">
            <h2 className="text-base font-bold text-gray-900">
              {t("setup.facts_section", undefined, activeLang)}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {t("setup.facts_subtitle", undefined, activeLang)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Consumer Number */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("setup.consumer_number_label", undefined, activeLang)}
                </label>
                <input
                  type="text"
                  value={formData.consumer_number}
                  onChange={(e) => handleChange("consumer_number", e.target.value)}
                  placeholder={t("setup.consumer_number_placeholder", undefined, activeLang)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 outline-none"
                />
              </div>

              {/* Area / Colony */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("setup.area_label", undefined, activeLang)}
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => handleChange("area", e.target.value)}
                  placeholder={t("setup.area_placeholder", undefined, activeLang)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 outline-none"
                />
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("setup.bank_label", undefined, activeLang)}
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => handleChange("bank_name", e.target.value)}
                  placeholder={t("setup.bank_placeholder", undefined, activeLang)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 outline-none"
                />
              </div>

              {/* Hospital Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("setup.hospital_label", undefined, activeLang)}
                </label>
                <input
                  type="text"
                  value={formData.hospital_name}
                  onChange={(e) => handleChange("hospital_name", e.target.value)}
                  placeholder={t("setup.hospital_placeholder", undefined, activeLang)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              {t("setup.preferences_section", undefined, activeLang)}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* UI Language (8 languages) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("setup.ui_language_label", undefined, activeLang)}
                </label>
                <select
                  value={formData.ui_language}
                  onChange={(e) => handleChange("ui_language", e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white outline-none"
                >
                  {UI_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Call Language (Hindi / English) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("setup.call_language_label", undefined, activeLang)}
                </label>
                <select
                  value={formData.call_language}
                  onChange={(e) => handleChange("call_language", e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white outline-none"
                >
                  {CALL_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Voice Choice */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("setup.voice_label", undefined, activeLang)}
              </label>
              <select
                value={formData.voice_choice}
                onChange={(e) => handleChange("voice_choice", e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white outline-none"
              >
                <option value="default">
                  {t("setup.voice_default", undefined, activeLang)}
                </option>
                <option value="soft">
                  {t("setup.voice_soft", undefined, activeLang)}
                </option>
                <option value="expressive">
                  {t("setup.voice_expressive", undefined, activeLang)}
                </option>
              </select>
            </div>

            {/* ISL Avatar Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50/50">
              <div>
                <span className="block text-sm font-semibold text-gray-800">
                  {t("setup.isl_avatar_label", undefined, activeLang)}
                </span>
                <span className="block text-xs text-gray-500">
                  {t("setup.isl_avatar_desc", undefined, activeLang)}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.isl_avatar}
                onClick={() => handleChange("isl_avatar", !formData.isl_avatar)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  formData.isl_avatar ? "bg-indigo-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.isl_avatar ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {savedSuccess
                ? t("setup.saved_success", undefined, activeLang)
                : t("setup.save", undefined, activeLang)}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
