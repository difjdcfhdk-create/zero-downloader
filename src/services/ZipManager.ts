import JSZip from "jszip";
import { StorageManager } from "./StorageManager";

export class ZipManager {
  /**
   * Compresses a sequence of raw image Blobs into a single ZIP Blob.
   */
  static async compressBlobs(blobs: Blob[], baseFileName: string): Promise<Blob> {
    const zipFile = new JSZip();
    
    blobs.forEach((blob, idx) => {
      if (blob) {
        // Safe mapping with descriptive index naming
        const extension = blob.type.split("/")[1] || "jpg";
        zipFile.file(`${baseFileName}_${idx + 1}.${extension}`, blob);
      }
    });

    return await zipFile.generateAsync({ type: "blob" });
  }

  /**
   * Compresses and saves files immediately as .zip file onto local disk.
   */
  static async saveAsZipArchive(
    blobs: Blob[],
    artworkId: string,
    downloadLocation: string
  ): Promise<string> {
    const zipBlob = await this.compressBlobs(blobs, artworkId);
    const filename = `${artworkId}.zip`;
    return await StorageManager.saveFile(filename, zipBlob, downloadLocation);
  }
}
