export interface UserData {
  username: string;
  handle: string;
  profilePictures: string[];
  superfan?: boolean;
  follower?: boolean;
  moderator?: boolean;
  fanLevel?: number;
  // The picture of the fan level's badge: a heart that changes every 10
  // levels, without the number. Draw fanLevel next to it.
  fanBadge?: string;
  // TikTok's id for the account, which stays when the handle changes.
  userId?: string;
}

export interface ChatData {
  user: UserData;
  comment: {
    content: string;
    emotes: Emotes[];
    lang: string;
  };
}

export type RoomUserData = {
  ranks: (UserData & { score: number; position: number })[];
  views: number;
  viewers: number;
};

export interface Emotes {
  emoteID: string;
  index: number;
  images: string[];
}

export interface ShareData {
  shareCount: number;
  user: UserData;
}

interface SingleUserData {
  user: UserData;
}

export type FollowData = SingleUserData;

export type SuperFanData = SingleUserData;

export type MemberJoinData = SingleUserData;

export type SuperFanJoinData = SingleUserData;

export interface GiftData {
  user: UserData;
  gift: {
    id: string;
    coins: number;
    repeatEnd: boolean;
    type: number;
    name: string;
    comboCount: number;
    image: string;
  };
}

export interface LikeData {
  user: UserData;
  likeCount: number;
  totalLikes: number;
}

export type MusicInfo = {
  title: string;
  thumbnail: string;
  playing: boolean;
  played: boolean;
};

// The whole music request queue.
export type MusicChangeData = MusicInfo[];

// A fan the streamer's profile keeps, as Tokio last saw them in a LIVE. No
// profile picture: TikTok's links expire within days. The badge's don't.
export interface Fan {
  userId: string;
  username: string;
  handle: string;
  fanLevel: number;
  fanBadge: string;
  // When Tokio last saw them, in ms since the epoch.
  seenAt: number;
}

// Up to 100 fans, the highest fan level first, then the most recently seen.
export interface FansData {
  fans: Fan[];
}
