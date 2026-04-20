# Stylr API — Bug Report for Backend Team

> **Instructions:** Paste this entire file into Claude and say: "Fix all the bugs listed in this report. Each bug has the exact file path, current broken code, and what the fix should be. Apply all fixes."

---

## Bug #1 — CRITICAL SECURITY: `$request` object leaked in error response

**File:** `app/Http/Controllers/Api/V1/Posts/PostController.php`
**Method:** `store()` (line 72-78)
**Severity:** CRITICAL

The entire `$request` object is serialized into the JSON error response. When Laravel serializes a Request object it exposes authorization headers (Bearer tokens), cookies, server variables, all input data, and file metadata. Any client that triggers an `InvalidArgumentException` during image upload gets full access to this data.

**Current broken code:**
```php
} catch (\InvalidArgumentException $e) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
        'request' => $request
    ], 422);
}
```

**Fix — remove `'request' => $request`:**
```php
} catch (\InvalidArgumentException $e) {
    return response()->json([
        'success' => false,
        'message' => $e->getMessage(),
    ], 422);
}
```

---

## Bug #2 — Missing max file size validation on image upload in store()

**File:** `app/Http/Controllers/Api/V1/Posts/PostController.php`
**Method:** `store()` (line 59-62)
**Severity:** HIGH

The `store()` method has no `max` file size limit on image uploads. Users can upload arbitrarily large files. The `update()` method on line 183 correctly has `max:5120` but `store()` does not. The image field also lacks `nullable` or `sometimes` to make optionality explicit.

**Current broken code:**
```php
$validated = $request->validate([
    'description' => 'required|string|max:1000',
    'image' => 'image|mimes:jpeg,png,gif,webp,jpg',
]);
```

**Fix — add `nullable` and `max:5120` to match update():**
```php
$validated = $request->validate([
    'description' => 'required|string|max:1000',
    'image' => 'nullable|image|mimes:jpeg,png,gif,webp,jpg|max:5120',
]);
```

---

## Bug #3 — PostController::index() eagerly loads ALL comments (performance)

**File:** `app/Http/Controllers/Api/V1/Posts/PostController.php`
**Method:** `index()` (line 35)
**Severity:** HIGH

`with(['user', 'comments'])` loads every single comment for every post in the paginated feed. Posts with hundreds of comments create massive payloads. All other feed endpoints (`byUser`, `following`, `friends`, `forYou`) correctly use only `withCount('comments')` without eager-loading all comment data.

**Current broken code:**
```php
$posts = Post::with(['user', 'comments'])
    ->withCount([
        'likes as likes_count' => fn($q) => $q->likes(),
        'likes as dislikes_count' => fn($q) => $q->dislikes(),
    ])
    ->latest()
    ->paginate(20);

return response()->json($posts);
```

**Fix — remove `'comments'` from `with()`, add `'comments'` to `withCount()`, and wrap in consistent response format. Also add user reaction state to match other feed endpoints:**
```php
public function index(Request $request): JsonResponse
{
    $user = $request->user();

    $posts = Post::with(['user'])
        ->withCount([
            'likes as likes_count' => fn($q) => $q->likes(),
            'likes as dislikes_count' => fn($q) => $q->dislikes(),
            'comments',
        ])
        ->latest()
        ->paginate(20);

    // Add reaction state to each post (same pattern as byUser)
    $postIds = $posts->pluck('id');
    $userReactions = \App\Models\PostLike::whereIn('post_id', $postIds)
        ->where('user_id', $user->id)
        ->get()
        ->keyBy('post_id');

    $posts->getCollection()->transform(function ($post) use ($userReactions) {
        $reaction = $userReactions->get($post->id);
        $post->user_has_liked = $reaction && $reaction->is_like === true;
        $post->user_has_disliked = $reaction && $reaction->is_like === false;
        return $post;
    });

    return response()->json([
        'success' => true,
        'data' => $posts,
    ]);
}
```

