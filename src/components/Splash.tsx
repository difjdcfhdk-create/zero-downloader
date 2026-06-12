import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Language } from "../types";

interface SplashProps {
  onComplete: (lang: Language) => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [loadingText, setLoadingText] = useState("Initializing Zero core systems...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Detect default browser language automatically
    const browserLang = navigator.language || (navigator as any).userLanguage || "";
    const isAr = browserLang.startsWith("ar");
    setSelectedLang(isAr ? Language.AR : Language.EN);

    // Dynamic loading status messages reminiscent of 1DM
    const statuses = [
      "Initializing Zero core systems...",
      "Binding clipboard auto-monitor listeners...",
      "Connecting to simulated secure Pixiv API node...",
      "Setting up 1-5 concurrent download thread buffers...",
      "Ready!"
    ];

    let currentStatusIdx = 0;
    const interval = setInterval(() => {
      currentStatusIdx++;
      if (currentStatusIdx < statuses.length) {
        setLoadingText(statuses[currentStatusIdx]);
      }
    }, 500);

    // Loading progress bar percentage increment
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, []);

  const handleEnter = () => {
    if (selectedLang) {
      onComplete(selectedLang);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F1115] text-[#E4E6EB] p-6 select-none relative overflow-hidden">
      {/* Background visual graphics */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(99,102,241,0.06)_0%,transparent_70%] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center max-w-sm w-full text-center z-10"
      >
        {/* App Logo - The generated crossed swords icon in elegant round rounded-square styling */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-1.5 bg-indigo-500 rounded-3xl blur-md opacity-20 group-hover:opacity-40 transition duration-500" />
          <img
            src="/src/assets/images/crossed_swords_logo_1781240230399.jpg"
            alt="⚔ Zero Logo"
            className="w-32 h-32 rounded-2xl border border-[#2C313C] object-cover relative z-10 shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Brand Text */}
        <h1 className="text-4xl font-bold tracking-wider font-mono bg-gradient-to-r from-white via-[#E4E6EB] to-[#8E9299] bg-clip-text text-transparent flex items-center gap-2 justify-center">
          <span>⚔</span> ZERO
        </h1>
        <p className="text-[#8E9299] text-[10px] uppercase tracking-widest font-semibold mt-2">
          Pixiv Download Manager
        </p>

        {/* 1DM Progress Bar indicator */}
        <div className="w-full bg-[#1C1F26] rounded-full h-2 mt-10 relative overflow-hidden border border-[#2C313C]">
          <motion.div
            className="bg-indigo-500 h-full rounded-full shadow-[0_0_8px_#6366f1]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>

        {/* Core loading text info logs */}
        <p className="text-xs text-[#8E9299] mt-3 font-mono h-4 overflow-hidden truncate">
          {progress < 100 ? loadingText : "System ready."}
        </p>

        {/* Interactive Language Selector & Action buttons after loaded */}
        {progress >= 100 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 w-full space-y-4"
          >
            <div className="flex items-center justify-center gap-3 bg-[#1C1F26] p-1.5 rounded-xl border border-[#2C313C]">
              <button
                onClick={() => setSelectedLang(Language.EN)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 ${
                  selectedLang === Language.EN
                    ? "bg-indigo-600 text-white shadow shadow-indigo-600/30"
                    : "text-[#8E9299] hover:text-white"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLang(Language.AR)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 ${
                  selectedLang === Language.AR
                    ? "bg-indigo-600 text-white shadow shadow-indigo-600/30"
                    : "text-[#8E9299] hover:text-white"
                }`}
              >
                العربية (RTL)
              </button>
            </div>

            <button
              id="splash-enter-btn"
              onClick={handleEnter}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white py-3 px-6 rounded-xl font-semibold tracking-wide text-sm transition shadow-lg shadow-indigo-600/30"
            >
              {selectedLang === Language.AR ? "انقر للدخول للمدير" : "Enter Downloader"}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Subtext branding in margins */}
      <div className="absolute bottom-6 left-6 text-[10px] text-[#8E9299] font-mono">
        PLATFORM: ANDROID ONLY
      </div>
      <div className="absolute bottom-6 right-6 text-[10px] text-[#8E9299] font-mono">
        SIMULATOR V1.2
      </div>
    </div>
  );
}
