package com.ikkyux.swproject.user.repository

import com.ikkyux.swproject.user.entity.UserTagEntity
import org.springframework.data.jpa.repository.JpaRepository

interface UserTagRepository : JpaRepository<UserTagEntity, Long> {
    fun findByUserId(userId: Long): List<UserTagEntity>
    fun deleteByUserId(userId: Long)
}
