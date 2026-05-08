package com.ikkyux.swproject.message.repository

import com.ikkyux.swproject.message.entity.ConversationMemberEntity
import org.springframework.data.jpa.repository.JpaRepository

interface ConversationMemberRepository : JpaRepository<ConversationMemberEntity, Long> {
    fun findAllByUserId(userId: Long): List<ConversationMemberEntity>
    fun findAllByConversationId(conversationId: Long): List<ConversationMemberEntity>
    fun findByConversationIdAndUserId(conversationId: Long, userId: Long): ConversationMemberEntity?
}
