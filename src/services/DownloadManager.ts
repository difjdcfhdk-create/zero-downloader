import { DownloadItem, AppSettings } from "../types";
import { StorageManager } from "./StorageManager";
import { ZipManager } from "./ZipManager";
import { NotificationService } from "./NotificationService";
import { BackgroundService } from "./BackgroundService";

// Holds cancellation status for paused operations
const pausedTasks = new Set<string>();

// Cache of downloaded image blobs to enable manual ZIP compression on command
const downloadedBlobsCache: Record<string, Blob[]> = {};

export class DownloadManager {
  /**
   * Retrieves memory cached Blobs for manual ZIP compression.
   */
  static getCachedBlobs(id: string): Blob[] {
    return downloadedBlobsCache[id] || [];
  }

  /**
   * Registers a task as paused.
   */
  static pause(id: string) {
    pausedTasks.add(id);
  }

  /**
   * Clears a task's paused status.
   */
  static resume(id: string) {
    pausedTasks.delete(id);
  }

  /**
   * Checks if a task is currently paused.
   */
  static isPaused(id: string): boolean {
    return pausedTasks.has(id);
  }

  /**
   * Downloads a single image Blob through our referer-bypassing proxy, calculating downloaded bytes.
   */
  static async downloadFileBlob(
    proxiedUrl: string,
    onProgressUpdate: (bytes: number) => void
  ): Promise<Blob> {
    const res = await fetch(proxiedUrl);
    if (!res.ok) {
      throw new Error(`Referer proxy reported HTTP error: ${res.status}`);
    }

    // Capture precise content-length
    const contentLength = res.headers.get("content-length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    
    const reader = res.body?.getReader();
    if (!reader) {
      // Fallback for older browsers
      const blob = await res.blob();
      onProgressUpdate(blob.size);
      return blob;
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        onProgressUpdate(value.length);
      }
    }

    return new Blob(chunks);
  }

