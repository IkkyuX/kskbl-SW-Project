package com.ikkyux.swproject.match.repository

import com.ikkyux.swproject.match.entity.MatchRecommendationEntity
import org.springframework.data.jpa.repository.JpaRepository

interface MatchRecommendationRepository : JpaRepository<MatchRecommendationEntity, Long> {
    fun findByUserIdAndStatusOrderByRecommendedAtDesc(userId: Long, status: String = "RECOMMENDED"): List<MatchRecommendationEntity>
}
