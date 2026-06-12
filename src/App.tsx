import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Globe, Settings as SettingsIcon, Play, Pause, Trash2, Clipboard as ClipIcon, Minimize2, Wifi, WifiOff } from "lucide-react";
import { Language, AppSettings, DownloadItem, PixivPost, ArtworkImage } from "./types";
import { TRANSLATIONS } from "./data/translations";
import Splash from "./components/Splash";
import BrowserView from "./components/BrowserView";
import DownloadsView from "./components/DownloadsView";
import SettingsView from "./components/SettingsView";

// Clean modular service orchestrator modules
import { PixivService } from "./services/PixivService";
import { StorageManager } from "./services/StorageManager";
import { ZipManager } from "./services/ZipManager";
import { NotificationService } from "./services/NotificationService";
import { QueueManager } from "./services/QueueManager";
import { DownloadManager } from "./services/DownloadManager";
import { ClipboardService } from "./services/ClipboardService";

export default function App() {
  const [splashComplete, setSplashComplete] = useState(false);
  const [currentTab, setCurrentTab] = useState<"downloads" | "browser" | "settings">("browser");

  // App settings state with local persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const cached = localStorage.getItem("zero_settings");
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      language: Language.EN,
      autoDetectLanguage: true,
      translationSettings: {
        autoTranslateBrowser: true,
        targetLanguage: Language.EN
      },
      downloadLocation: "Zero/Downloads",
      zipMode: false,
      simultaneousDownloads: 3,
      autoRetry: true,
      clipboardMonitor: true,
      duplicateProtection: true,
      backgroundImageUrl: null,
      backgroundImageOpacity: 0.15,
      pixivUsername: null
    };
  });

  const t = TRANSLATIONS[settings.language];

  // Downloads state loaded from cache
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const cached = localStorage.getItem("zero_downloads_history");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.map((item: any) => {
          if (item.status === "active") {
            return { ...item, status: "queued", speed: "0 KB/s" };
          }
          return item;
        });
      }
    } catch (e) {}
    return [];
  });

  const [virtualClipboardUrl, setVirtualClipboardUrl] = useState<string | null>(null);
  const [copiedAlertVisible, setCopiedAlertVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Active download tracking refs to prevent loop duplicates
  const downloadingRefs = useRef<Set<string>>(new Set());
  const lastClipboardRef = useRef<string | null>(null);

  // Settings sync
  useEffect(() => {
    localStorage.setItem("zero_settings", JSON.stringify(settings));
  }, [settings]);

  // Downloads sync
  useEffect(() => {
    localStorage.setItem("zero_downloads_history", JSON.stringify(downloads));
  }, [downloads]);

  // Network checks
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Real-time clipboard loops
  // Real-time clipboard loops
  useEffect(() => {
    if (!settings.clipboardMonitor || !splashComplete) return;

    const checkClipboard = async () => {
      try {
        const text = await ClipboardService.readClipboardText();
        if (text && (text.includes("pixiv.net") || /^\d{8,11}$/.test(text.trim()))) {
          const sanitizedText = text.trim();
          if (sanitizedText !== lastClipboardRef.current) {
            lastClipboardRef.current = sanitizedText;
            setVirtualClipboardUrl(sanitizedText);
            setCopiedAlertVisible(true);
            
            const artworkId = ClipboardService.extractArtworkId(sanitizedText);
            if (artworkId) {
              NotificationService.sendProgress(artworkId, "Copied Link Detected", 0, "0 KB/s");
            }
          }
        }
      } catch (err) {
        console.warn("Clipboard polling fallback:", err);
      }
    };

    const timer = setInterval(checkClipboard, 4000);
    return () => clearInterval(timer);
  }, [settings.clipboardMonitor, splashComplete]);

  // Background active downloader worker thread controller
  useEffect(() => {
    if (!isOnline) return;

    // Find first active item
    const activeItem = downloads.find(d => d.status === "active");

    if (!activeItem) {
      // Find first queued item to start sequential downloader pipeline
      const nextQueued = downloads.find(d => d.status === "queued");
      if (nextQueued) {
        setDownloads(prev => prev.map(d => 
          d.id === nextQueued.id ? { ...d, status: "active", speed: "Preparing..." } : d
        ));
      }
      return;
    }

    if (!downloadingRefs.current.has(activeItem.id)) {
      downloadingRefs.current.add(activeItem.id);
      
      if (activeItem.imageUrls.length === 0) {
        setDownloads(prev => prev.map(d => d.id === activeItem.id ? { ...d, speed: "Crawling metadata..." } : d));
        PixivService.getArtworkDetails(activeItem.artworkId)
          .then(post => {
            setDownloads(prev => prev.map(d => {
              if (d.id === activeItem.id) {
                return {
                  ...d,
                  artworkTitle: post.title,
                  artistName: post.artistName,
                  totalImages: post.images.length,
                  imageUrls: post.images.map((img: any) => img.url),
                  selectedIndices: post.images.map((_: any, idx: number) => idx),
                  totalSize: `${(post.images.length * 0.85).toFixed(1)} MB`,
                  status: "active",
                  speed: "Connecting..."
                };
              }
              return d;
            }));
          })
          .catch(err => {
            console.error("Crawl error:", err);
            setDownloads(prev => prev.map(d => d.id === activeItem.id ? { ...d, status: "failed", speed: "Crawl Error" } : d));
          })
          .finally(() => {
            downloadingRefs.current.delete(activeItem.id);
          });
      } else {
        DownloadManager.resume(activeItem.id);
        DownloadManager.runDownloadTask(activeItem, settings, (updated) => {
          setDownloads(prev => prev.map(d => d.id === updated.id ? updated : d));
        }).finally(() => {
          downloadingRefs.current.delete(activeItem.id);
        });
      }
    }
  }, [downloads, isOnline, settings]);

  const handleSplashComplete = (lang: Language) => {
    setSettings(prev => ({
      ...prev,
      language: lang,
      translationSettings: {
        ...prev.translationSettings,
        targetLanguage: lang
      }
    }));
    setSplashComplete(true);
  };

  const triggerManualClipboardCheck = (url: string) => {
    if (!settings.clipboardMonitor) return;
    setVirtualClipboardUrl(url);
    setCopiedAlertVisible(true);
  };

  const handleAddClipboardLinkToQueue = () => {
    if (!virtualClipboardUrl) return;
    addUrlToQueue(virtualClipboardUrl);
    setCopiedAlertVisible(false);
  };

  // Add urls by pasting, clipping or bulk txt files
  const addUrlToQueue = (urlText: string): string[] => {
    const { addedItems, duplicateCount } = QueueManager.processAndEnqueue(urlText, downloads, settings);
    if (addedItems.length > 0) {
      setDownloads(prev => [...addedItems, ...prev]);
    }
    return addedItems.map(item => item.artworkId);
  };

  const handleAddBrowserSelectionToQueue = (post: PixivPost, selectedIndices: number[]) => {
    if (settings.duplicateProtection) {
      const isDuplicate = downloads.some(d => d.artworkId === post.id && d.status !== "failed");
      if (isDuplicate) {
        alert(t.manager.duplicateDetected.replace("{id}", post.id));
        return;
      }
    }

    const newItem: DownloadItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      artworkId: post.id,
      artworkTitle: post.title,
      artistName: post.artistName,
      totalImages: selectedIndices.length,
      downloadedCount: 0,
      status: "queued",
      speed: "0 KB/s",
      progress: 0,
      totalSize: `${(selectedIndices.length * 0.85).toFixed(1)} MB`,
      imageUrls: selectedIndices.map(idx => post.images[idx].url),
      selectedIndices: selectedIndices,
      isZip: settings.zipMode,
      filePath: settings.zipMode ? `${settings.downloadLocation}/${post.id}.zip` : `${settings.downloadLocation}/${post.id}`,
      errorCount: 0
    };

    setDownloads(prev => [newItem, ...prev]);
    setCurrentTab("downloads");
  };

  const handleImportTxtList = (content: string) => {
    addUrlToQueue(content);
    setCurrentTab("downloads");
  };

  const handlePauseItem = (id: string) => {
    DownloadManager.pause(id);
    setDownloads(prev => prev.map(item => item.id === id ? { ...item, status: "paused", speed: "PAUSED" } : item));
  };

  const handleResumeItem = (id: string) => {
    DownloadManager.resume(id);
    setDownloads(prev => prev.map(item => item.id === id ? { ...item, status: "queued", speed: "0 KB/s" } : item));
  };

  const handleDeleteItem = (id: string) => {
    DownloadManager.pause(id);
    setDownloads(prev => prev.filter(item => item.id !== id));
  };

  const handleMoveUpItem = (id: string) => {
    setDownloads(prev => QueueManager.moveUp(id, prev));
  };

  const handleMoveDownItem = (id: string) => {
    setDownloads(prev => QueueManager.moveDown(id, prev));
  };

  const handleCompressToZip = async (id: string) => {
    // Compress completed raw folder to zip dynamically on user command from visual list
    const item = downloads.find(d => d.id === id);
    if (item && item.status === "completed" && !item.isZip) {
      setDownloads(prev => prev.map(d => d.id === id ? { ...d, speed: "Compressing archive..." } : d));
      try {
        const cachedFiles = DownloadManager.getCachedBlobs(id);
        if (cachedFiles.length > 0) {
          const zipBlob = await ZipManager.compressBlobs(cachedFiles, item.artworkId);
          await StorageManager.saveFile(`${item.artworkId}.zip`, zipBlob, settings.downloadLocation);
          
          setDownloads(prev => prev.map(d => d.id === id ? {
            ...d,
            isZip: true,
            zipName: `${item.artworkId}.zip`,
            filePath: `${settings.downloadLocation}/${item.artworkId}.zip`,
            speed: "0 KB/s"
          } : d));
        }
      } catch (err) {
        console.warn("ZIP creation compression failed:", err);
      }
    }
  };

  const handleRedownloadItem = (id: string) => {
    setDownloads(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          downloadedCount: 0,
          progress: 0,
          status: "queued",
          speed: "0 KB/s"
        };
      }
      return item;
    }));
  };

  const handleToggleFollowArtist = (artistId: string) => {
    // Dynamic following handled instantly in BrowserView profile callbacks
  };

  if (!splashComplete) {
    return <Splash onComplete={handleSplashComplete} />;
  }

  const activeDownloader = downloads.find(d => d.status === "active");

  return (
    <div 
      className={`min-h-screen relative text-slate-100 flex flex-col items-center justify-between overflow-hidden ${
        settings.language === Language.AR ? "rtl-mode" : "ltr-mode"
      }`}
    >
      {/* Absolute Wallpaper overlay with contrast filters */}
      {settings.backgroundImageUrl && (
        <div 
          className="custom-bg-overlay"
          style={{ 
            backgroundImage: `url(${settings.backgroundImageUrl})`,
            opacity: settings.backgroundImageOpacity
          }}
        />
      )}

      {/* Frame device simulating realistic Android container */}
      <div className="android-device-frame relative w-full h-full flex flex-col bg-[#0F1115] border-x border-[#2C313C] shadow-2xl">
        
        {/* Android Top Status bar mockup */}
        <div className="bg-[#1C1F26] text-[10px] text-[#8E9299] p-2 px-4 flex items-center justify-between font-mono shrink-0 select-none border-b border-[#2C313C]">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-white">⚔ ZERO Downloader</span>
            {isOnline ? (
              <span className="flex items-center gap-0.5 text-green-500 font-sans text-[8px] tracking-wide uppercase"><Wifi className="w-3 h-3 shrink-0" /> ONLINE</span>
            ) : (
              <span className="flex items-center gap-0.5 text-red-500 font-sans text-[8px] tracking-wide uppercase font-bold"><WifiOff className="w-3 h-3 shrink-0" /> NO INT</span>
            )}
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1 py-0.5 rounded font-bold font-sans">1DM ENGINE</span>
            <span>12:00 PM</span>
          </div>
        </div>

        {/* Virtual Clipboard detect popup bar */}
        <AnimatePresence>
          {copiedAlertVisible && virtualClipboardUrl && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#1C1F26] p-3 flex flex-col gap-2 border-b border-[#2C313C] shadow-lg shrink-0 relative overflow-hidden z-30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full mt-0.5"><ClipIcon className="w-4 h-4 text-indigo-400" /></span>
                  <div>
                    <h5 className="text-[11px] font-bold text-white font-mono uppercase tracking-wider">{t.clipboard.alertTitle}</h5>
                    <p className="text-[10px] text-[#8E9299] leading-tight truncate max-w-[280px]">{virtualClipboardUrl}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCopiedAlertVisible(false)}
                  className="text-[#8E9299] hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button 
                  onClick={() => setCopiedAlertVisible(false)}
                  className="text-[#8E9299] hover:text-white text-[10px] font-semibold tracking-wide py-1 px-3 rounded bg-[#2C313C]"
                >
                  {t.clipboard.dismiss}
                </button>
                <button 
                  id="btn-alert-add-queue"
                  onClick={handleAddClipboardLinkToQueue}
                  className="bg-indigo-600 hover:bg-indigo-500 font-bold text-[10px] text-white tracking-wide py-1 px-3 rounded-lg flex items-center gap-0.5 shadow cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  {t.clipboard.addButton}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Downloader Live Top Bar Overlay */}
        {activeDownloader && (
          <div className="bg-[#1C1F26] border-b border-[#2C313C] p-2.5 text-xs text-[#E4E6EB] shrink-0 select-none relative overflow-hidden flex items-center justify-between gap-3">
            <span className="absolute left-0 inset-y-0 w-1 bg-indigo-500 animate-pulse" />
            
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-indigo-400 font-semibold block">{t.manager.foregroundServiceActive}</span>
                <span className="text-[10px] text-[#8E9299] block truncate leading-relaxed">
                  Artwork #{activeDownloader.artworkId} ({activeDownloader.progress}%) - {activeDownloader.speed}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={() => handlePauseItem(activeDownloader.id)}
                className="bg-[#2C313C] hover:bg-[#3E4451] text-[#E4E6EB] p-1 rounded font-bold"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleDeleteItem(activeDownloader.id)}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 p-1 rounded border border-red-500/20 font-bold"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main tabs router view */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {currentTab === "browser" && (
            <BrowserView 
              settings={settings}
              t={t}
              onAddFilesToQueue={handleAddBrowserSelectionToQueue}
              onToggleFollowArtist={handleToggleFollowArtist}
            />
          )}

          {currentTab === "downloads" && (
            <DownloadsView 
              t={t}
              language={settings.language}
              downloads={downloads}
              duplicateProtection={settings.duplicateProtection}
              onPauseItem={handlePauseItem}
              onResumeItem={handleResumeItem}
              onDeleteItem={handleDeleteItem}
              onMoveUpItem={handleMoveUpItem}
              onMoveDownItem={handleMoveDownItem}
              onAddUrlsToQueue={addUrlToQueue}
              onImportTxtList={handleImportTxtList}
              onCompressToZip={handleCompressToZip}
              onRedownloadItem={handleRedownloadItem}
            />
          )}

          {currentTab === "settings" && (
            <SettingsView 
              settings={settings}
              t={t}
              onChangeSettings={(updated) => setSettings(updated)}
            />
          )}

        </div>

        {/* Navigation bottom control deck */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-[#1C1F26] border-t border-[#2C313C] flex items-center justify-around z-20 shrink-0 pb-1 flex-row">
          
          <button 
            id="nav-btn-downloads"
            onClick={() => setCurrentTab("downloads")}
            className={`flex flex-col items-center justify-center w-20 h-full transition ${
              currentTab === "downloads" ? "text-indigo-500 font-bold" : "text-[#8E9299] hover:text-white"
            }`}
          >
            <Download className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-1 font-sans">{t.tabs.downloads}</span>
          </button>

          <button 
            id="nav-btn-browser"
            onClick={() => setCurrentTab("browser")}
            className={`flex flex-col items-center justify-center w-20 h-full transition ${
              currentTab === "browser" ? "text-indigo-500 font-bold" : "text-[#8E9299] hover:text-white"
            }`}
          >
            <Globe className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-1 font-sans">{t.tabs.browser}</span>
          </button>

          <button 
            id="nav-btn-settings"
            onClick={() => setCurrentTab("settings")}
            className={`flex flex-col items-center justify-center w-20 h-full transition ${
              currentTab === "settings" ? "text-indigo-500 font-bold" : "text-[#8E9299] hover:text-white"
            }`}
          >
            <SettingsIcon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-1 font-sans">{t.tabs.settings}</span>
          </button>

        </div>

        {/* Manual clipboard copy helpers in workspace margins for seamless interaction */}
        <div className="absolute right-3 bottom-20 z-30 flex flex-col gap-2">
          <button 
            onClick={() => triggerManualClipboardCheck("https://www.pixiv.net/artworks/114227003")}
            className="p-2 border border-[#2C313C] bg-[#1C1F26] hover:bg-[#2C313C] text-indigo-400 rounded-full shadow-lg backdrop-blur"
            title="Simulate Pixiv Link Copy"
          >
            <ClipIcon className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
