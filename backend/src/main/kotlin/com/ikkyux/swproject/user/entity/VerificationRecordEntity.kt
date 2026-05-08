package com.ikkyux.swproject.user.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "verification_records")
class VerificationRecordEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    @Column(name = "verify_type", nullable = false)
    var verifyType: String = "",

    @Column(name = "file_url", nullable = false)
    var fileUrl: String = "",

    @Column(nullable = false)
    var status: String = "PENDING",

    @Column(name = "reject_reason")
    var rejectReason: String? = null,

    @Column(name = "reviewed_by")
    var reviewedBy: Long? = null,

    @Column(name = "reviewed_at")
    var reviewedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
