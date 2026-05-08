package com.ikkyux.swproject.content.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "articles")
class ArticleEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "category_id", nullable = false)
    var categoryId: Long = 0,

    @Column(name = "title_zh", nullable = false)
    var titleZh: String = "",

    @Column(name = "title_ko", nullable = false)
    var titleKo: String = "",

    @Column(name = "title_en", nullable = false)
    var titleEn: String = "",

    @Column(name = "content_zh", nullable = false, columnDefinition = "TEXT")
    var contentZh: String = "",

    @Column(name = "content_ko", nullable = false, columnDefinition = "TEXT")
    var contentKo: String = "",

    @Column(name = "content_en", nullable = false, columnDefinition = "TEXT")
    var contentEn: String = "",

    @Column(name = "source_name")
    var sourceName: String? = null,

    @Column(name = "source_url")
    var sourceUrl: String? = null,

    @Column(name = "published_at")
    var publishedAt: LocalDateTime? = null,

    @Column(nullable = false)
    var status: String = "PUBLISHED",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
