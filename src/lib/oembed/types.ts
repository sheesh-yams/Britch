export interface OEmbedResult {
  embedHtml?: string;
  thumbnailUrl?: string;
  title?: string;
  authorName?: string;
}

export interface OEmbedProvider {
  resolve(url: string): Promise<OEmbedResult>;
}
