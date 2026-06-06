package com.ikkyux.swproject.user

import com.fasterxml.jackson.annotation.JsonProperty

data class UserProfileResponse(
    val id: Long,
    @JsonProperty("unumber")
    val uNumber: Long,
    val nickname: String,
    val avatarUrl: String?,
    val level: Int,
    val experience: Int,
    val school: String,
    val major: String,
    val languages: List<String>,
    val bio: String,
    val tags: List<String>,
    val status: String,
    val privacyLevel: String
)

data class LevelRuleResponse(
    val key: String,
    val label: String,
    val description: String,
    val expPerUnit: Int,
    val count: Int,
    val earnedExp: Int,
)

data class LevelSummaryResponse(
    val level: Int,
    val experience: Int,
    val currentLevelExp: Int,
    val nextLevelExp: Int,
    val expIntoLevel: Int,
    val expNeededForNextLevel: Int,
    val progressPercent: Int,
    val rules: List<LevelRuleResponse>,
)

data class FriendResponse(
    val userId: Long,
    @JsonProperty("unumber")
    val uNumber: Long,
    val nickname: String,
    val originalNickname: String,
    val remarkName: String?,
    val avatarUrl: String?,
    val school: String,
    val major: String,
    val bio: String,
    val status: String
)

data class UpdateFriendRemarkRequest(
    val remarkName: String = "",
)

data class AddFriendRequest(
    val targetUserId: Long? = null,
    val targetUNumber: Long? = null
)

data class AddFriendResponse(
    val userId: Long,
    val friendUserId: Long,
    val status: String
)

data class FriendRequestResponse(
    val id: Long,
    val requesterUserId: Long,
    val receiverUserId: Long,
    val targetUserId: Long,
    @JsonProperty("targetUNumber")
    val targetUNumber: Long,
    val targetNickname: String,
    val targetAvatarUrl: String?,
    val direction: String,
    val status: String,
    val statusLabel: String,
    val canRespond: Boolean,
    val updatedAt: String
)

data class UpdateProfileRequest(
    val nickname: String,
    val school: String,
    val major: String,
    val languages: List<String>,
    val bio: String,
    val privacyLevel: String = "PUBLIC"
)

data class UpdateTagsRequest(
    val tagIds: List<Long>
)

data class BlockUserRequest(
    val targetUserId: Long
)

data class BlockResponse(
    val userId: Long,
    val targetUserId: Long,
    @JsonProperty("targetUNumber")
    val targetUNumber: Long,
    val targetNickname: String,
    val targetAvatarUrl: String?,
    val createdAt: String
)

data class UNumberLookupResponse(
    val userId: Long,
    @JsonProperty("unumber")
    val uNumber: Long,
    val nickname: String,
    val avatarUrl: String?
)

data class TagOptionResponse(
    val id: Long,
    val name: String,
    val type: String
)

data class TagCatalogResponse(
    val interestTags: List<TagOptionResponse>,
    val sceneTags: List<TagOptionResponse>,
    val statusTags: List<TagOptionResponse>
)

data class PublicUserSummaryResponse(
    val userId: Long,
    @JsonProperty("unumber")
    val uNumber: Long,
    val email: String?,
    val nickname: String,
    val originalNickname: String,
    val remarkName: String?,
    val isFriend: Boolean,
    val avatarUrl: String?,
    val school: String,
    val major: String,
    val languages: List<String>,
    val bio: String,
)