Note: This also fixes **Bug #5** (missing user reaction state in index) and **Bug #6** (inconsistent response format for index).

---

## Bug #4 — PostController::show() missing `success` wrapper

**File:** `app/Http/Controllers/Api/V1/Posts/PostController.php`
**Method:** `show()` (line 119)
**Severity:** MEDIUM

Returns raw data without the `{ success: true, data: ... }` wrapper that every other successful endpoint uses.

**Current broken code:**
```php
return response()->json($data);
```

**Fix:**
```php
return response()->json([
    'success' => true,
    'data' => $data,
]);
```

---

## Bug #5 — `following()` and `friends()` feeds missing user reaction state

**File:** `app/Http/Controllers/Api/V1/Posts/PostController.php`
**Methods:** `following()` (line 231-251) and `friends()` (line 262-284)
**Severity:** MEDIUM

The `byUser()` method correctly attaches `user_has_liked` and `user_has_disliked` to each post, but `following()` and `friends()` do not. The frontend cannot show whether the user has already reacted to posts in these feeds.

**Current broken code (following — same issue in friends):**
```php
public function following(Request $request): JsonResponse
{
    $user = $request->user();

    $followingIds = $user->following()->pluck('users.id');

    $posts = Post::whereIn('user_id', $followingIds)
        ->with('user')
        ->withCount([
            'likes as likes_count' => fn($q) => $q->likes(),
            'likes as dislikes_count' => fn($q) => $q->dislikes(),
            'comments'
        ])
        ->latest()
        ->paginate(20);

    return response()->json([
        'success' => true,
        'data' => $posts
    ]);
}
```

**Fix — add reaction state (apply same pattern to both `following()` and `friends()`):**
```php
public function following(Request $request): JsonResponse
{
    $user = $request->user();

    $followingIds = $user->following()->pluck('users.id');

    $posts = Post::whereIn('user_id', $followingIds)
        ->with('user')
        ->withCount([
            'likes as likes_count' => fn($q) => $q->likes(),
            'likes as dislikes_count' => fn($q) => $q->dislikes(),
            'comments'
        ])
        ->latest()
        ->paginate(20);

    $postIds = $posts->pluck('id');
    $userReactions = \App\Models\PostLike::whereIn('post_id', $postIds)
        ->where('user_id', $user->id)
        ->get()
        ->keyBy('post_id');

    $posts->getCollection()->transform(function ($post) use ($userReactions) {
        $reaction = $userReactions->get($post->id);
        $post->user_has_liked = $reaction && $reaction->is_like === true;
        $post->user_has_disliked = $reaction && $reaction->is_like === false;
        return $post;
    });

    return response()->json([
        'success' => true,
        'data' => $posts,
    ]);
}
```

Apply the exact same reaction-state block to `friends()` as well.

---

## Bug #6 — PostController::destroy() missing `success` key

**File:** `app/Http/Controllers/Api/V1/Posts/PostController.php`
**Method:** `destroy()` (line 343)
**Severity:** LOW

**Current broken code:**
```php
return response()->json(['message' => 'Post deleted']);
```

**Fix:**
```php
return response()->json([
    'success' => true,
    'message' => 'Post deleted',
]);
```

---

## Bug #7 — PostLikeController responses missing `success` wrapper + updated counts

**File:** `app/Http/Controllers/Api/V1/Posts/PostLikeController.php`
**Methods:** `store()` (line 40) and `destroy()` (line 57)
**Severity:** MEDIUM

The `store()` method returns the raw like model, and `destroy()` returns just a message. The frontend needs the updated `likes_count`, `dislikes_count`, and the user's current vote state after toggling.

**Current broken code (store):**
```php
return response()->json($like);
```

**Current broken code (destroy):**
```php
return response()->json(['message' => 'Reaction removed']);
```

