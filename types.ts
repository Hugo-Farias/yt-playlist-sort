export type RenderedPlaylistItem = {
  videoId: string | null;
};

export type YouTubePlaylistItem = {
  kind: "youtube#playlistItem";
  etag: string;
  id: string;
  available?: boolean;
  contentDetails: {
    videoId: string;
    videoPublishedAt: string; // ISO 8601 date-time string
  };
};

export type YoutubePlaylistResponse = {
  kind: "youtube#playlistItemListResponse";
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  items: YouTubePlaylistItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
};

export type ApiCache = {
  items: { [videoId: string]: { videoPublishedAt: number } };
  listId: string;
  storeTime: number;
  extVersion: string;
};

export type countryIs = {
  ip: string;
  country: string;
};

export type YouTubeVideoResponse = {
  kind: "youtube#videoListResponse";
  etag: string;
  items: Array<{
    kind: "youtube#video";
    etag: string;
    id: string;
    contentDetails: {
      duration: string; // ISO 8601 duration
      dimension: "2d" | "3d";
      definition: "sd" | "hd";
      caption: "true" | "false";
      licensedContent: boolean;
      regionRestriction?: {
        blocked?: string[];
      };
      contentRating: Record<string, unknown>; // could be more specific if needed
      projection: string;
    };
    status: {
      uploadStatus: string;
      privacyStatus: string;
      license: string;
      embeddable: boolean;
      publicStatsViewable: boolean;
      madeForKids: boolean;
    };
  }>;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
};
