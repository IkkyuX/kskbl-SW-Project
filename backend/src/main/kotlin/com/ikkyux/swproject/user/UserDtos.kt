package com.ikkyux.swproject.user

data class UserProfileResponse(
    val id: Long,
    val nickname: String,
    val school: String,
    val major: String,
    val languages: List<String>,
    val bio: String,
    val tags: List<String>,
    val status: String
)

data class UpdateProfileRequest(
    val nickname: String,
    val school: String,
    val major: String,
    val languages: List<String>,
    val bio: String
)

data class UpdateTagsRequest(
    val tagIds: List<Long>
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