**Fix (store):**
```php
$post->loadCount([
    'likes as likes_count' => fn($q) => $q->likes(),
    'likes as dislikes_count' => fn($q) => $q->dislikes(),
]);

return response()->json([
    'success' => true,
    'data' => [
        'likes_count' => $post->likes_count,
        'dislikes_count' => $post->dislikes_count,
        'user_vote' => $validated['is_like'] ? 'like' : 'dislike',
    ],
]);
```

**Fix (destroy):**
```php
$post->loadCount([
    'likes as likes_count' => fn($q) => $q->likes(),
    'likes as dislikes_count' => fn($q) => $q->dislikes(),
]);

return response()->json([
    'success' => true,
    'message' => 'Reaction removed',
    'data' => [
        'likes_count' => $post->likes_count,
        'dislikes_count' => $post->dislikes_count,
        'user_vote' => null,
    ],
]);
```

---

## Bug #8 — CommentController responses missing `success` wrapper + pagination mismatch

**File:** `app/Http/Controllers/Api/V1/Posts/CommentController.php`
**Methods:** `index()` (line 36), `store()` (line 65), `destroy()` (line 87)
**Severity:** MEDIUM

The frontend expects `response.data.comments` (array) and `response.data.pagination` (object). Currently `index()` returns a raw Laravel paginator. `store()` returns a raw comment. `destroy()` returns just a message. None have `success` keys.

**Current broken code (index):**
```php
return response()->json($comments);
```

**Fix (index):**
```php
return response()->json([
    'success' => true,
    'data' => [
        'comments' => $comments->items(),
        'pagination' => [
            'current_page' => $comments->currentPage(),
            'last_page' => $comments->lastPage(),
            'per_page' => $comments->perPage(),
            'total' => $comments->total(),
        ],
    ],
]);
```

**Current broken code (store):**
```php
return response()->json($comment, 201);
```

**Fix (store):**
```php
return response()->json([
    'success' => true,
    'data' => $comment,
], 201);
```

**Current broken code (destroy):**
```php
return response()->json(['message' => 'Comment deleted']);
```

**Fix (destroy):**
```php
return response()->json([
    'success' => true,
    'message' => 'Comment deleted',
]);
```

---

## Bug #9 — Cross-post comment replies allowed

**File:** `app/Http/Controllers/Api/V1/Posts/CommentController.php`
**Method:** `store()` (line 51-54)
**Severity:** HIGH

The `parent_id` validation only checks the comment exists globally, not that it belongs to the same post. A user can reply to a comment from Post A while creating the reply under Post B, corrupting data integrity.

**Current broken code:**
```php
$validated = $request->validate([
    'body' => 'required|string|max:500',
    'parent_id' => 'nullable|exists:comments,id',
]);
```

**Fix — scope parent_id to the same post:**
```php
$validated = $request->validate([
    'body' => 'required|string|max:500',
    'parent_id' => 'nullable|exists:comments,id,post_id,' . $post->id,
]);
```

---

## Bug #10 — PostLike scopes use DB::raw('true') — breaks SQLite

**File:** `app/Models/PostLike.php`
**Methods:** `scopeLikes()` (line 21-24) and `scopeDislikes()` (line 26-29)
**Severity:** MEDIUM

`DB::raw('true')` and `DB::raw('false')` inject literal SQL `true`/`false`. This breaks on SQLite (used in testing) which uses `1`/`0`. The `is_like` column already has a `'boolean'` cast, so just use PHP booleans.

**Current broken code:**
```php
public function scopeLikes($query)
{
    return $query->where('is_like', DB::raw('true'));
}

public function scopeDislikes($query)
{
    return $query->where('is_like', DB::raw('false'));
}
```

**Fix:**
```php
public function scopeLikes($query)
{
    return $query->where('is_like', true);
}

public function scopeDislikes($query)
{
    return $query->where('is_like', false);
}
```

You can also remove the `use Illuminate\Support\Facades\DB;` import since it's no longer needed.

---

## Bug #11 — ban() allows banning admins and self

