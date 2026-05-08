package com.ikkyux.swproject.match.entity

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(name = "match_recommendations")
class MatchRecommendationEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    @Column(name = "target_user_id", nullable = false)
    var targetUserId: Long = 0,

    @Column(name = "match_score", nullable = false)
    var matchScore: BigDecimal = BigDecimal.ZERO,

    @Column(name = "match_reason", nullable = false)
    var matchReason: String = "",

    @Column(nullable = false)
    var status: String = "RECOMMENDED",

    @Column(name = "recommended_at", nullable = false)
    var recommendedAt: LocalDateTime = LocalDateTime.now(),
)
