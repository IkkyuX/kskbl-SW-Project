package com.ikkyux.swproject.user.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "user_profiles")
class UserProfileEntity(
    @Id
    @Column(name = "user_id")
    var userId: Long? = null,

    @Column(nullable = false)
    var nickname: String = "",

    @Column(name = "avatar_url")
    var avatarUrl: String? = null,

    var gender: String? = null,

    var nationality: String? = null,

    @Column(name = "school_code")
    var schoolCode: String? = null,

    var major: String? = null,

    var grade: String? = null,

    var languages: String? = null,

    @Column(columnDefinition = "TEXT")
    var bio: String? = null,

    @Column(name = "privacy_level", nullable = false)
    var privacyLevel: String = "PUBLIC",

    @Column(name = "arrived_at_korea")
    var arrivedAtKorea: LocalDate? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
