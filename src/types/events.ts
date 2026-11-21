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
  // The platform's id for the account, which stays when the handle changes.
  // Other platforms' start with their name ("twitch:1234", "youtube:UC…"),
  // so they never match TikTok's, which are saved bare. A YouTube Gift's
  // sender has no channel id in its chat, so theirs is "youtube:@handle".
  userId?: string;
  // Where the viewer is. Missing means TikTok.
  platform?: "tiktok" | "twitch" | "youtube";
}

// A chat message translated by Tokio's Chat translation. Codes are lowercase
// BCP 47 tags, like "en" and "zh-hans".
export interface ChatTranslation {
  text: string;
  // The language the message was in
  from: string;
  // The language the streamer picked
  to: string;
}

export interface ChatData {
  user: UserData;
  comment: {
    // As the viewer typed it. Emotes' indexes point into it.
    content: string;
    emotes: Emotes[];
    lang: string;
    // Only when Chat translation is on and the message was in another
    // language
    translation?: ChatTranslation;
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

// A paid subscription, new or renewed: Twitch's, or a YouTube membership
export interface SubscribeData {
  user: UserData;
  // The platform's own tier: "1000", "2000", "3000" or "prime" on Twitch;
  // "" on YouTube, whose channels name their own levels
  tier: string;
  // Months subscribed so far, 1 for a new one
  months: number;
  // What the viewer wrote with it, "" for nothing
  message: string;
}

// Subscriptions a viewer gave to others, all at once
export interface GiftSubData {
  user: UserData;
  count: number;
  tier: string;
}

// Bits a viewer spent on Twitch: a cheer, or a Power-up
export interface CheerData {
  user: UserData;
  bits: number;
  // A cheer's message without its cheermotes, "" for none
  message: string;
}

// Another channel sending its viewers over: the user is its streamer
export interface RaidData {
  user: UserData;
  viewers: number;
}

// A channel points reward a viewer redeemed on Twitch
export interface RedeemData {
  user: UserData;
  reward: { id: string; title: string; cost: number };
  // What the reward asked the viewer to type, "" for none
  input: string;
}

// A Super Chat or Super Sticker a viewer bought on YouTube
export interface SuperChatData {
  user: UserData;
  // As YouTube shows it, in the viewer's currency: "$4.99", "MX$100.00"
  amount: string;
  // What the viewer wrote, "" for none or a sticker
  message: string;
  // A Super Sticker's picture, "" for a Super Chat
  sticker: string;
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
  // Missing means TikTok
  platform?: "tiktok" | "twitch";
}

// The top 10 by coins: in this LIVE ([] while Tokio isn't connected), and
// across every LIVE the profile kept, this one included. Ties go to whoever
// got there first.
export interface GiftersData {
  live: TopGifter[];
  allTime: TopGifter[];
}
