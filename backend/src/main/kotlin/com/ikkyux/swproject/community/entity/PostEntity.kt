package com.ikkyux.swproject.community.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "posts")
class PostEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    @Column(name = "board_id", nullable = false)
    var boardId: Long = 0,

    var title: String? = null,

    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String = "",

    @Column(name = "image_urls_json", columnDefinition = "LONGTEXT")
    var imageUrlsJson: String? = null,

    @Column(name = "is_anonymous", nullable = false)
    var anonymous: Boolean = false,

    @Column(nullable = false)
    var status: String = "PUBLISHED",

    @Column(name = "like_count", nullable = false)
    var likeCount: Int = 0,

    @Column(name = "comment_count", nullable = false)
    var commentCount: Int = 0,

    @Column(name = "favorite_count", nullable = false)
    var favoriteCount: Int = 0,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
