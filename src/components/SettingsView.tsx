import React, { useState, useRef } from "react";
import { Settings, Globe, Folder, RefreshCw, Layers, Clipboard, ShieldAlert, Image, Sliders, Play, Trash2, Eye } from "lucide-react";
import { AppSettings, Language } from "../types";
import { TRANSLATIONS } from "../data/translations";

interface SettingsViewProps {
  settings: AppSettings;
  t: typeof TRANSLATIONS.en;
  onChangeSettings: (updated: AppSettings) => void;
}

// 4 Preset beautiful background configurations
const BACKGROUND_PRESETS = [
  { name: "Slate Texture (Default)", url: null },
  { name: "Warm Anime Sunshine", url: "https://images.unsplash.com/photo-1541562232579-512a21360020?w=100 overlay background" },
  { name: "Neo-Cyber Shibuya", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=80" },
  { name: "Sakura Blossom Garden", url: "https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?w=1200&q=80" },
  { name: "Deep Space Cosmos", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200&q=80" }
];

export default function SettingsView({ settings, t, onChangeSettings }: SettingsViewProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onChangeSettings(updated);
  };

  const handleLanguageToggle = (lang: Language) => {
    updateSetting("language", lang);
    updateSetting("autoDetectLanguage", false);
  };

  const selectPresetBg = (presetUrl: string | null) => {
    updateSetting("backgroundImageUrl", presetUrl);
  };

  const triggerCustomBgUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCustomBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        updateSetting("backgroundImageUrl", url);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0F1115] text-[#E4E6EB] select-none pb-20 overflow-y-auto font-sans">
      
      {/* Settings Header */}
      <div className="bg-[#1C1F26] p-4 border-b border-[#2C313C] flex items-center gap-2 shadow-md shrink-0">
        <Settings className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xs font-bold font-mono tracking-wider uppercase">
          {settings.language === Language.AR ? "الإعدادات التفضيلية للتحميل" : "Zero Settings & Preferences"}
        </h2>
      </div>

      <div className="p-4 space-y-5 select-none text-left">
        
        {/* SECTION 1: Localization & Translators */}
        <div className="space-y-3 bg-[#1C1F26] p-3.5 rounded-2xl border border-[#2C313C]">
          <h3 className="text-xs font-bold text-[#8E9299] font-mono tracking-widest uppercase flex items-center gap-1.5 border-b border-[#2C313C] pb-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>{t.settings.langHeader}</span>
          </h3>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300 font-medium">{t.settings.manualLang}</span>
              <div className="flex gap-1.5 bg-[#0F1115] p-1 rounded-xl border border-[#2C313C]">
                <button 
                  onClick={() => handleLanguageToggle(Language.EN)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition ${
                    localSettings.language === Language.EN ? "bg-indigo-600 text-white shadow" : "text-gray-400"
                  }`}
                >
                  English
                </button>
                <button 
                  onClick={() => handleLanguageToggle(Language.AR)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition ${
                    localSettings.language === Language.AR ? "bg-indigo-600 text-white shadow" : "text-gray-400"
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300 font-medium">{t.settings.autoLang}</span>
              <input 
                type="checkbox" 
                checked={localSettings.autoDetectLanguage}
                onChange={(e) => updateSetting("autoDetectLanguage", e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-gray-300 font-medium leading-tight">{t.settings.chromeTranslateService}</span>
              <input 
                type="checkbox" 
                checked={localSettings.translationSettings.autoTranslateBrowser}
                onChange={(e) => {
                  const updatedTranslation = { ...localSettings.translationSettings, autoTranslateBrowser: e.target.checked };
                  updateSetting("translationSettings", updatedTranslation);
                }}
                className="w-4 h-4 accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Storage Structure */}
        <div className="space-y-3 bg-[#1C1F26] p-3.5 rounded-2xl border border-[#2C313C]">
          <h3 className="text-xs font-bold text-[#8E9299] font-mono tracking-widest uppercase flex items-center gap-1.5 border-b border-[#2C313C] pb-2">
            <Folder className="w-4 h-4 text-amber-500" />
            <span>{t.settings.locationHeader}</span>
          </h3>

          <div className="space-y-3.5 pt-1">
            <div>
              <label className="text-[10px] font-mono text-gray-500 block mb-1 uppercase">{t.settings.downloadLoc}</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={localSettings.downloadLocation}
                  onChange={(e) => updateSetting("downloadLocation", e.target.value)}
                  className="bg-[#0F1115] border border-[#2C313C] rounded-xl p-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 w-full font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-medium">{t.settings.zipMode}</span>
              <input 
                type="checkbox" 
                checked={localSettings.zipMode}
                onChange={(e) => updateSetting("zipMode", e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Performance, Speed & Queue Threading */}
        <div className="space-y-3 bg-[#1C1F26] p-3.5 rounded-2xl border border-[#2C313C]">
          <h3 className="text-xs font-bold text-[#8E9299] font-mono tracking-widest uppercase flex items-center gap-1.5 border-b border-[#2C313C] pb-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>{t.settings.behaviorHeader}</span>
          </h3>

          <div className="space-y-3 pt-1">
            <div className="text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300 font-medium">{t.settings.simDownloads}</span>
                <span className="text-indigo-400 font-semibold font-mono text-[11px]">{localSettings.simultaneousDownloads} slots</span>
              </div>
              <input 
                type="range"
                min="1"
                max="5"
                value={localSettings.simultaneousDownloads}
                onChange={(e) => updateSetting("simultaneousDownloads", parseInt(e.target.value))}
                className="w-full bg-[#0F1115] h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[8px] text-gray-500 font-mono mt-0.5">
                <span>1 (Light)</span>
                <span>3 (Medium)</span>
                <span>5 (Heavy Threads)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-medium">{t.settings.autoRetry}</span>
              <input 
                type="checkbox" 
                checked={localSettings.autoRetry}
                onChange={(e) => updateSetting("autoRetry", e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-medium">{t.settings.clipMonitor}</span>
              <input 
                type="checkbox" 
                checked={localSettings.clipboardMonitor}
                onChange={(e) => updateSetting("clipboardMonitor", e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-medium">{t.settings.dupProtection}</span>
              <input 
                type="checkbox" 
                checked={localSettings.duplicateProtection}
                onChange={(e) => updateSetting("duplicateProtection", e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Gallery Background Customization */}
        <div className="space-y-3 bg-[#1C1F26] p-3.5 rounded-2xl border border-[#2C313C]">
          <h3 className="text-xs font-bold text-[#8E9299] font-mono tracking-widest uppercase flex items-center gap-1.5 border-b border-[#2C313C] pb-2">
            <Image className="w-4 h-4 text-pink-500" />
            <span>{t.settings.bgHeader}</span>
          </h3>

          {/* Presets flex list */}
          <div className="space-y-3 pt-1">
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1.5">Wallpaper Gallery</span>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUND_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => selectPresetBg(preset.url)}
                    className={`p-2 rounded-xl text-left text-[10px] font-medium border cursor-pointer transition ${
                      localSettings.backgroundImageUrl === preset.url 
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" 
                        : "border-[#2C313C] bg-black/20 text-[#8E9299] hover:text-white"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload fully customized image from gallery */}
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Custom Attachment Upload</span>
              <button 
                id="btn-upload-custom-bg"
                onClick={triggerCustomBgUpload}
                className="w-full py-2.5 bg-[#2C313C] hover:bg-[#3E4451] text-gray-300 text-xs font-medium rounded-xl border border-dashed border-[#2C313C] cursor-pointer flex items-center justify-center gap-1 transition-colors"
              >
                <Image className="w-4 h-4 shrink-0" />
                <span>{t.settings.selectBg}</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCustomBgFile} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Opacity slider */}
            {localSettings.backgroundImageUrl && (
              <div className="text-xs space-y-1 mt-2 p-2 bg-[#0F1115] rounded-xl border border-[#2C313C]">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400">{t.settings.bgOpacity}</span>
                  <span className="text-pink-400 font-semibold font-mono">{(localSettings.backgroundImageOpacity*100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.05"
                  max="0.4"
                  step="0.01"
                  value={localSettings.backgroundImageOpacity}
                  onChange={(e) => updateSetting("backgroundImageOpacity", parseFloat(e.target.value))}
                  className="w-full bg-[#1c2235] h-1.5 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
            )}

            {/* Restore option */}
            {localSettings.backgroundImageUrl && (
              <button 
                onClick={() => {
                  updateSetting("backgroundImageUrl", null);
                  updateSetting("backgroundImageOpacity", 0.15);
                }}
                className="w-full py-1.5 bg-red-650/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] hover:bg-red-650/20 transition shrink-0"
              >
                {t.settings.restoreBg}
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
