package com.ikkyux.swproject.user.repository

import com.ikkyux.swproject.user.entity.BlockRecordEntity
import org.springframework.data.jpa.repository.JpaRepository

interface BlockRecordRepository : JpaRepository<BlockRecordEntity, Long> {
    fun findAllByUserIdOrderByCreatedAtDesc(userId: Long): List<BlockRecordEntity>
    fun findByUserIdAndTargetUserId(userId: Long, targetUserId: Long): BlockRecordEntity?
    fun existsByUserIdAndTargetUserId(userId: Long, targetUserId: Long): Boolean
    fun deleteByUserIdAndTargetUserId(userId: Long, targetUserId: Long)
}
