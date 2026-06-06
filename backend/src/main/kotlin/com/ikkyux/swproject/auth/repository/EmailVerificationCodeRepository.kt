package com.ikkyux.swproject.auth.repository

import com.ikkyux.swproject.auth.entity.EmailVerificationCodeEntity
import org.springframework.data.jpa.repository.JpaRepository

interface EmailVerificationCodeRepository : JpaRepository<EmailVerificationCodeEntity, Long> {
    fun findTopByEmailAndSceneOrderByCreatedAtDesc(email: String, scene: String): EmailVerificationCodeEntity?
}
