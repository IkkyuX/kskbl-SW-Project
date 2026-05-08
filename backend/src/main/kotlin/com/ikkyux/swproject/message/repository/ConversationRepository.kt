package com.ikkyux.swproject.message.repository

import com.ikkyux.swproject.message.entity.ConversationEntity
import org.springframework.data.jpa.repository.JpaRepository

interface ConversationRepository : JpaRepository<ConversationEntity, Long> {
    fun findAllByStatusOrderByUpdatedAtDesc(status: String = "ACTIVE"): List<ConversationEntity>
}
