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

## GET /v2/farcaster/reaction

Generic reaction lookup. If `hash` is provided, acts like `/reaction/cast` (reactions targeting the cast). Otherwise acts like `/reaction/user` (reactions made by `fid`).

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `hash` | string | conditional | If provided, switches to cast mode. |
| `types` | `"likes"` \| `"recasts"` | no | For cast mode. Default `"likes"`. |
| `type` | `"likes"` \| `"recasts"` | no | For user mode. Default `"likes"`. |
| `fid` | u64 | conditional | Required in user mode. |
| `limit` | usize | no | Default `10`. |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/reaction"
     data-title="Try /v2/farcaster/reaction"
     data-auth="none"
     data-fields="fid|query|u64||3;hash|query|string|0x-prefixed cast hash;type|query|string|likes or recasts|likes;limit|query|usize||10"></div>

---

## GET /v2/farcaster/reaction/cast

Who has reacted to a specific cast. Also reachable as `GET /v2/farcaster/reactions/cast` (spec-compat plural).

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

What a specific user has liked or recasted. Also reachable as `GET /v2/farcaster/reactions/user` (spec-compat plural).

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

## Write endpoints

`POST /v2/farcaster/reaction` and `DELETE /v2/farcaster/reaction` are registered but return `501 Not Implemented`. Submit signed `ReactionAdd`/`ReactionRemove` messages via the gRPC `SubmitMessage` endpoint.
