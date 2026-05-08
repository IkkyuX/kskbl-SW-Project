package com.ikkyux.swproject.community.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "post_comments")
class PostCommentEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "post_id", nullable = false)
    var postId: Long = 0,

    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String = "",

    @Column(nullable = false)
    var status: String = "VISIBLE",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
