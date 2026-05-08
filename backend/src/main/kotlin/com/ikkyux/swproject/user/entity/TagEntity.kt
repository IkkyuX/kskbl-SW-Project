package com.ikkyux.swproject.user.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "tags")
class TagEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "tag_type", nullable = false)
    var tagType: String = "",

    @Column(name = "name_zh", nullable = false)
    var nameZh: String = "",

    @Column(name = "name_ko", nullable = false)
    var nameKo: String = "",

    @Column(name = "name_en", nullable = false)
    var nameEn: String = "",

    @Column(nullable = false)
    var status: String = "ACTIVE",

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
