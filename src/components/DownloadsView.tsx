import React, { useState, useRef } from "react";
import { Download, Play, Pause, Trash2, ArrowUp, ArrowDown, FileText, Copy, Plus, Folder, CheckCircle2, XCircle, AlertCircle, RefreshCw, FileImage, Archive } from "lucide-react";
import { DownloadItem, Language } from "../types";
import { TRANSLATIONS } from "../data/translations";

interface DownloadsViewProps {
  t: typeof TRANSLATIONS.en;
  language: Language;
  downloads: DownloadItem[];
  duplicateProtection: boolean;
  onPauseItem: (id: string) => void;
  onResumeItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onMoveUpItem: (id: string) => void;
  onMoveDownItem: (id: string) => void;
  onAddUrlsToQueue: (urls: string) => string[];
  onImportTxtList: (content: string) => void;
  onCompressToZip: (id: string) => void;
  onRedownloadItem: (id: string) => void;
}

export default function DownloadsView({
  t,
  language,
  downloads,
  duplicateProtection,
  onPauseItem,
  onResumeItem,
  onDeleteItem,
  onMoveUpItem,
  onMoveDownItem,
  onAddUrlsToQueue,
  onImportTxtList,
  onCompressToZip,
  onRedownloadItem
}: DownloadsViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "queued" | "completed" | "failed">("all");
  
  // Custom dialogs
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [pastedUrlsInput, setPastedUrlsInput] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Local storage folder browser simulation
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [browsingFolderId, setBrowsingFolderId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter downloads based on tabs
  const filteredDownloads = downloads.filter(item => {
    if (activeTab === "all") return true;
    return item.status === activeTab;
  });

  // Export TXT of links
  const handleExportTxt = () => {
    const urls = downloads.map(d => `https://www.pixiv.net/artworks/${d.artworkId}`).join("\n");
    const blob = new Blob([urls], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zero_pixiv_queue_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import TXT handler
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onImportTxtList(text);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset
  };

  // Submit URLs to master queue
  const submitUrls = () => {
    if (!pastedUrlsInput.trim()) return;
    const addedIds = onAddUrlsToQueue(pastedUrlsInput);
    if (addedIds.length === 0) {
      setDuplicateWarning(t.manager.duplicateDetected.replace("{id}", "entered"));
      setTimeout(() => setDuplicateWarning(null), 3000);
    }
    setPastedUrlsInput("");
    setShowAddUrlModal(false);
  };

  // Open simulated local device storage directory
  const handleOpenFolderBrowser = (artworkId: string) => {
    setBrowsingFolderId(artworkId);
    setShowFolderBrowser(true);
  };

  const getSimulatedFilesForArtwork = (artworkId: string) => {
    const item = downloads.find(d => d.artworkId === artworkId);
    if (!item) return [];

    const fileList = [];
    if (item.isZip) {
      fileList.push({ name: `${artworkId}.zip`, type: "zip", size: item.totalSize });
    } else {
      for (const idx of item.selectedIndices) {
        fileList.push({ name: `${idx + 1}.jpg`, type: "jpg", size: "450 KB" });
      }
    }
    return fileList;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0F1115] text-[#E4E6EB] select-none pb-20 overflow-hidden font-sans text-left">
      
      {/* 1DM Action bar for Import, Export, Add Links */}
      <div className="bg-[#1C1F26] p-3 border-b border-[#2C313C] flex items-center justify-between shadow-md shrink-0">
        <h2 className="text-xs font-bold font-mono text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
          <Download className="w-4 h-4 text-indigo-400" />
          <span>{language === Language.AR ? "مدير التحميلات 1DM" : "1DM Downloads Panel"}</span>
        </h2>

        <div className="flex items-center gap-2">
          {/* Add popup */}
          <button 
            id="btn-add-url-modal"
            onClick={() => setShowAddUrlModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded-lg text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.manager.addUrl}</span>
          </button>

          {/* TXT Imports */}
          <button 
            onClick={handleImportClick}
            className="bg-[#2C313C] hover:bg-[#3E4451] p-1.5 rounded-lg text-gray-300 text-xs flex items-center gap-1 cursor-pointer border border-[#3E4451]"
          >
            <FileText className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] sm:inline">{t.manager.importTxt}</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".txt" 
            className="hidden" 
          />

          {/* TXT Exports */}
          <button 
            onClick={handleExportTxt}
            disabled={downloads.length === 0}
            className="bg-[#2C313C] hover:bg-[#3E4451] disabled:opacity-40 p-1.5 rounded-lg text-gray-300 text-xs flex items-center gap-1 cursor-pointer border border-[#3E4451]"
          >
            <Copy className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[10px] sm:inline">{t.manager.exportTxt}</span>
          </button>
        </div>
      </div>

      {/* 1DM Category Selector Tabs Bar */}
      <div className="bg-[#1C1F26] border-b border-[#2C313C] flex gap-1 p-1 shrink-0 shadow-lg">
        {(["all", "active", "queued", "completed", "failed"] as const).map(tab => {
          const count = downloads.filter(d => tab === "all" ? true : d.status === tab).length;
          return (
            <button
              key={tab}
              id={`tab-dl-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-1 text-[10px] font-bold rounded-lg transition text-center flex flex-col items-center justify-center ${
                activeTab === tab 
                  ? "bg-indigo-600 text-white shadow shadow-indigo-600/20" 
                  : "text-[#8E9299] hover:text-white"
              }`}
            >
              <span>{t.downloadTabs[tab]}</span>
              <span className={`text-[8px] px-1 rounded-full mt-0.5 ${activeTab === tab ? "bg-black/30 text-white" : "bg-[#2C313C] text-gray-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Downloads List scroll wrapper */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        
        {duplicateWarning && (
          <div className="bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl text-center text-xs text-red-400 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{duplicateWarning}</span>
          </div>
        )}

        {filteredDownloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-[#8E9299]">
            <AlertCircle className="w-10 h-10 mb-2 opacity-30 text-indigo-400" />
            <p className="text-xs">{t.manager.noDownloads}</p>
          </div>
        ) : (
          filteredDownloads.map((item, index) => {
            const hasError = item.status === "failed";
            
            return (
              <div 
                key={item.id}
                className={`p-3 bg-[#1C1F26] rounded-xl border transition relative flex items-center justify-between gap-3 group hover:border-indigo-500/50 ${
                  item.status === "active" ? "border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]" : "border-[#2C313C]"
                }`}
              >
                {/* Visual Status Colored Strip */}
                <span className={`absolute left-0 inset-y-0 w-1 ${
                  item.status === "active" ? "bg-indigo-500" :
                  item.status === "queued" ? "bg-amber-500" :
                  item.status === "completed" ? "bg-green-500" :
                  item.status === "failed" ? "bg-red-500" : "bg-[#2C313C]"
                }`} />

                {/* Left hand details info */}
                <div className="flex-1 min-w-0 pl-1.5">
                  <div className="flex items-center gap-1.5">
                    {item.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                    {item.status === "failed" && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    
                    <h3 className="text-xs font-semibold text-[#E4E6EB] truncate font-mono">
                      {item.artworkTitle}
                    </h3>
                  </div>

                  <p className="text-[10px] text-[#8E9299] font-sans mt-0.5">
                    ID: {item.artworkId} • {t.manager.imagesCount} <span className="text-indigo-400 font-semibold">{item.downloadedCount}/{item.totalImages}</span> ({item.isZip ? "ZIP Bundle" : "Raw jpg"})
                  </p>

                  {/* Speeds & Progress bars for Active/Queued items */}
                  {(item.status === "active" || item.status === "queued" || item.status === "paused") && (
                    <div className="mt-2 space-y-1">
                      {/* Percent counters */}
                      <div className="flex justify-between items-center text-[9px] font-mono text-[#8E9299]">
                        <span className="text-indigo-400 font-semibold">{item.progress}%</span>
                        {item.status === "active" && (
                          <span className="flex items-center gap-1">
                            <span>{item.speed}</span> • <span>{item.totalSize}</span>
                          </span>
                        )}
                        {item.status === "queued" && <span className="text-amber-500">{t.manager.queueStatus}</span>}
                        {item.status === "paused" && <span className="text-gray-500">PAUSED</span>}
                      </div>

                      {/* 1DM progress bar tracker */}
                      <div className="w-full bg-[#2C313C] rounded-full h-2 relative overflow-hidden border border-[#3E4451]">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.status === "active" ? "bg-indigo-500 shadow-[0_0_8px_#6366f1]" : "bg-[#3E4451]"
                          }`} 
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Completed downloads date & action details */}
                  {item.status === "completed" && (
                    <div className="text-[9px] text-[#8E9299] font-mono mt-1 flex items-center justify-between">
                      <span>{item.downloadDate || "Recent"}</span>
                      <span>Hashed Size: {item.totalSize}</span>
                    </div>
                  )}

                  {/* Failed indicators */}
                  {item.status === "failed" && (
                    <div className="text-[9px] bg-red-900/10 border border-red-900/20 text-red-400 p-1 rounded-md mt-1 flex items-center gap-1 font-mono">
                      <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                      <span>Missing data chunks detected, verification failed. Retry needed.</span>
                    </div>
                  )}
                </div>

                {/* Right hand layout operations matching 1DM speed controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  
                  {/* Up/Down priority sorting hooks */}
                  {(item.status === "queued" || item.status === "active") && (
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => onMoveUpItem(item.id)}
                        className="p-0.5 bg-[#2C313C] hover:bg-[#3E4451] text-[#8E9299] hover:text-white rounded transition-colors"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => onMoveDownItem(item.id)}
                        className="p-0.5 bg-[#2C313C] hover:bg-[#3E4451] text-[#8E9299] hover:text-white rounded transition-colors"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Pause / Resume Controls on active layouts */}
                  {item.status === "active" && (
                    <button 
                      onClick={() => onPauseItem(item.id)}
                      className="p-1 px-2 border border-[#3E4451] bg-[#2C313C] hover:bg-[#3E4451] text-indigo-400 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                    >
                      <Pause className="w-3 h-3" />
                      <span>{t.manager.actions.pause}</span>
                    </button>
                  )}

                  {item.status === "paused" && (
                    <button 
                      onClick={() => onResumeItem(item.id)}
                      className="p-1 px-2 border border-[#3E4451] bg-[#2C313C] hover:bg-[#3E4451] text-green-400 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>{t.manager.actions.retry}</span>
                    </button>
                  )}

                  {/* Completed downloads directory / ZIP tools */}
                  {item.status === "completed" && (
                    <div className="flex items-center gap-1">
                      {/* Open folder browser simulation */}
                      <button 
                        onClick={() => handleOpenFolderBrowser(item.artworkId)}
                        className="p-1.5 bg-[#2C313C] border border-[#3E4451] text-indigo-400 rounded-lg text-xs hover:bg-[#3E4451] flex items-center gap-0.5 cursor-pointer transition-colors"
                        title={t.manager.actions.openFolder}
                      >
                        <Folder className="w-3.5 h-3.5" />
                      </button>

                      {/* Convert raw folder to single Zip */}
                      {!item.isZip && (
                        <button 
                          onClick={() => onCompressToZip(item.id)}
                          className="p-1.5 bg-[#2C313C] border border-[#3E4451] text-green-400 rounded-lg text-xs hover:bg-[#3E4451] flex items-center gap-0.5 cursor-pointer transition-colors"
                          title={t.manager.actions.compressZip}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Re-download artwork */}
                      <button 
                        onClick={() => onRedownloadItem(item.id)}
                        className="p-1.5 bg-[#2C313C] text-[#E4E6EB] border border-[#3E4451] rounded-lg text-xs hover:bg-[#3E4451] cursor-pointer transition-colors"
                        title={t.manager.actions.redownload}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Failed state retry triggers */}
                  {item.status === "failed" && (
                    <button 
                      onClick={() => onRedownloadItem(item.id)}
                      className="p-1.5 px-2 bg-[#2C313C] border border-[#3E4451] text-red-400 rounded-lg text-[10px] font-semibold hover:bg-[#3E4451] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t.manager.actions.retry}</span>
                    </button>
                  )}

                  {/* Delete record permanently */}
                  <button 
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition cursor-pointer"
                    title={t.manager.actions.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD CUSTOM URL OR BULK URLS MANUALLY */}
      {showAddUrlModal && (
        <div id="add-url-modal-backdrop" className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1F26] border border-[#2C313C] p-5 rounded-2xl w-full max-w-sm shadow-2xl relative">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-400" />
              {t.manager.addUrl}
            </h3>
            <p className="text-[10px] text-[#8E9299] mb-4 font-sans leading-relaxed">
              Manually add single or multiple URLs. One link per line. Paste and click queue.
            </p>

            <textarea
              id="txt-add-urls"
              value={pastedUrlsInput}
              onChange={(e) => setPastedUrlsInput(e.target.value)}
              placeholder={t.manager.urlInputPlaceholder}
              className="w-full h-32 bg-[#0F1115] border border-[#2C313C] text-xs p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-mono placeholder:text-gray-600 leading-normal"
            />

            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setShowAddUrlModal(false)}
                className="flex-1 bg-[#2C313C] hover:bg-[#3E4451] border border-[#3E4451] py-2.5 rounded-xl text-xs text-gray-300 font-semibold cursor-pointer transition-colors"
              >
                {t.downloadOpts.cancel}
              </button>
              <button 
                id="btn-confirm-add-urls"
                onClick={submitUrls}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                {t.manager.addBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / VIEW: SIMULATED LOCAL DEVICE FILE EXPLORER (Zero/ Root) */}
      {showFolderBrowser && browsingFolderId && (
        <div className="fixed inset-0 z-40 bg-[#0F1115] text-[#E4E6EB] flex flex-col p-4">
          <div className="flex items-center justify-between border-b border-[#2C313C] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-white">
                {t.folders.title} <span className="text-indigo-400">{browsingFolderId}</span>
              </h2>
            </div>
            <button 
              onClick={() => {
                setShowFolderBrowser(false);
                setBrowsingFolderId(null);
              }}
              className="bg-[#2C313C] hover:bg-[#3E4451] border border-[#3E4451] text-xs py-1.5 px-3 rounded-xl font-semibold cursor-pointer transition-colors text-white"
            >
              {t.folders.backBtn}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {getSimulatedFilesForArtwork(browsingFolderId).length === 0 ? (
              <p className="text-xs text-[#8E9299] italic text-center py-20">{t.folders.empty}</p>
            ) : (
              getSimulatedFilesForArtwork(browsingFolderId).map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#1C1F26] border border-[#2C313C] rounded-xl">
                  <div className="flex items-center gap-3">
                    {file.type === "zip" ? (
                      <Archive className="w-6 h-6 text-green-400 shrink-0" />
                    ) : (
                      <FileImage className="w-6 h-6 text-indigo-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-medium font-mono text-[#E4E6EB] block">{file.name}</span>
                      <span className="text-[10px] text-[#8E9299] font-mono">Location: Zero/{browsingFolderId}/{file.name}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#8E9299]">{file.size}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
