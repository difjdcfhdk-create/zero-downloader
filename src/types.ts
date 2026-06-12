export enum Language {
  EN = "en",
  AR = "ar"
}

export interface TranslationConfig {
  autoTranslateBrowser: boolean;
  targetLanguage: Language;
}

export interface ArtworkImage {
  id: string;
  url: string;
  selected: boolean;
}

export interface PixivPost {
  id: string;
  title: string;
  titleOriginal: string;
  description: string;
  descriptionOriginal: string;
  artistId: string;
  artistName: string;
  artistAvatar: string;
  tags: string[];
  tagsOriginal: string[];
  images: ArtworkImage[];
  likeCount: number;
  viewCount: number;
  comments: PixivComment[];
}

export interface PixivComment {
  username: string;
  avatar: string;
  text: string;
  textOriginal: string;
}

export interface ArtistProfile {
  id: string;
  name: string;
  avatar: string;
  followers: number;
  isFollowing: boolean;
  artworks: PixivPost[];
}

export interface DownloadItem {
  id: string; // Dynamic queue uuid or Artwork ID + timestamp
  artworkId: string;
  artworkTitle: string;
  artistName: string;
  totalImages: number;
  downloadedCount: number;
  status: "active" | "queued" | "completed" | "failed" | "paused";
  speed: string; // e.g. "1.8 MB/s"
  progress: number; // 0 to 100
  totalSize: string; // e.g., "47.2 MB"
  imageUrls: string[];
  selectedIndices: number[]; // which indices to download
  isZip: boolean;
  zipName?: string;
  downloadDate?: string;
  filePath: string; // Zero/ArtworkID or ArtworkID.zip
  errorCount: number;
}

export interface AppSettings {
  language: Language;
  autoDetectLanguage: boolean;
  translationSettings: TranslationConfig;
  downloadLocation: string;
  zipMode: boolean;
  simultaneousDownloads: number; // 1 to 5
  autoRetry: boolean;
  clipboardMonitor: boolean;
  duplicateProtection: boolean;
  backgroundImageUrl: string | null;
  backgroundImageOpacity: number;
  pixivUsername: string | null;
}