**File:** `app/Http/Controllers/Api/V1/Moderation/Actions/ModerationController.php`
**Method:** `ban()` (line 148-188)
**Severity:** HIGH

No guard prevents an admin from banning another admin or themselves. Compare to `demoteAdmin()` which correctly has a self-check.

**Current broken code (no guards at start of method):**
```php
public function ban(Request $request, User $user): JsonResponse
{
    $request->validate([
        'reason' => ['required', 'string'],
        'hours' => ['nullable', 'integer', 'min:1'],
    ]);

    $admin = $request->user();
    $until = $request->hours ? now()->addHours($request->hours) : null;

    // ... immediately proceeds to ban
```

**Fix — add guards after validation:**
```php
public function ban(Request $request, User $user): JsonResponse
{
    $request->validate([
        'reason' => ['required', 'string'],
        'hours' => ['nullable', 'integer', 'min:1'],
    ]);

    $admin = $request->user();

    if ($user->id === $admin->id) {
        return response()->json([
            'success' => false,
            'message' => 'Du kannst dich nicht selbst sperren.',
        ], 403);
    }

    if ($user->is_admin) {
        return response()->json([
            'success' => false,
            'message' => 'Admins können nicht gesperrt werden.',
        ], 403);
    }

    $until = $request->hours ? now()->addHours($request->hours) : null;

    // ... rest of ban logic stays the same
```

---

## Bug #12 — unban() doesn't check if user is actually banned

**File:** `app/Http/Controllers/Api/V1/Moderation/Actions/ModerationController.php`
**Method:** `unban()` (line 190-212)
**Severity:** LOW

Silently "unbans" users who aren't banned, returning success.

**Current broken code (no check):**
```php
public function unban(Request $request, User $user): JsonResponse
{
    $admin = $request->user();

    Ban::where('user_id', $user->id)
        // ... immediately proceeds
```

**Fix — add check at the top:**
```php
public function unban(Request $request, User $user): JsonResponse
{
    if (!$user->is_banned) {
        return response()->json([
            'success' => false,
            'message' => 'User ist nicht gesperrt.',
        ], 400);
    }

    $admin = $request->user();

    // ... rest stays the same
```

---

## Bug #13 — Search LIKE wildcards not escaped

**File:** `app/Http/Controllers/Api/V1/User/SearchController.php`
**Method:** `users()` (line 26)
**Severity:** LOW

The `%` and `_` wildcard characters in user input are not escaped before use in a LIKE clause. Searching for `%` returns all users, `_` matches any single character.

**Current broken code:**
```php
$name = trim($request->input('search'));
// ...
->where('name', 'like', "%{$name}%")
```

**Fix — escape LIKE wildcards:**
```php
$name = trim($request->input('search'));
$name = str_replace(['%', '_'], ['\\%', '\\_'], $name);
// ...
->where('name', 'like', "%{$name}%")
```

---

## Bug #14 — account_type silently ignored during registration

**File:** `app/Http/Controllers/Api/V1/Auth/RegisterController.php`
**Method:** `register()` (line 14-22)
**Severity:** MEDIUM

`account_type` is validated but never passed to the user creator. `$request->only(...)` on line 22 doesn't include `account_type`, so it defaults to whatever the model default is regardless of what the user sends.

**Current broken code:**
```php
$request->validate([
    'name' => ['required', 'string', 'max:255'],
    'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
    'password' => ['required', 'string', 'confirmed', 'min:8'],
    'device_name' => ['required', 'string', 'max:255'],
    'account_type' => ['sometimes', 'in:public,private']
]);

$user = $creator->create($request->only('name', 'email', 'password', 'password_confirmation'));
```

**Fix — pass account_type to the creator, or set it after creation:**
```php
$user = $creator->create($request->only('name', 'email', 'password', 'password_confirmation'));

if ($request->has('account_type')) {
    $user->update(['account_type' => $request->account_type]);
}
```

Alternatively, add `'account_type'` to the `$request->only(...)` array and handle it in the `CreateNewUser` action.

