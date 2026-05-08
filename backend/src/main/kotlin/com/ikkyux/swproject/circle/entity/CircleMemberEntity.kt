package com.ikkyux.swproject.circle.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "circle_members")
class CircleMemberEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "circle_id", nullable = false)
    var circleId: Long = 0,

    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    @Column(name = "unread_count", nullable = false)
    var unreadCount: Int = 0,

    @Column(name = "is_admin", nullable = false)
    var isAdmin: Boolean = false,

    @Column(name = "joined_at", nullable = false)
    var joinedAt: LocalDateTime = LocalDateTime.now(),
)
