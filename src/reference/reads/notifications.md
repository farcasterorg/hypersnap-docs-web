# User notifications

Not to be confused with [mini-app push notifications](../miniapps/index.md) — this endpoint is the in-app "notifications tab" for a single user: replies to their casts, mentions, likes, recasts, new followers.

---

## GET /v2/farcaster/notifications

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `fid` | u64 | yes | The viewer. |
| `limit` | usize | no | Default `10`. |
| `cursor` | string | no | Pagination cursor. |

**Response**

```json
{
  "notifications": [
    {
      "type": "cast-reply",
      "most_recent_timestamp": 1712345678,
      "cast": { /* the triggering cast */ },
      "reactions": [ /* optional aggregate */ ],
      "follows": [ /* optional aggregate */ ]
    }
  ],
  "next": { "cursor": "..." }
}
```

The `type` field discriminates what the notification represents:

- `"cast-mention"` — your FID was `@`-mentioned.
- `"cast-reply"` — a reply to one of your casts.
- `"reaction"` — a like or recast of your cast (aggregated when multiple users do it within a window).
- `"follow"` — someone followed you.

Notifications are aggregated over a short window so that "15 people liked your cast" comes back as one entry with a count, not 15 separate rows.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/notifications"
     data-title="Try /v2/farcaster/notifications"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/notifications/channel

Notifications for `fid` filtered to casts in the specified channel(s). Mentions/replies whose parent cast is in one of the provided channels are returned; everything else is dropped.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `fid` | u64 | yes | The viewer. |
| `channel_ids` | string | yes | Comma-separated channel ids or channel parent URLs. |
| `limit` | usize | no | |
| `cursor` | string | no | |

Channel ids are resolved to parent URLs via the channels index; raw URLs (starting with `http` or `chain://`) are used verbatim.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/notifications/channel"
     data-title="Try /v2/farcaster/notifications/channel"
     data-auth="none"
     data-fields="fid|query|u64||3|required;channel_ids|query|string|comma-separated channel ids|memes,base|required;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/notifications/parent_url

Notifications for `fid` filtered to casts whose `parent_url` matches one of the provided URLs. Same semantics as `/notifications/channel` but accepts raw parent URLs directly.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `fid` | u64 | yes | The viewer. |
| `parent_urls` | string | yes | Comma-separated parent URLs. |
| `limit` | usize | no | |
| `cursor` | string | no | |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/notifications/parent_url"
     data-title="Try /v2/farcaster/notifications/parent_url"
     data-auth="none"
     data-fields="fid|query|u64||3|required;parent_urls|query|string|comma-separated parent URLs||required;limit|query|usize||10;cursor|query|string"></div>

## Write endpoints

`POST /v2/farcaster/notifications/seen` and `POST /v2/farcaster/notifications/mark_seen` are registered but return `501 Not Implemented`. Seen-state is not part of the Farcaster protocol.