  /**
   * Main orchestrator processing a full artwork post download.
   */
  static async runDownloadTask(
    item: DownloadItem,
    settings: AppSettings,
    onStateChange: (updated: DownloadItem) => void
  ): Promise<void> {
    // Return early if paused before starting
    if (this.isPaused(item.id)) {
      item.status = "paused";
      onStateChange({ ...item });
      return;
    }

    await BackgroundService.startService();

    item.status = "active";
    item.downloadedCount = 0;
    item.progress = 0;
    item.speed = "0 KB/s";
    onStateChange({ ...item });

    // Ensure we have links to download
    const urls = item.imageUrls;
    if (!urls || urls.length === 0) {
      item.status = "failed";
      onStateChange({ ...item });
      NotificationService.sendFailed(item.artworkId, "No image urls parsed.");
      return;
    }

    const indicesToDownload = item.selectedIndices && item.selectedIndices.length > 0 
      ? item.selectedIndices 
      : Array.from({ length: urls.length }, (_, i) => i);

    const totalToDownload = indicesToDownload.length;
    const downloadedBlobs: Blob[] = new Array(urls.length);

    let completedIndicesCount = 0;
    let totalDownloadedBytes = 0;
    const startTimeStamp = Date.now();

    // Semaphore worker queue pool limit
    const poolLimit = Math.max(1, Math.min(5, settings.simultaneousDownloads || 3));
    const queue = [...indicesToDownload];
    const activePromises: Promise<any>[] = [];

    const processIndex = async (idx: number) => {
      if (this.isPaused(item.id)) {
        throw new Error("PAUSED");
      }

      const proxiedUrl = urls[idx];
      let retryCount = 0;
      const maxRetries = settings.autoRetry ? 3 : 1;
      let blobSuccess = false;

      while (retryCount < maxRetries && !blobSuccess) {
        try {
          if (this.isPaused(item.id)) {
            throw new Error("PAUSED");
          }

          const blob = await this.downloadFileBlob(proxiedUrl, (bytes) => {
            totalDownloadedBytes += bytes;
            
            // Calculate speed
            const elapsedSecs = (Date.now() - startTimeStamp) / 1000;
            const speedBytesPerSec = elapsedSecs > 0 ? totalDownloadedBytes / elapsedSecs : 0;
            
            let speedStr = "0 KB/s";
            if (speedBytesPerSec > 1024 * 1024) {
              speedStr = `${(speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
            } else if (speedBytesPerSec > 1024) {
              speedStr = `${(speedBytesPerSec / 1024).toFixed(0)} KB/s`;
            }

            // Estimate total size
            const averageSizePerPart = totalDownloadedBytes / Math.max(1, completedIndicesCount + 0.5);
            const estimatedTotalSize = averageSizePerPart * totalToDownload;
            let totalSizeStr = "Calculating size...";
            if (estimatedTotalSize > 1024 * 1024) {
              totalSizeStr = `${(estimatedTotalSize / (1024 * 1024)).toFixed(1)} MB`;
            } else {
              totalSizeStr = `${(estimatedTotalSize / 1024).toFixed(0)} KB`;
            }

            // Progress tracking
            const rawProgress = Math.min(
              99,
              Math.round((completedIndicesCount / totalToDownload) * 100 + (bytes / averageSizePerPart) * (100 / totalToDownload))
            );

            item.speed = speedStr;
            item.totalSize = totalSizeStr;
            item.progress = isNaN(rawProgress) ? item.progress : rawProgress;
            onStateChange({ ...item });

            // Push background native notifications
            NotificationService.sendProgress(item.artworkId, item.artworkTitle, item.progress, speedStr);
          });

          downloadedBlobs[idx] = blob;
          blobSuccess = true;
        } catch (err: any) {
          if (err.message === "PAUSED") throw err;
          retryCount++;
          if (retryCount >= maxRetries) {
            console.warn(`Failed image slot #${idx} after multiple retry attempts.`);
          }
        }
      }

      if (!blobSuccess) {
        throw new Error(`Item image parts lost`);
      }

      completedIndicesCount++;
      item.downloadedCount = completedIndicesCount;
      item.progress = Math.round((completedIndicesCount / totalToDownload) * 100);
      onStateChange({ ...item });
    };

    // Run parallel queue pool
    try {
      while (queue.length > 0 || activePromises.length > 0) {
        if (this.isPaused(item.id)) {
          throw new Error("PAUSED");
        }

        while (queue.length > 0 && activePromises.length < poolLimit) {
          const nextIndex = queue.shift()!;
          const promise = processIndex(nextIndex).then(() => {
            activePromises.splice(activePromises.indexOf(promise), 1);
          });
          activePromises.push(promise);
        }

        // Wait for first worker to complete
        if (activePromises.length > 0) {
          await Promise.race(activePromises);
        }
      }

      // Check if finished task is paused
      if (this.isPaused(item.id)) {
        throw new Error("PAUSED");
      }

      // Compute total size string
      let finalBytes = totalDownloadedBytes;
      let sizeStr = "0.0 KB";
      if (finalBytes > 1024 * 1024) {
        sizeStr = `${(finalBytes / (1024 * 1024)).toFixed(1)} MB`;
      } else {
        sizeStr = `${(finalBytes / 1024).toFixed(0)} KB`;
      }

      // PERSIST DIRECTORY OR BUNDLE ZIP IN ACCORDANCE WITH USER SETTINGS
      const folderLocation = settings.downloadLocation || "Zero/Downloads";
      let filePath = "";

      if (settings.zipMode) {
        const compactBlobs = downloadedBlobs.filter(Boolean);
        const zipBlob = await ZipManager.compressBlobs(compactBlobs, item.artworkId);
        filePath = await StorageManager.saveFile(`${item.artworkId}.zip`, zipBlob, folderLocation);
        item.isZip = true;
        item.zipName = `${item.artworkId}.zip`;
      } else {
        // Save raw images systematically
        for (let i = 0; i < downloadedBlobs.length; i++) {
          const b = downloadedBlobs[i];
          if (b) {
            const ext = b.type.split("/")[1] || "jpg";
            await StorageManager.saveFile(
              `${item.artworkId}_${i + 1}.${ext}`,
              b,
              `${folderLocation}/${item.artworkId}`
            );
          }
        }
        item.isZip = false;
        filePath = `${folderLocation}/${item.artworkId}`;
      }

      item.status = "completed";
      item.progress = 100;
      item.speed = "0 KB/s";
      item.totalSize = sizeStr;
      item.filePath = filePath;
      item.downloadDate = new Date().toLocaleString();
      
      // Save downloaded blobs to memory cache for manual zipping support
      downloadedBlobsCache[item.id] = downloadedBlobs.filter(Boolean);
      
      onStateChange({ ...item });

      NotificationService.sendComplete(item.artworkId, item.artworkTitle);
      await BackgroundService.stopService();

    } catch (err: any) {
      await BackgroundService.stopService();
      if (err.message === "PAUSED" || this.isPaused(item.id)) {
        item.status = "paused";
        item.speed = "0 KB/s";
        onStateChange({ ...item });
        NotificationService.clear(item.artworkId);
      } else {
        console.error("Downloader engine task failed:", err);
        item.status = "failed";
        item.speed = "0 KB/s";
        onStateChange({ ...item });
        NotificationService.sendFailed(item.artworkId, err.message || "Fragment chunk failure");
      }
    }
  }
}
