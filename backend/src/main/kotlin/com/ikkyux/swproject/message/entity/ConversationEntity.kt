package com.ikkyux.swproject.message.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "conversations")
class ConversationEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "conversation_type", nullable = false)
    var conversationType: String = "PRIVATE",

    @Column(name = "last_message_id")
    var lastMessageId: Long? = null,

    @Column(name = "last_message_at")
    var lastMessageAt: LocalDateTime? = null,

    @Column(nullable = false)
    var status: String = "ACTIVE",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