---

## Bug #15 — FollowController::show() missing profile_picture_url

**File:** `app/Http/Controllers/Api/V1/User/Relationships/FollowController.php`
**Method:** `show()` (line 272-280)
**Severity:** MEDIUM

The response manually constructs user data but omits `profile_picture` and `profile_picture_url`. The frontend needs the profile picture to display the user's profile.

**Current broken code:**
```php
$data = [
    'id' => $user->id,
    'name' => $user->name,
    'account_type' => $user->account_type,
    'followers_count' => $user->followers_count,
    'following_count' => $user->following_count,
    'is_following' => $this->relationships->isFollowing($authUser, $user),
    'has_pending_request' => $this->relationships->hasSentRequestTo($authUser, $user),
];
```

**Fix — add profile picture fields:**
```php
$data = [
    'id' => $user->id,
    'name' => $user->name,
    'account_type' => $user->account_type,
    'profile_picture' => $user->profile_picture,
    'profile_picture_url' => $user->profile_picture_url,
    'followers_count' => $user->followers_count,
    'following_count' => $user->following_count,
    'is_following' => $this->relationships->isFollowing($authUser, $user),
    'has_pending_request' => $this->relationships->hasSentRequestTo($authUser, $user),
];
```

---

## Bug #16 — index() feed returns all posts ignoring privacy and blocks

**File:** `app/Http/Controllers/Api/V1/Posts/PostController.php`
**Method:** `index()` (line 33-44)
**Severity:** HIGH

The `index()` endpoint returns ALL posts from ALL users. It doesn't filter out:
- Posts from users who have blocked the authenticated user
- Posts from users the authenticated user has blocked
- Posts from private accounts the authenticated user doesn't follow

The `following()` and `friends()` endpoints implicitly filter by relationship, but `index()` has no filtering at all.

**Fix — add block and privacy filtering (in the fixed index from Bug #3 above, add these query scopes):**
```php
$blockedIds = $user->blockedUsers()->pluck('users.id');
$blockedByIds = $user->blockedByUsers()->pluck('users.id');
$excludeIds = $blockedIds->merge($blockedByIds);

$posts = Post::with(['user'])
    ->whereNotIn('user_id', $excludeIds)
    ->where(function ($query) use ($user) {
        $query->whereHas('user', fn($q) => $q->where('account_type', 'public'))
              ->orWhere('user_id', $user->id)
              ->orWhereIn('user_id', $user->following()->pluck('users.id'));
    })
    ->withCount([
        'likes as likes_count' => fn($q) => $q->likes(),
        'likes as dislikes_count' => fn($q) => $q->dislikes(),
        'comments',
    ])
    ->latest()
    ->paginate(20);
```

---

## Summary — Priority Order

| Priority | Bug # | File | Issue |
|----------|-------|------|-------|
| **P0** | #1 | PostController | `$request` object leaks auth tokens in error response |
| **P1** | #2 | PostController | No max file size on image upload |
| **P1** | #9 | CommentController | Cross-post replies — data integrity |
| **P1** | #11 | ModerationController | Admins can ban other admins/self |
| **P1** | #16 | PostController | Feed ignores blocks and private accounts |
| **P2** | #3 | PostController | index() loads ALL comments per post |
| **P2** | #5 | PostController | following/friends missing reaction state |
| **P2** | #8 | CommentController | Raw paginator, no success wrapper |
| **P2** | #7 | PostLikeController | Missing success wrapper + counts |
| **P2** | #4 | PostController | show() missing success wrapper |
| **P2** | #14 | RegisterController | account_type silently dropped |
| **P2** | #15 | FollowController | Missing profile_picture_url in show() |
| **P2** | #10 | PostLike model | DB::raw breaks SQLite testing |
| **P3** | #6 | PostController | destroy() missing success key |
| **P3** | #12 | ModerationController | unban without ban check |
| **P3** | #13 | SearchController | LIKE wildcards not escaped |
