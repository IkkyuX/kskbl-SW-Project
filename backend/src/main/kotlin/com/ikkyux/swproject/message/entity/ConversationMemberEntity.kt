package com.ikkyux.swproject.message.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "conversation_members")
class ConversationMemberEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "conversation_id", nullable = false)
    var conversationId: Long = 0,

    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    @Column(name = "unread_count", nullable = false)
    var unreadCount: Int = 0,

    @Column(name = "is_admin", nullable = false)
    var isAdmin: Boolean = false,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
)
