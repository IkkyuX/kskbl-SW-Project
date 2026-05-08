package com.ikkyux.swproject.user.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "user_tags")
class UserTagEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    @Column(name = "tag_id", nullable = false)
    var tagId: Long = 0,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
)
