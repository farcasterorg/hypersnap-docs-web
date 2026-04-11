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
