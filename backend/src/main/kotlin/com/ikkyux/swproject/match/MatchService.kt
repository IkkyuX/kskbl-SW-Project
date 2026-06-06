package com.ikkyux.swproject.match

import com.ikkyux.swproject.match.repository.MatchRecommendationRepository
import com.ikkyux.swproject.match.entity.MatchRecommendationEntity
import com.ikkyux.swproject.user.repository.BlockRecordRepository
import com.ikkyux.swproject.user.repository.FriendshipRepository
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import com.ikkyux.swproject.user.repository.UserTagRepository
import com.ikkyux.swproject.user.repository.TagRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDateTime

@Service
class MatchService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val userTagRepository: UserTagRepository,
    private val tagRepository: TagRepository,
    private val matchRecommendationRepository: MatchRecommendationRepository,
    private val friendshipRepository: FriendshipRepository,
    private val blockRecordRepository: BlockRecordRepository,
) {

    private data class MatchCandidate(
        val targetUserId: Long,
        val score: Double,
        val reasons: List<String>,
    )

    @Transactional
    fun getRecommendations(requestedUserId: Long?): List<MatchRecommendationResponse> {
        val userId = resolveUserId(requestedUserId)
        refreshRecommendations(userId)
        return matchRecommendationRepository.findByUserIdAndStatusOrderByRecommendedAtDesc(userId)
            .mapNotNull { recommendation -> recommendation.toResponse() }
    }

    fun greet(requestedUserId: Long?, id: Long): Map<String, Any> {
        resolveUserId(requestedUserId)
        return mapOf("matchId" to id, "conversationId" to 2001, "status" to "GREETED")
    }

    @Transactional
    fun skip(requestedUserId: Long?, id: Long): Map<String, Any> {
        resolveUserId(requestedUserId)
        val recommendation = matchRecommendationRepository.findById(id)
            .orElseThrow { IllegalArgumentException("推荐记录不存在") }
        recommendation.status = "SKIPPED"
        matchRecommendationRepository.save(recommendation)
        return mapOf("matchId" to id, "status" to "SKIPPED")
    }

    fun refreshRecommendations(userId: Long) {
        val currentProfile = userProfileRepository.findByUserId(userId) ?: return
        val allUsers = userRepository.findAll().filter { it.id != null }
        val allProfiles = userProfileRepository.findAll().associateBy { it.userId }
        val tagsById = tagRepository.findAll().associateBy { it.id!! }
        val userTags = userTagRepository.findAll().groupBy { it.userId }
            .mapValues { (_, tags) -> tags.mapNotNull { tagsById[it.tagId]?.nameZh }.toSet() }

        val currentTags = userTags[userId].orEmpty()
        val currentLanguages = currentProfile.languages.toLanguageSet()

        val candidates = allUsers.mapNotNull { user ->
            val targetUserId = user.id ?: return@mapNotNull null
            if (targetUserId == userId) return@mapNotNull null
            if (friendshipRepository.existsByUserIdAndFriendUserIdAndStatus(userId, targetUserId)) return@mapNotNull null
            if (blockRecordRepository.existsByUserIdAndTargetUserId(userId, targetUserId)) return@mapNotNull null
            if (blockRecordRepository.existsByUserIdAndTargetUserId(targetUserId, userId)) return@mapNotNull null

            val targetProfile = allProfiles[targetUserId] ?: return@mapNotNull null
            scoreCandidate(
                currentUserId = userId,
                currentProfile = currentProfile,
                currentLanguages = currentLanguages,
                currentTags = currentTags,
                targetUserId = targetUserId,
                targetProfile = targetProfile,
                targetTags = userTags[targetUserId].orEmpty(),
            )
        }.sortedByDescending { it.score }.take(8)

        matchRecommendationRepository.deleteByUserId(userId)
        val now = LocalDateTime.now()
        matchRecommendationRepository.saveAll(
            candidates.map { candidate ->
                MatchRecommendationEntity(
                    userId = userId,
                    targetUserId = candidate.targetUserId,
                    matchScore = BigDecimal.valueOf(candidate.score).setScale(1, RoundingMode.HALF_UP),
                    matchReason = candidate.reasons.joinToString(" / "),
                    recommendedAt = now,
                )
            }
        )
    }

    private fun scoreCandidate(
        currentUserId: Long,
        currentProfile: com.ikkyux.swproject.user.entity.UserProfileEntity,
        currentLanguages: Set<String>,
        currentTags: Set<String>,
        targetUserId: Long,
        targetProfile: com.ikkyux.swproject.user.entity.UserProfileEntity,
        targetTags: Set<String>,
    ): MatchCandidate {
        var score = 35.0
        val reasons = mutableListOf<String>()

        if (!currentProfile.schoolCode.isNullOrBlank() && currentProfile.schoolCode == targetProfile.schoolCode) {
            score += 22
            reasons += "同校交流更方便"
        }

        if (!currentProfile.major.isNullOrBlank() && !targetProfile.major.isNullOrBlank()) {
            if (currentProfile.major == targetProfile.major) {
                score += 12
                reasons += "专业方向接近"
            } else if (sameDisciplineFamily(currentProfile.major!!, targetProfile.major!!)) {
                score += 6
                reasons += "学业话题比较接近"
            }
        }

        val targetLanguages = targetProfile.languages.toLanguageSet()
        val commonLanguages = currentLanguages.intersect(targetLanguages)
        if (commonLanguages.isNotEmpty()) {
            score += (commonLanguages.size * 8).coerceAtMost(16)
            reasons += "可直接用${commonLanguages.first()}沟通"
        }

        val sharedTags = currentTags.intersect(targetTags)
        if (sharedTags.isNotEmpty()) {
            score += (sharedTags.size * 7).coerceAtMost(21)
            reasons += "共同需求: ${sharedTags.take(2).joinToString("、")}"
        }

        val complementaryScene = listOf("找饭搭子", "找学习搭子").any { it in currentTags && it in targetTags }
        if (complementaryScene) {
            score += 8
            reasons += "线下搭子需求一致"
        }

        val profileRichness = listOf(
            !targetProfile.bio.isNullOrBlank(),
            !targetProfile.avatarUrl.isNullOrBlank(),
            !targetProfile.major.isNullOrBlank(),
            targetLanguages.isNotEmpty(),
            targetTags.isNotEmpty(),
        ).count { it }
        score += profileRichness * 2

        val noveltyBoost = kotlin.math.abs(targetUserId - currentUserId).toDouble() % 5.0
        score += noveltyBoost

        if (reasons.isEmpty()) {
            reasons += "资料完整度较高，适合优先认识"
        }

        return MatchCandidate(
            targetUserId = targetUserId,
            score = score.coerceAtMost(99.0),
            reasons = reasons.take(3),
        )
    }

    private fun MatchRecommendationEntity.toResponse(): MatchRecommendationResponse? {
        val profile = userProfileRepository.findByUserId(targetUserId) ?: return null
        val tagNames = userTagRepository.findByUserId(targetUserId)
            .map { it.tagId }
            .let { ids -> if (ids.isEmpty()) emptyList() else tagRepository.findAllByIdIn(ids).map { it.nameZh } }

        return MatchRecommendationResponse(
            id = id!!,
            userId = targetUserId,
            nickname = profile.nickname,
            avatarUrl = profile.avatarUrl,
            school = profile.schoolCode ?: "",
            major = profile.major ?: "",
            languages = profile.languages?.split(",")?.filter { it.isNotBlank() } ?: emptyList(),
            tags = tagNames,
            matchReason = matchReason,
            matchScore = matchScore.toDouble()
        )
    }

    private fun String?.toLanguageSet(): Set<String> =
        this?.split(",")
            ?.map { it.trim() }
            ?.filter { it.isNotBlank() }
            ?.toSet()
            ?: emptySet()

    private fun sameDisciplineFamily(sourceMajor: String, targetMajor: String): Boolean {
        val source = sourceMajor.lowercase()
        val target = targetMajor.lowercase()
        val families = listOf(
            listOf("computer", "software", "media", "design"),
            listOf("business", "economics", "trade", "management"),
            listOf("international", "tourism", "language", "communication"),
        )
        return families.any { family ->
            family.any { keyword -> keyword in source } && family.any { keyword -> keyword in target }
        }
    }

    private fun resolveUserId(requestedUserId: Long?): Long =
        requestedUserId ?: userRepository.findFirstByOrderByIdAsc()?.id
        ?: throw IllegalArgumentException("当前没有可用用户")
}
