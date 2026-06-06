package com.ikkyux.swproject.user.repository

import com.ikkyux.swproject.user.entity.FriendRequestEntity
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.data.jpa.repository.JpaRepository

interface FriendRequestRepository : JpaRepository<FriendRequestEntity, Long> {
    fun findAllByRequesterUserIdOrderByUpdatedAtDesc(requesterUserId: Long): List<FriendRequestEntity>
    fun findAllByReceiverUserIdOrderByUpdatedAtDesc(receiverUserId: Long): List<FriendRequestEntity>

    fun findByRequesterUserIdAndReceiverUserId(requesterUserId: Long, receiverUserId: Long): FriendRequestEntity?
}
