export type localPlaylistItem = {
  title: string;
  videoId: string | null;
};

export type YouTubePlaylistItemListResponse = {
  kind: string;
  etag: string;
  items: YouTubePlaylistItem[];
};

export type YouTubePlaylistItem = {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
      standard?: YouTubeThumbnail;
      maxres?: YouTubeThumbnail;
    };
    channelTitle: string;
    playlistId: string;
    position: number;
    resourceId: {
      kind: string;
      videoId: string;
    };
    videoOwnerChannelTitle: string;
    videoOwnerChannelId: string;
  };
};

type YouTubeThumbnail = {
  url: string;
  width: number;
  height: number;
};
