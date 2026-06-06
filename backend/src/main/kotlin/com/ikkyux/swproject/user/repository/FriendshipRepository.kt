package com.ikkyux.swproject.user.repository

import com.ikkyux.swproject.user.entity.FriendshipEntity
import org.springframework.data.jpa.repository.JpaRepository

interface FriendshipRepository : JpaRepository<FriendshipEntity, Long> {
    fun findAllByUserIdAndStatusOrderByCreatedAtDesc(userId: Long, status: String = "ACTIVE"): List<FriendshipEntity>
    fun findByUserIdAndFriendUserId(userId: Long, friendUserId: Long): FriendshipEntity?
    fun existsByUserIdAndFriendUserIdAndStatus(userId: Long, friendUserId: Long, status: String = "ACTIVE"): Boolean
    fun countByUserIdAndStatus(userId: Long, status: String = "ACTIVE"): Long
}
