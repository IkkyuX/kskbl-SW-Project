package com.ikkyux.swproject.circle.repository

import com.ikkyux.swproject.circle.entity.CircleMemberEntity
import org.springframework.data.jpa.repository.JpaRepository

interface CircleMemberRepository : JpaRepository<CircleMemberEntity, Long> {
    fun findAllByUserId(userId: Long): List<CircleMemberEntity>
    fun findAllByCircleIdOrderByIsAdminDescJoinedAtAsc(circleId: Long): List<CircleMemberEntity>
    fun findByCircleIdAndUserId(circleId: Long, userId: Long): CircleMemberEntity?
    fun countByCircleId(circleId: Long): Long
    fun deleteAllByCircleId(circleId: Long)
}
