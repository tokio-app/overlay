# Tokio Overlays Handler

Receive TikTok LIVE events from [Tokio](https://tokio.ialfaro.com) in your stream overlays.

Tokio connects to a TikTok LIVE and sends its events (chat, gifts, likes, follows, music requests and more) to overlays over a local WebSocket. This library connects to it, reconnects when Tokio restarts, and hands you each event with typed data. It also receives the events Tokio's previews post to the overlay's iframe, so every overlay you import into Tokio needs it.

It has no dependencies and ships an ES module, a CommonJS build and a browser build, with TypeScript types. Formerly `tokio-event-loader`.

## Install

```sh
npm install @tokioapp/overlay
```

Or load the browser build from a CDN. It defines a global `TokioOverlay`:

```html
<script src="https://unpkg.com/@tokioapp/overlay@1"></script>
```

## The setup block

Your overlay's `index.html` must contain a `<script id="tokio-setup">` block. Write it yourself, before the scripts that read it:

```html
<script id="tokio-setup">
  window.__OVERLAY_ID__ = "";
  window.__OVERLAY_CONFIG__ = { title: "Likes" };
</script>
```

- `window.__OVERLAY_ID__` is required. Pass it to `tokio.connect`.
- `window.__OVERLAY_CONFIG__` is only for overlays with settings (`config: true` in `info.yaml`). Give it your `config.yaml` defaults.

Tokio rewrites the block with the overlay's ID and saved settings when it imports the overlay, and again when the streamer saves its settings. The values you write are what the page uses outside Tokio. Tokio refuses to import an overlay without the block.

If you build the overlay with a framework, keep the block in the `index.html` template so it survives the build. See [Building an overlay](https://tokio.ialfaro.com/docs/developers/building-an-overlay/) for the folder layout, `info.yaml` and `config.yaml`.

## Usage

```js
import { tokio, TOKIO_EVENTS } from "@tokioapp/overlay";

tokio.on(TOKIO_EVENTS.LIKE, (data) => {
  console.log(`${data.user.username} liked, ${data.totalLikes} likes in total`);
});

tokio.connect(window.__OVERLAY_ID__);
```

### In a plain HTML page

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script src="https://unpkg.com/@tokioapp/overlay@1"></script>
    <script id="tokio-setup">
      window.__OVERLAY_ID__ = "";
      window.__OVERLAY_CONFIG__ = { title: "Likes" };
    </script>
  </head>
  <body>
    <h1 id="title">Likes</h1>
    <p id="likes">0</p>

    <script>
      const { tokio, TOKIO_EVENTS } = TokioOverlay;
      const title = document.getElementById("title");
      const likes = document.getElementById("likes");

      const apply = (config) => {
        title.textContent = config.title;
      };

      apply(window.__OVERLAY_CONFIG__);
      // Sent when the streamer saves the overlay's settings.
      tokio.on(TOKIO_EVENTS.CONFIG, apply);

      tokio.on(TOKIO_EVENTS.LIKE, (data) => {
        likes.textContent = data.totalLikes;
      });

      tokio.connect(window.__OVERLAY_ID__);
    </script>
  </body>
</html>
```

### In React

`tokio.on` returns its own unsubscribe function, so it fits an effect's cleanup:

```jsx
useEffect(
  () => tokio.on(TOKIO_EVENTS.LIKE, (data) => setLikes(data.totalLikes)),
  [],
);
```

Call `tokio.connect` once, when the overlay starts, not in each component.

### Testing while you build

Before you import the overlay, its ID is still empty. To test it:

1. In Tokio, turn on **Settings → Overlay Server**.
2. Create an ID under **Tools → Test Overlays**.
3. Connect with it, for example `tokio.connect("<test ID>")`, and open the overlay in your browser.
4. Click **Test**. Tokio sends your overlay every LIVE event, carrying on from your last test: the same viewers come back, likes and coins add up, and a gift streak grows over a few clicks before it ends.

Switch back to `window.__OVERLAY_ID__` before you import it.

## API

### `tokio.connect(id, wsurl?)`

Connects to Tokio. Calling it again closes the previous connection first.

| Parameter | Description                                                                               |
| --------- | ----------------------------------------------------------------------------------------- |
| `id`      | The overlay ID, from `window.__OVERLAY_ID__`. Without one, it logs a warning and returns. |
| `wsurl`   | The WebSocket server. Defaults to `ws://localhost:37891`.                                 |

If Tokio isn't running or the connection drops, it keeps retrying: first after 2 to 3 seconds, then less often, up to every 30 seconds. Each attempt times out after 5 seconds.

Inside Tokio's own previews (the overlay cards in the app), it doesn't open a WebSocket. Tokio posts the events to the preview's iframe instead, and the loader only accepts them from the app page that embeds it.

### `tokio.disconnect()`

Closes the connection. No `CLOSE` event is sent for it. Subscribers stay registered, so you can call `connect` again.

### `tokio.on(event, callback)`

Subscribes `callback` to an event and returns a function that unsubscribes it. You can subscribe before or after `connect`. If a callback throws, the error is logged and the other callbacks still run.

### `tokio.off(event, callback)`

Removes a callback added with `on`.

## Events

Use the `TOKIO_EVENTS` constants. Messages with an unknown event are logged and ignored.

### LIVE events

| Constant         | Event name                 | Sent when                               |
| ---------------- | -------------------------- | --------------------------------------- |
| `CHAT`           | `tokio:event:chat`         | A viewer sends a chat message           |
| `FOLLOW`         | `tokio:event:follow`       | A viewer follows you                    |
| `SHARE`          | `tokio:event:share`        | A viewer shares the LIVE                |
| `LIKE`           | `tokio:event:like`         | A viewer likes the LIVE                 |
| `GIFT`           | `tokio:event:gift`         | A viewer sends a gift                   |
| `ENVELOPE`       | `tokio:event:envelope`     | A treasure envelope is sent             |
| `SUPER_FAN`      | `tokio:event:superfan`     | A viewer becomes a Super Fan            |
| `SUPER_FAN_BOX`  | `tokio:event:superfanbox`  | A Super Fan box is sent                 |
| `SUPER_FAN_JOIN` | `tokio:event:superfanjoin` | A Super Fan joins the LIVE              |
| `MEMBER_JOIN`    | `tokio:event:memberjoin`   | A viewer joins the LIVE                 |
| `ROOM_USER`      | `tokio:event:roomuser`     | The viewer count and top viewers change |
| `MUSIC_CHANGE`   | `tokio:event:music:change` | The music request queue changes         |

### Library events

| Constant | Event name     | Sent when                                                                             |
| -------- | -------------- | ------------------------------------------------------------------------------------- |
| `OPEN`   | `tokio:open`   | The connection to Tokio opens, also after each reconnect                              |
| `CLOSE`  | `tokio:close`  | The connection closes or an attempt fails. A failed one has code 1006, not `wasClean` |
| `ERROR`  | `tokio:error`  | The connection fails or times out                                                     |
| `CONFIG` | `tokio:config` | The streamer saves the overlay's settings                                             |

### Data

Each event's data has a type named after it:

| Event                               | Type               | Data                                                                      |
| ----------------------------------- | ------------------ | ------------------------------------------------------------------------- |
| `CHAT`                              | `ChatData`         | `{ user, comment: { content, emotes, lang } }`                            |
| `FOLLOW`                            | `FollowData`       | `{ user }`                                                                |
| `SHARE`                             | `ShareData`        | `{ user, shareCount }`                                                    |
| `LIKE`                              | `LikeData`         | `{ user, likeCount, totalLikes }`                                         |
| `GIFT`                              | `GiftData`         | `{ user, gift: { id, name, coins, type, comboCount, repeatEnd, image } }` |
| `SUPER_FAN`                         | `SuperFanData`     | `{ user }`                                                                |
| `SUPER_FAN_JOIN`                    | `SuperFanJoinData` | `{ user }`                                                                |
| `MEMBER_JOIN`                       | `MemberJoinData`   | `{ user }`                                                                |
| `ROOM_USER`                         | `RoomUserData`     | `{ views, viewers, ranks: (UserData & { score, position })[] }`           |
| `MUSIC_CHANGE`                      | `MusicChangeData`  | The whole queue, `MusicInfo[]`: `{ title, thumbnail, playing, played }`   |
| `CLOSE`                             | `CloseData`        | `{ code, reason, wasClean }`                                              |
| `ERROR`                             | `ErrorData`        | `{ type: "error", message, error }`                                       |
| `CONFIG`                            | `ConfigData`       | The settings, the same object as `window.__OVERLAY_CONFIG__`              |
| `ENVELOPE`, `SUPER_FAN_BOX`, `OPEN` |                    | none                                                                      |

`user` is the viewer who triggered the event:

```ts
interface UserData {
  username: string; // display name
  handle: string; // @handle
  profilePictures: string[];
  superfan?: boolean;
  follower?: boolean;
  moderator?: boolean;
  fanLevel?: number;
}
```

Each chat emote is `{ emoteID, index, images }`. A gift's `image` is the URL of its picture. A gift setting in `ConfigData` is a `CustomGift`: `{ value, label, img, coins }`. A table setting is a list of rows, each an object of its cells keyed by column id, every cell read like a setting of its type. A font setting is a font's name, or `""` for your overlay's own font.

A gift streak sends several `GIFT` events with a growing `comboCount`. The last one has `repeatEnd: true`; react to that one for a single reaction per combo.

## TypeScript

Event data is typed from the event you subscribe to. To name a type, import it:

```ts
import { tokio, TOKIO_EVENTS, type GiftData } from "@tokioapp/overlay";

const onGift = (data: GiftData) => {
  if (data.gift.repeatEnd) showGift(data.user, data.gift);
};

tokio.on(TOKIO_EVENTS.GIFT, onGift);
```

Besides the data types above, the package exports `UserData`, `Emotes`, `MusicInfo`, `CustomGift`, `EventMap` (each event's data) and `TokioPayload` (a message from Tokio).

To type the setup block's values:

```ts
import type { ConfigData } from "@tokioapp/overlay";

declare global {
  interface Window {
    __OVERLAY_ID__: string;
    __OVERLAY_CONFIG__: ConfigData; // generic config type, you can use your own.
  }
}
```

## Raw WebSocket

Overlays you import into Tokio need the library, since Tokio's previews post their events to the overlay's iframe. A page you don't import can connect a WebSocket itself, to `ws://localhost:37891/?id=<overlay ID>`. Each message is JSON with the event name and its data:

```json
{
  "type": "tokio:event:like",
  "data": { "user": {}, "likeCount": 5, "totalLikes": 1200 }
}
```

## Development

```sh
yarn install
yarn build      # dist/: index.es.js, index.cjs, index.umd.js and the types
yarn typecheck  # tsc
yarn lint       # oxlint
yarn format     # prettier
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), checked by a commitlint hook.

### Releasing

Bump `version` in `package.json`, commit, and push a matching tag:

```sh
git tag v1.0.1
git push origin v1.0.1
```

The [Publish](.github/workflows/publish.yml) workflow checks the code, publishes the version to npm and creates its GitHub release. Prereleases such as `1.1.0-beta.1` are published under the `next` tag.

## License

[MIT](LICENSE)
