import { PixivPost, ArtistProfile } from "../types";

export class PixivService {
  /**
   * Submits the PHPSESSID cookie to the Express proxy session state.
   */
  static async login(sessionCookie: string): Promise<boolean> {
    try {
      const res = await fetch("/api/pixiv/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionCookie })
      });
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.loggedIn;
    } catch (e) {
      console.error("Pixiv authentication failed:", e);
      return false;
    }
  }

  /**
   * Gets trending artwork listings.
   */
  static async getTrendingFeed(): Promise<PixivPost[]> {
    const res = await fetch("/api/pixiv/trending");
    if (!res.ok) throw new Error("Trending crawl failed");
    const data = await res.json();
    return data.illusts || [];
  }

  /**
   * Dynamic keyword-based autocomplete and illust search.
   */
  static async searchArtworks(query: string): Promise<PixivPost[]> {
    if (!query || query.trim() === "") {
      return this.getTrendingFeed();
    }
    const res = await fetch(`/api/pixiv/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Live search failed");
    const data = await res.json();
    return data.illusts || [];
  }

  /**
   * Crawls full metadata detail of artwork, capturing multiple pages and manga posts.
   */
  static async getArtworkDetails(id: string): Promise<PixivPost> {
    const res = await fetch(`/api/pixiv/artwork/${id}`);
    if (!res.ok) throw new Error(`Server artwork fetch #${id} failed`);
    const data = await res.json();
    if (!data.post) throw new Error(`Parser metadata is missing for #${id}`);
    return data.post;
  }

  /**
   * Fetch full public portfolio profiles.
   */
  static async getArtistProfile(id: string): Promise<ArtistProfile> {
    const res = await fetch(`/api/pixiv/artist/${id}`);
    if (!res.ok) throw new Error(`Server artist user #${id} failed`);
    const data = await res.json();
    if (!data.artist) throw new Error(`Artist mapping missing for user #${id}`);
    return data.artist;
  }
}
