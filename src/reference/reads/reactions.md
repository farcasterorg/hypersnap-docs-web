# Reactions

Reactions are likes and recasts. Hypersnap indexes both directions — "who reacted to this cast" and "what has this user reacted to".

Common response shape:

```json
{
  "reactions": [
    {
      "reaction_type": "like",
      "user": { /* User */ },
      "cast":  { /* Cast */ },
      "timestamp": 1712345678
    }
  ],
  "next": { "cursor": "..." }
}
```

---

## GET /v2/farcaster/reaction/cast

Who has reacted to a specific cast.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `hash` | string | yes | `0x`-prefixed cast hash. |
| `types` | `"likes"` \| `"recasts"` | no | Default `"likes"`. |
| `fid` | u64 | no | If the cast hash is ambiguous, narrows to a specific author. |
| `limit` | usize | no | Default `10`. |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/reaction/cast"
     data-title="Try /v2/farcaster/reaction/cast"
     data-auth="none"
     data-fields="hash|query|string|0x-prefixed cast hash||required;types|query|string|likes or recasts|likes;fid|query|u64;limit|query|usize||10"></div>

---

## GET /v2/farcaster/reaction/user

What a specific user has liked or recasted.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `fid` | u64 | yes | The reactor. |
| `type` | `"likes"` \| `"recasts"` | no | Default `"likes"`. |
| `limit` | usize | no | |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/reaction/user"
     data-title="Try /v2/farcaster/reaction/user"
     data-auth="none"
     data-fields="fid|query|u64||3|required;type|query|string|likes or recasts|likes;limit|query|usize||10"></div>
