package com.ikkyux.swproject.match

import com.ikkyux.swproject.match.repository.MatchRecommendationRepository
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import com.ikkyux.swproject.user.repository.UserTagRepository
import com.ikkyux.swproject.user.repository.TagRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MatchService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val userTagRepository: UserTagRepository,
    private val tagRepository: TagRepository,
    private val matchRecommendationRepository: MatchRecommendationRepository,
) {

    fun getRecommendations(requestedUserId: Long?): List<MatchRecommendationResponse> {
        val userId = resolveUserId(requestedUserId)
        return matchRecommendationRepository.findByUserIdAndStatusOrderByRecommendedAtDesc(userId).mapNotNull { recommendation ->
            val profile = userProfileRepository.findByUserId(recommendation.targetUserId) ?: return@mapNotNull null
            val tagNames = userTagRepository.findByUserId(recommendation.targetUserId)
                .map { it.tagId }
                .let { ids -> if (ids.isEmpty()) emptyList() else tagRepository.findAllByIdIn(ids).map { it.nameZh } }

            MatchRecommendationResponse(
                id = recommendation.id!!,
                userId = recommendation.targetUserId,
                nickname = profile.nickname,
                school = profile.schoolCode ?: "",
                major = profile.major ?: "",
                languages = profile.languages?.split(",")?.filter { it.isNotBlank() } ?: emptyList(),
                tags = tagNames,
                matchReason = recommendation.matchReason,
                matchScore = recommendation.matchScore.toDouble()
            )
        }
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

    private fun resolveUserId(requestedUserId: Long?): Long =
        requestedUserId ?: userRepository.findFirstByOrderByIdAsc()?.id
        ?: throw IllegalArgumentException("当前没有可用用户")
}
