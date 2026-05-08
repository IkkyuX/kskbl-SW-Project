package com.ikkyux.swproject.circle

data class CircleSummaryResponse(
    val id: Long,
    val name: String,
    val icon: String,
    val members: Int,
    val posts: Int,
    val description: String,
    val tags: List<String>,
    val hot: Boolean,
    val joined: Boolean,
)

data class JoinedCircleResponse(
    val id: Long,
    val name: String,
    val icon: String,
    val members: Int,
    val unread: Int,
    val lastMessage: String,
    val lastTime: String,
    val isAdmin: Boolean,
)

data class CircleDetailResponse(
    val id: Long,
    val name: String,
    val icon: String,
    val members: Int,
    val posts: Int,
    val description: String,
    val tags: List<String>,
    val hot: Boolean,
    val joined: Boolean,
    val isAdmin: Boolean,
    val announcement: String,
)

data class CircleActivityResponse(
    val id: String,
    val type: String,
    val title: String,
    val content: String,
    val createdAt: String,
)

data class CircleMemberResponse(
    val id: Long,
    val userId: Long,
    val nickname: String,
    val school: String,
    val major: String,
    val bio: String,
    val avatarUrl: String?,
    val isAdmin: Boolean,
    val joinedAt: String,
)
