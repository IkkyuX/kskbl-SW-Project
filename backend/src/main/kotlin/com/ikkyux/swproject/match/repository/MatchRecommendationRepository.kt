package com.ikkyux.swproject.match.repository

import com.ikkyux.swproject.match.entity.MatchRecommendationEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MatchRecommendationRepository : JpaRepository<MatchRecommendationEntity, Long> {
    fun findByUserIdAndStatusOrderByRecommendedAtDesc(userId: Long, status: String = "RECOMMENDED"): List<MatchRecommendationEntity>
    @Modifying
    @Query("delete from MatchRecommendationEntity m where m.userId = :userId")
    fun deleteByUserId(@Param("userId") userId: Long)
}
