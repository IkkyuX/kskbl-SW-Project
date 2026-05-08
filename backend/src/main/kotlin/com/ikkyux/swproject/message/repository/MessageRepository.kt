package com.ikkyux.swproject.message.repository

import com.ikkyux.swproject.message.entity.MessageEntity
import org.springframework.data.jpa.repository.JpaRepository

interface MessageRepository : JpaRepository<MessageEntity, Long> {
    fun findAllByConversationIdOrderBySentAtAsc(conversationId: Long): List<MessageEntity>
    fun findTopByConversationIdOrderBySentAtDesc(conversationId: Long): MessageEntity?
}
