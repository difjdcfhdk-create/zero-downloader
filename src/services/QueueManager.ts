import { DownloadItem, AppSettings, Language } from "../types";
import { ClipboardService } from "./ClipboardService";

export class QueueManager {
  /**
   * Processes input strings, extracts Pixiv Artwork IDs, and maps them to clean Queue items.
   */
  static processAndEnqueue(
    urlText: string,
    currentDownloads: DownloadItem[],
    settings: AppSettings
  ): { addedItems: DownloadItem[]; duplicateCount: number } {
    const lines = urlText.split("\n").map(line => line.trim()).filter(Boolean);
    const addedItems: DownloadItem[] = [];
    let duplicateCount = 0;

    lines.forEach(line => {
      const id = ClipboardService.extractArtworkId(line);
      if (!id) return;

      // Duplicate filtering checks
      if (settings.duplicateProtection) {
        const isDuplicateInQueue = currentDownloads.some(
          d => d.artworkId === id && d.status !== "failed"
        );
        const isDuplicateInAdded = addedItems.some(d => d.artworkId === id);
        
        if (isDuplicateInQueue || isDuplicateInAdded) {
          duplicateCount++;
          return;
        }
      }

      // Safe creation of standard DownloadItem
      const item: DownloadItem = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        artworkId: id,
        artworkTitle: `Artwork Illustration #${id}`,
        artistName: "Connecting...",
        totalImages: 0,
        downloadedCount: 0,
        status: "queued",
        speed: "0 KB/s",
        progress: 0,
        totalSize: "Calculating size...",
        imageUrls: [],
        selectedIndices: [],
        isZip: settings.zipMode,
        filePath: "",
        errorCount: 0
      };

      addedItems.push(item);
    });

    return { addedItems, duplicateCount };
  }

  /**
   * Moves a queue task upwards.
   */
  static moveUp(id: string, downloads: DownloadItem[]): DownloadItem[] {
    const list = [...downloads];
    const idx = list.findIndex(item => item.id === id);
    if (idx > 0) {
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
    }
    return list;
  }

  /**
   * Moves a queue task downwards.
   */
  static moveDown(id: string, downloads: DownloadItem[]): DownloadItem[] {
    const list = [...downloads];
    const idx = list.findIndex(item => item.id === id);
    if (idx !== -1 && idx < list.length - 1) {
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
    }
    return list;
  }
}
