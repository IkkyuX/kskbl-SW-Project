package com.ikkyux.swproject.user.repository

import com.ikkyux.swproject.user.entity.VerificationRecordEntity
import org.springframework.data.jpa.repository.JpaRepository

interface VerificationRecordRepository : JpaRepository<VerificationRecordEntity, Long> {
    fun findTopByUserIdOrderByCreatedAtDesc(userId: Long): VerificationRecordEntity?
}
