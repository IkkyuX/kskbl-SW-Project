package com.ikkyux.swproject.community

data class PostSummaryResponse(
    val id: Long,
    val authorName: String,
    val boardName: String,
    val title: String,
    val summary: String,
    val imageUrls: List<String>,
    val likeCount: Int,
    val commentCount: Int,
    val favoriteCount: Int,
    val createdAt: String
)

data class PostCommentResponse(
    val id: Long,
    val authorName: String,
    val content: String,
    val createdAt: String
)

data class PostDetailResponse(
    val id: Long,
    val authorName: String,
    val boardName: String,
    val title: String,
    val content: String,
    val imageUrls: List<String>,
    val anonymous: Boolean,
    val likeCount: Int,
    val commentCount: Int,
    val favoriteCount: Int,
    val createdAt: String,
    val comments: List<PostCommentResponse>
)

data class CreatePostRequest(
    val boardId: Long,
    val title: String?,
    val content: String,
    val imageUrls: List<String> = emptyList(),
    val anonymous: Boolean
)

data class CreateCommentRequest(
    val content: String
)

data class UpdatePostLikeRequest(
    val liked: Boolean
)

data class UpdatePostFavoriteRequest(
    val favorited: Boolean
)

data class PostReactionResponse(
    val postId: Long,
    val liked: Boolean,
    val likeCount: Int,
    val commentCount: Int,
    val favoriteCount: Int,
)
