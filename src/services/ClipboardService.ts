import { Clipboard } from "@capacitor/clipboard";

export class ClipboardService {
  /**
   * Reads raw clipboard text safely under any platform (Android Native or Web DevTools).
   */
  static async readClipboardText(): Promise<string | null> {
    try {
      const result = await Clipboard.read();
      return result.value || null;
    } catch (e) {
      // Browser permissions fallback
      try {
        if (navigator.clipboard) {
          return await navigator.clipboard.readText();
        }
      } catch (clipErr) {
        // clipboard access not permitted
      }
      return null;
    }
  }

  /**
   * Sanitizes copy streams and extracts physical Pixiv Artwork IDs.
   */
  static extractArtworkId(text: string): string | null {
    if (!text) return null;
    const trimmed = text.trim();
    
    // Support complete links, localized links, and pure numeric ids
    const matches = trimmed.match(/artworks\/(\d+)/) || trimmed.match(/pixiv\.net.*?illust_id=(\d+)/) || trimmed.match(/^(\d{8,11})$/);
    return matches ? matches[1] : null;
  }
}
