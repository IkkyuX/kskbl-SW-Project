package com.ikkyux.swproject.user.repository

import com.ikkyux.swproject.user.entity.UserEntity
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<UserEntity, Long> {
    fun findByEmail(email: String): UserEntity?
    fun findByUNumber(uNumber: Long): UserEntity?
    fun existsByEmail(email: String): Boolean
    fun findFirstByOrderByIdAsc(): UserEntity?
    fun findTopByOrderByUNumberDesc(): UserEntity?
}
