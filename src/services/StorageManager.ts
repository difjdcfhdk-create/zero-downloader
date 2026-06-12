import { Filesystem, Directory } from "@capacitor/filesystem";

export class StorageManager {
  /**
   * Safe check if current runtime supports native device folders.
   */
  static isNative(): boolean {
    return typeof window !== "undefined" && (window as any).Capacitor?.isNative;
  }

  /**
   * Creates a dedicated subfolder hierarchy under native Documents.
   */
  static async createFolder(subfolder: string): Promise<boolean> {
    try {
      await Filesystem.mkdir({
        path: subfolder,
        directory: Directory.Documents,
        recursive: true
      });
      return true;
    } catch (e) {
      // directory likely already exists
      return false;
    }
  }

  /**
   * Saves raw Binary content to local disk natively OR falls back to browser link downloading.
   */
  static async saveFile(filename: string, blob: Blob, subfolder: string): Promise<string> {
    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1] || result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Ensure directory is created
      await this.createFolder(subfolder);

      const filePath = `${subfolder}/${filename}`;
      await Filesystem.writeFile({
        path: filePath,
        data: base64Data,
        directory: Directory.Documents
      });

      console.log(`StorageManager write success: ${filePath}`);
      return filePath;
    } catch (err) {
      console.warn("Native file save not available or failed (using web downloads):", err);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      return `${subfolder}/${filename}`;
    }
  }

  /**
   * Permanently deletes folders from external native filesystems
   */
  static async deleteFolderRecursively(subfolder: string): Promise<boolean> {
    try {
      await Filesystem.rmdir({
        path: subfolder,
        directory: Directory.Documents,
        recursive: true
      });
      return true;
    } catch (err) {
      console.warn("Native folder delete not possible:", err);
      return false;
    }
  }
}
