package com.ikkyux.swproject.match

data class MatchRecommendationResponse(
    val id: Long,
    val userId: Long,
    val nickname: String,
    val avatarUrl: String?,
    val school: String,
    val major: String,
    val languages: List<String>,
    val tags: List<String>,
    val matchReason: String,
    val matchScore: Double
)

data class MatchActionRequest(
    val action: String
)
