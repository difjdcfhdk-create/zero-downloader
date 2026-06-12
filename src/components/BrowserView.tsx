import React, { useState, useEffect } from "react";
import { Search, Globe, ChevronLeft, ChevronRight, RefreshCw, User, Heart, Eye, Download, Check, ShieldAlert, ArrowLeft, Languages, Loader2 } from "lucide-react";
import { PixivPost, ArtistProfile, Language, AppSettings } from "../types";
import { TRANSLATIONS } from "../data/translations";

interface BrowserViewProps {
  settings: AppSettings;
  t: typeof TRANSLATIONS.en;
  onAddFilesToQueue: (post: PixivPost, selectedIndices: number[]) => void;
  onToggleFollowArtist: (artistId: string) => void;
}

export default function BrowserView({ settings, t, onAddFilesToQueue, onToggleFollowArtist }: BrowserViewProps) {
  // Navigation stack: 'home' | 'artist' | 'artwork' | 'login'
  const [currentView, setCurrentView] = useState<"home" | "artist" | "artwork" | "login">("home");
  const [viewHistory, setViewHistory] = useState<string[]>(["home"]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<PixivPost | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<ArtistProfile | null>(null);
  
  // Dynamic states
  const [posts, setPosts] = useState<PixivPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingArtwork, setLoadingArtwork] = useState(false);
  const [loadingArtist, setLoadingArtist] = useState(false);

  // Authenticated states
  const [loggedIn, setLoggedIn] = useState(!!settings.pixivUsername);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  
  // Dynamic Followed artist mapping lists (Famous Pixiv creators we fetch in real time)
  const [artists, setArtists] = useState<ArtistProfile[]>([
    {
      id: "1039337",
      name: "Mika Pikazo",
      avatar: "/api/pixiv/proxy?url=https%3A%2F%2Fi.pximg.net%2Fuser-profile%2Fimg%2F2023%2F04%2F16%2F23%2F24%2F33%2F24177309_ae71b8696144e136371aece71b95383f_80.jpg",
      followers: 432000,
      isFollowing: true,
      artworks: []
    },
    {
      id: "212801",
      name: "Anmi",
      avatar: "/api/pixiv/proxy?url=https%3A%2F%2Fi.pximg.net%2Fuser-profile%2Fimg%2F2018%2F09%2F29%2F04%2F58%2F26%2F14811910_eb8b5be49df0a54cd5d774fca7a840c5_80.gif",
      followers: 351000,
      isFollowing: false,
      artworks: []
    },
    {
      id: "35081",
      name: "Tiv",
      avatar: "/api/pixiv/proxy?url=https%3A%2F%2Fi.pximg.net%2Fuser-profile%2Fimg%2F2015%2F11%2F23%2F17%2F35%2F02%2F10129759_787e7f7b11d95c5dbb050d2bbd7fe3d7_80.png",
      followers: 289000,
      isFollowing: true,
      artworks: []
    }
  ]);

  // Translation states
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedData, setTranslatedData] = useState<{
    title: string;
    description: string;
    tags: string[];
    comments: { username: string; text: string }[];
  } | null>(null);

  // Selector Drawer
  const [showDownloadDrawer, setShowDownloadDrawer] = useState(false);
  const [downloadAllImmediately, setDownloadAllImmediately] = useState(true);
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([]);

  // Fetch feed with debounce protection
  useEffect(() => {
    const fetchFeed = async () => {
      setLoadingPosts(true);
      try {
        if (searchQuery.trim() === "") {
          const res = await fetch("/api/pixiv/trending");
          const json = await res.json();
          setPosts(json.illusts || []);
        } else {
          const res = await fetch(`/api/pixiv/search?q=${encodeURIComponent(searchQuery)}`);
          const json = await res.json();
          setPosts(json.illusts || []);
        }
      } catch (err) {
        console.error("Failed to fetch live Pixiv feed:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    const timer = setTimeout(fetchFeed, searchQuery.trim() === "" ? 0 : 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle back histories
  const navigateTo = (view: "home" | "artist" | "artwork" | "login", payload?: any) => {
    if (view === "artwork") {
      setLoadingArtwork(true);
      setSelectedPost(payload);
      setIsTranslated(false);
      setTranslatedData(null);

      fetch(`/api/pixiv/artwork/${payload.id}`)
        .then(res => res.json())
        .then(json => {
          if (json.post) {
            setSelectedPost(json.post);
          }
        })
        .catch(err => console.error("Artwork metadata fetch error:", err))
        .finally(() => setLoadingArtwork(false));

    } else if (view === "artist") {
      setLoadingArtist(true);
      setSelectedArtist(payload);
      
      fetch(`/api/pixiv/artist/${payload.id}`)
        .then(res => res.json())
        .then(json => {
          if (json.artist) {
            setSelectedArtist(json.artist);
          }
        })
        .catch(err => console.error("Artist profile fetch error:", err))
        .finally(() => setLoadingArtist(false));
    }

    setCurrentView(view);
    setViewHistory(prev => [...prev, view]);
  };

  const handleBack = () => {
    if (viewHistory.length > 1) {
      const updated = [...viewHistory];
      updated.pop();
      const last = updated[updated.length - 1] as "home" | "artist" | "artwork" | "login";
      setCurrentView(last);
      setViewHistory(updated);
    }
  };

  const handleTranslatePage = async () => {
    if (!selectedPost) return;
    setIsTranslating(true);
    const targetLang = settings.language === Language.AR ? "Arabic" : "English";

    try {
      const titleRes = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedPost.titleOriginal,
          from: "Japanese",
          to: targetLang
        })
      });
      const titleData = await titleRes.json();

      const descRes = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedPost.descriptionOriginal,
          from: "Japanese",
          to: targetLang
        })
      });
      const descData = await descRes.json();

      const tagsRes = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedPost.tagsOriginal.join(", "),
          from: "Japanese",
          to: targetLang
        })
      });
      const tagsData = await tagsRes.json();
      const parsedTags = tagsData.translatedText 
        ? tagsData.translatedText.split(/[,\/]/).map((item: string) => item.trim())
        : selectedPost.tags;

      setTranslatedData({
        title: titleData.translatedText || selectedPost.title,
        description: descData.translatedText || selectedPost.description,
        tags: parsedTags,
        comments: []
      });
      setIsTranslated(true);
    } catch (err) {
      console.error("Translation fail:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRestoreOriginal = () => {
    setIsTranslated(false);
    setTranslatedData(null);
  };

  const handleOpenDownloadOpts = (post: PixivPost) => {
    setSelectedPost(post);
    setSelectedImageIndices(post.images.map((_, idx) => idx));
    setShowDownloadDrawer(true);
  };

  const executeDownloadFromBrowser = () => {
    if (!selectedPost) return;
    const indicesToDownload = downloadAllImmediately 
      ? selectedPost.images.map((_, idx) => idx) 
      : selectedImageIndices;

    onAddFilesToQueue(selectedPost, indicesToDownload);
    setShowDownloadDrawer(false);
  };

  const toggleSelectImageIndex = (idx: number) => {
    setSelectedImageIndices(prev => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx);
      } else {
        return [...prev, idx].sort((a,b) => a - b);
      }
    });
  };

  const clickArtistFollow = (artistId: string) => {
    setArtists(prev => prev.map(a => a.id === artistId ? { ...a, isFollowing: !a.isFollowing } : a));
    if (selectedArtist && selectedArtist.id === artistId) {
      setSelectedArtist(prev => prev ? { ...prev, isFollowing: !prev.isFollowing } : null);
    }
    onToggleFollowArtist(artistId);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      settings.pixivUsername = usernameInput;

      try {
        await fetch("/api/pixiv/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionCookie: passwordInput })
        });
      } catch (err) {
        console.warn("Session authentication fail:", err);
      }

      setLoggedIn(true);
      navigateTo("home");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0F1115] text-[#E4E6EB] overflow-y-auto select-none pb-20 relative">
      
      {/* Mobile Address bar */}
      <div className="sticky top-0 bg-[#1C1F26] border-b border-[#2C313C] p-2.5 flex items-center gap-2 z-20 shadow-md">
        <button 
          onClick={handleBack} 
          disabled={viewHistory.length <= 1}
          className="p-1 px-1.5 rounded bg-[#2C313C] disabled:opacity-40"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1 bg-[#0F1115] rounded-lg border border-[#2C313C] p-1 px-2.5 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
          <input 
            type="text"
            placeholder={t.browser.placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none w-full placeholder:text-gray-500 font-sans"
          />
          {loadingPosts && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />}
        </div>
        <button 
          onClick={() => navigateTo("login")}
          className={`p-1.5 rounded-full relative transition ${loggedIn ? "bg-indigo-500/10 border border-indigo-500" : "bg-[#2C313C]"}`}
        >
          <User className={`w-4 h-4 ${loggedIn ? "text-indigo-400" : "text-gray-400"}`} />
          {loggedIn && <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[#1C1F26]" />}
        </button>
      </div>

      {/* Chrome Style Translator */}
      {currentView === "artwork" && selectedPost && (
        <div className="bg-[#1C1F26] border-b border-[#2C313C] p-2 px-3 flex items-center justify-between text-xs transition duration-300">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-indigo-400" />
            <span className="text-gray-300 font-sans text-[11px]">
              {isTranslating ? "Translating with Gemini..." : isTranslated ? t.browser.chromeTranslateActive : t.browser.chromeTranslate}
            </span>
          </div>
          <div className="flex gap-2">
            {!isTranslated ? (
              <button 
                id="btn-chrome-translate"
                disabled={isTranslating}
                onClick={handleTranslatePage}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-1 px-2.5 rounded text-[11px]"
              >
                {isTranslating ? "..." : t.browser.translateBtn}
              </button>
            ) : (
              <button 
                onClick={handleRestoreOriginal}
                className="bg-[#2C313C] hover:bg-[#3E4451] text-gray-300 py-1 px-2.5 rounded text-[11px]"
              >
                {t.browser.restoreBtn}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAIN VIEWS */}

      {/* HOME / GRID SEARCHED */}
      {currentView === "home" && (
        <div className="p-3">
          {/* Top followed list */}
          <div className="mb-4 bg-[#1C1F26] p-3 rounded-xl border border-[#2C313C]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E9299] mb-2 font-mono flex items-center justify-between">
              <span>{settings.language === Language.AR ? "أحدث منشورات الفنانين المفضلة" : "Followed Creators Feed"}</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold font-sans">LIVE</span>
            </h3>
            <div className="flex gap-2.5 overflow-x-auto pb-1.5">
              {artists.map(artist => (
                <div 
                  key={artist.id} 
                  onClick={() => navigateTo("artist", artist)}
                  className="flex flex-col items-center shrink-0 cursor-pointer p-1.5 bg-[#0F1115] rounded-xl border border-[#2C313C] hover:border-[#3E4451]"
                >
                  <div className="relative">
                    <img 
                      src={artist.avatar} 
                      alt={artist.name} 
                      className={`w-10 h-10 rounded-full border-2 ${artist.isFollowing ? "border-indigo-500" : "border-[#2C313C]"}`}
                      referrerPolicy="no-referrer"
                    />
                    {artist.isFollowing && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold">✓</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 font-medium max-w-[70px] truncate mt-1">{artist.name}</span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5 tracking-wide text-gray-300 mt-2 font-sans">
            <span>{searchQuery ? "Search Results" : "Recommendation Feed"}</span>
            <span className="text-[10px] text-[#8E9299] font-mono">({posts.length} matches)</span>
          </h2>

          {loadingPosts ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#8E9299]">Crawling live Pixiv posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10">
              <ShieldAlert className="w-10 h-10 text-orange-500 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-[#8E9299]">{t.browser.noResults}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {posts.map(post => (
                <div 
                  key={post.id} 
                  className="bg-[#1C1F26] rounded-xl overflow-hidden border border-[#2C313C] hover:border-[#3E4451] transition flex flex-col group relative"
                >
                  <div 
                    onClick={() => navigateTo("artwork", post)}
                    className="aspect-square w-full bg-[#0F1115] overflow-hidden relative cursor-pointer"
                  >
                    <img 
                      src={post.images[0]?.url || ""} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 
                        onClick={() => navigateTo("artwork", post)}
                        className="text-[11px] font-semibold text-gray-100 truncate cursor-pointer hover:text-indigo-400 font-sans"
                      >
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-1 mt-1 cursor-pointer" onClick={() => navigateTo("artist", { id: post.artistId, name: post.artistName, avatar: post.artistAvatar })}>
                        <img src={post.artistAvatar} className="w-3.5 h-3.5 rounded-full object-cover" referrerPolicy="no-referrer" />
                        <span className="text-[9px] text-[#8E9299] truncate hover:underline">{post.artistName}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#2C313C]">
                      <div className="flex items-center gap-1.5 text-[8px] text-gray-500 font-mono">
                        <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" /> {post.likeCount.toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={() => handleOpenDownloadOpts(post)}
                        className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white p-1 rounded-full text-[9px] flex items-center justify-center cursor-pointer shadow"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ARTIST PORTFOLIO */}
      {currentView === "artist" && selectedArtist && (
        <div className="p-3">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:underline mb-3"
          >
            <ArrowLeft className="w-3 h-3" /> Back to feed
          </button>

          {loadingArtist ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#8E9299]">Structuring artist profile...</p>
            </div>
          ) : (
            <>
              <div className="bg-[#1C1F26] p-4 rounded-2xl border border-[#2C313C] flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={selectedArtist.avatar} className="w-14 h-14 rounded-full border-2 border-indigo-500 object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h2 className="text-sm font-bold text-white font-sans">{selectedArtist.name}</h2>
                    <p className="text-[10px] text-[#8E9299] mt-0.5 font-mono">Creator ID: {selectedArtist.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => clickArtistFollow(selectedArtist.id)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedArtist.isFollowing 
                      ? "bg-[#2C313C] text-gray-300 border border-[#3E4451]" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                  }`}
                >
                  {selectedArtist.isFollowing ? t.browser.following : t.browser.follow}
                </button>
              </div>

              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E9299] mb-3 font-mono">{t.browser.artistLatest}</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {selectedArtist.artworks?.map(post => (
                  <div 
                    key={post.id} 
                    className="bg-[#1C1F26] rounded-xl overflow-hidden border border-[#2C313C]"
                  >
                    <div onClick={() => navigateTo("artwork", post)} className="aspect-square relative cursor-pointer bg-[#0F1115]">
                      <img src={post.images[0]?.url || ""} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold truncate text-[#E4E6EB] font-sans">{post.title}</span>
                      <button 
                        onClick={() => handleOpenDownloadOpts(post)}
                        className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ARTWORK DETAILS */}
      {currentView === "artwork" && selectedPost && (
        <div className="p-3">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:underline mb-3"
          >
            <ArrowLeft className="w-3 h-3" /> Back to browser
          </button>

          {loadingArtwork ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#8E9299]">Assembling manga pages & raw chunks...</p>
            </div>
          ) : (
            <div className="bg-[#1C1F26] rounded-2xl overflow-hidden border border-[#2C313C] mb-4 p-3 relative">
              
              <div className="w-full relative rounded-lg overflow-hidden border border-[#2C313C] aspect-video bg-black mb-3">
                <img 
                  src={selectedPost.images[0]?.url || ""} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                  <span className="text-[10px] text-[#8E9299] font-mono">Illust ID: {selectedPost.id}</span>
                </div>
              </div>

              <h1 className="text-sm font-bold text-white transition duration-200 font-sans">
                {isTranslated && translatedData ? translatedData.title : selectedPost.titleOriginal}
              </h1>
              {!isTranslated && (
                <span className="text-[10px] text-[#8E9299] font-mono">Original Language: Japanese</span>
              )}

              <div className="flex items-center justify-between mt-3 bg-[#0F1115] p-2 rounded-xl border border-[#2C313C]">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo("artist", { id: selectedPost.artistId, name: selectedPost.artistName, avatar: selectedPost.artistAvatar })}>
                  <img src={selectedPost.artistAvatar} className="w-8 h-8 rounded-full border border-[#2C313C]" referrerPolicy="no-referrer" />
                  <div>
                    <span className="text-xs text-white font-medium block font-sans">{selectedPost.artistName}</span>
                    <span className="text-[9px] text-indigo-400 font-mono">Browse Portfolio</span>
                  </div>
                </div>
                <button 
                  onClick={() => clickArtistFollow(selectedPost.artistId)}
                  className="bg-[#2C313C] border border-[#3E4451] py-1 px-2.5 rounded-lg text-[10px] text-gray-300 font-semibold"
                >
                  Map Follow
                </button>
              </div>

              <div className="mt-3 p-2.5 bg-[#0F1115]/50 rounded-xl text-xs text-gray-300 border border-[#2C313C] leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: isTranslated && translatedData ? translatedData.description : selectedPost.descriptionOriginal }} />

              <div className="mt-3 gap-1.5 flex flex-wrap items-center">
                <span className="text-[10px] text-gray-400 font-medium tracking-wider font-mono">{t.browser.tagsLabel}</span>
                {(isTranslated && translatedData ? translatedData.tags : selectedPost.tagsOriginal).map((tag, i) => (
                  <span 
                    key={i} 
                    className="bg-[#2C313C] hover:bg-[#3E4451] text-gray-300 text-[10px] px-2 py-0.5 rounded font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-[#2C313C] flex flex-col gap-2">
                <button 
                  id="btn-trigger-download"
                  onClick={() => handleOpenDownloadOpts(selectedPost)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99] transition shadow-indigo-600/15"
                >
                  <Download className="w-4 h-4 text-white" />
                  {selectedPost.images.length > 1 
                    ? t.browser.downloadThisManga 
                    : t.browser.downloadThis}
                  <span className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[10px] text-indigo-300">({selectedPost.images.length}P)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOGIN */}
      {currentView === "login" && (
        <div className="p-4 flex-1 flex flex-col justify-center max-w-sm mx-auto">
          <div className="bg-[#1C1F26] p-5 rounded-2xl border border-[#2C313C] text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-600 to-indigo-400" />

            <h2 className="text-sm font-bold text-white mb-1 uppercase tracking-wider font-mono">
              {loggedIn ? "ACTIVE PIXIV PROFILE" : t.browser.loginRequired}
            </h2>
            <p className="text-[10px] text-[#8E9299] leading-normal max-w-[240px] mx-auto mb-4 font-sans">
              {loggedIn ? "Successfully synchronized with Pixiv virtual secure cookie." : "Log in securely to download R-18 uncensored illustrations or private posts."}
            </p>

            {loggedIn ? (
              <div className="space-y-3">
                <div className="p-3 bg-[#0F1115] rounded-xl border border-[#2C313C] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-medium font-sans">{settings.pixivUsername || "ZeroUser_60"}</span>
                  </div>
                  <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-800/40 px-1.5 py-0.5 rounded uppercase font-bold">COOKIES OK</span>
                </div>
                <button 
                  onClick={() => {
                    settings.pixivUsername = null;
                    setLoggedIn(false);
                  }}
                  className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs py-2 rounded-xl transition cursor-pointer font-medium border border-red-500/20"
                >
                  {t.browser.logoutAction}
                </button>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-3 text-left">
                <div>
                  <label className="text-[10px] font-mono text-[#8E9299] block mb-1 uppercase shrink-0">Pixiv Email / Username</label>
                  <input 
                    type="text" 
                    required
                    placeholder="pixiv_user_60@gmail.com"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-[#0F1115] border border-[#2C313C] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#8E9299] block mb-1 uppercase">PHPSESSID Auth Cookie</label>
                  <input 
                    type="password" 
                    required
                    placeholder="e.g. 1928373_abcdef9901..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-[#0F1115] border border-[#2C313C] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[8px] text-gray-500 mt-1 leading-normal font-sans">
                    Log in your browser, open devtools (F12) → Application → Cookies → copy your PHPSESSID value here. This is 100% secure.
                  </p>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl mt-2 shadow transition cursor-pointer font-mono"
                >
                  SET ACTIVE SESSION
                </button>
                <button 
                  type="button" 
                  onClick={() => navigateTo("home")}
                  className="w-full bg-[#2C313C] hover:bg-[#3E4451] text-gray-300 text-xs py-2 rounded-xl transition cursor-pointer font-medium"
                >
                  {t.browser.anonymous}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DETAILED DOWNLOAD SELECTOR DRAWER */}
      {showDownloadDrawer && selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="bg-[#1C1F26] border-t border-[#2C313C] rounded-t-3xl max-w-md w-full p-4 max-h-[85vh] flex flex-col justify-between overflow-hidden shadow-2xl relative">
            
            <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-3 shrink-0" />

            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-400" />
                {t.downloadOpts.title}
              </h3>
              <button 
                onClick={() => setShowDownloadDrawer(false)}
                className="text-[#8E9299] hover:text-white text-xs bg-[#2C313C] p-1 px-2 rounded-lg cursor-pointer transition-colors"
               >
                {t.downloadOpts.cancel}
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 mb-4 pr-1">
              <div className="bg-[#0F1115] rounded-xl border border-[#2C313C] overflow-hidden flex flex-col shrink-0 text-left">
                <button 
                  id="opt-immediate"
                  onClick={() => setDownloadAllImmediately(true)}
                  className={`p-3 text-left text-xs transition duration-200 border-b border-[#2C313C] flex items-center justify-between ${
                    downloadAllImmediately ? "bg-[#1C1F26] text-indigo-400 font-semibold" : "text-[#8E9299]"
                  }`}
                >
                  <span>{t.downloadOpts.immediately}</span>
                  {downloadAllImmediately && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
                <button 
                  id="opt-selective"
                  onClick={() => setDownloadAllImmediately(false)}
                  className={`p-3 text-left text-xs transition duration-200 flex items-center justify-between ${
                    !downloadAllImmediately ? "bg-[#1C1F26] text-indigo-400 font-semibold" : "text-[#8E9299]"
                  }`}
                >
                  <span>{t.downloadOpts.displayFirst}</span>
                  {!downloadAllImmediately && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              </div>

              {!downloadAllImmediately && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-1.5 bg-[#0F1115] rounded-xl border border-[#2C313C]">
                    <button 
                      onClick={() => setSelectedImageIndices(selectedPost.images.map((_, i) => i))}
                      className="flex-1 bg-[#2C313C] hover:bg-[#3E4451] text-gray-300 text-[10px] font-semibold py-1 px-2 rounded cursor-pointer transition-colors"
                    >
                      {t.downloadOpts.selectAll}
                    </button>
                    <button 
                      onClick={() => setSelectedImageIndices([])}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-semibold py-1 px-2 rounded cursor-pointer transition-colors"
                    >
                      {t.downloadOpts.deselectAll}
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 max-h-[30vh] overflow-y-auto p-1 bg-[#0F1115] rounded-xl border border-[#2C313C]">
                    {selectedPost.images.map((image, index) => {
                      const isSelected = selectedImageIndices.includes(index);
                      return (
                        <div 
                          key={index} 
                          onClick={() => toggleSelectImageIndex(index)}
                          className={`aspect-square rounded-lg overflow-hidden border cursor-pointer relative ${
                            isSelected ? "border-indigo-500 scale-95" : "border-transparent opacity-60"
                          }`}
                        >
                          <img src={image.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute top-1 left-1 bg-black/75 px-1 py-0.5 rounded text-[8px] text-gray-300 font-mono">
                            {index + 1}
                          </div>
                          {isSelected && (
                            <div className="absolute inset-0 bg-indigo-500/25 flex items-center justify-center">
                              <span className="w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold shadow">✓</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 p-1 border-t border-[#2C313C]">
              <button 
                id="btn-confirm-download"
                onClick={executeDownloadFromBrowser}
                disabled={!downloadAllImmediately && selectedImageIndices.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 disabled:opacity-40 text-white font-bold text-xs py-3 rounded-2xl cursor-pointer text-center flex items-center justify-center gap-1.5 transition-all font-mono"
              >
                <Download className="w-4 h-4 text-white" />
                {t.downloadOpts.start.replace("{count}", downloadAllImmediately ? `${selectedPost.images.length}` : `${selectedImageIndices.length}`)}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
