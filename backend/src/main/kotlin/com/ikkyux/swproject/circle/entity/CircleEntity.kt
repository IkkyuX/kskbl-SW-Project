package com.ikkyux.swproject.circle.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "circles")
class CircleEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "name_zh", nullable = false)
    var nameZh: String = "",

    @Column(name = "icon_emoji", nullable = false)
    var iconEmoji: String = "⭐",

    @Column(nullable = false, columnDefinition = "TEXT")
    var description: String = "",

    @Column(name = "member_count", nullable = false)
    var memberCount: Int = 0,

    @Column(name = "post_count", nullable = false)
    var postCount: Int = 0,

    @Column(name = "hot_score", nullable = false)
    var hotScore: Int = 0,

    @Column(nullable = false)
    var status: String = "ACTIVE",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
)
