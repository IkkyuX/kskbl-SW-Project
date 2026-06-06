package com.ikkyux.swproject.circle

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class CreateCircleRequest(
    @field:NotBlank val name: String,
    val icon: String? = null,
    @field:NotBlank val description: String
)

data class UpdateCircleAnnouncementRequest(
    @field:NotBlank val announcement: String
)

data class UpdateCircleAdminRequest(
    @field:NotNull val targetUserId: Long
)

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
    val isOwner: Boolean,
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
    val isOwner: Boolean,
    val canManageAdmins: Boolean,
    val canDeleteCircle: Boolean,
    val canManageContent: Boolean,
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
    val isOwner: Boolean,
    val joinedAt: String,
)
