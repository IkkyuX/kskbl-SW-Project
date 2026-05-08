package com.ikkyux.swproject.message.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "messages")
class MessageEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "conversation_id", nullable = false)
    var conversationId: Long = 0,

    @Column(name = "sender_id", nullable = false)
    var senderId: Long = 0,

    @Column(name = "message_type", nullable = false)
    var messageType: String = "TEXT",

    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String = "",

    @Column(name = "media_url")
    var mediaUrl: String? = null,

    @Column(nullable = false)
    var status: String = "SENT",

    @Column(name = "sent_at", nullable = false)
    var sentAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
)
