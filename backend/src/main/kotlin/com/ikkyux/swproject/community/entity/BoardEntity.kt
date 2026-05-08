package com.ikkyux.swproject.community.entity

import jakarta.persistence.*

@Entity
@Table(name = "boards")
class BoardEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

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
)
