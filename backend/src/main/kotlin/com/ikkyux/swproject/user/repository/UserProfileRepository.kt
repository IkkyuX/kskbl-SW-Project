package com.ikkyux.swproject.user.repository

import com.ikkyux.swproject.user.entity.UserProfileEntity
import org.springframework.data.jpa.repository.JpaRepository

interface UserProfileRepository : JpaRepository<UserProfileEntity, Long> {
    fun findByUserId(userId: Long): UserProfileEntity?
}
