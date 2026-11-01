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
  // A Super Fan subscriber, as their last chat, gift or Super Fan event said.
  superfan: boolean;
  // When Tokio last saw them, in ms since the epoch.
  seenAt: number;
}

// Up to 100 fans, the highest fan level first, then the most recently seen.
export interface FansData {
  fans: Fan[];
}

// A viewer who sent gifts, with their coins and gifts in this LIVE and in
// every LIVE the profile kept. Only gifts count, not treasure chests or Super
// Fan subscriptions.
export interface TopGifter {
  userId: string;
  username: string;
  handle: string;
  // TikTok's link from their latest gift, "" when TikTok sent none. It expires
  // about 2 days after TikTok sends it: fall back to something, such as their
  // initial, when it fails to load.
  picture: string;
  // 0 coins and 0 gifts for someone who hasn't sent gifts in this LIVE.
  live: { coins: number; gifts: number };
  allTime: { coins: number; gifts: number };
  // When their last gift came, in ms since the epoch.
  giftedAt: number;
}

// The top 10 by coins: in this LIVE ([] while Tokio isn't connected), and
// across every LIVE the profile kept, this one included. Ties go to whoever
// got there first.
export interface GiftersData {
  live: TopGifter[];
  allTime: TopGifter[];
}
