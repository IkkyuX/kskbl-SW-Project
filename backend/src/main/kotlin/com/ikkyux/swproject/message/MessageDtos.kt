package com.ikkyux.swproject.message

data class ConversationSummaryResponse(
    val id: Long,
    val participantUserId: Long,
    val name: String,
    val avatarSeed: String,
    val lastMessage: String,
    val time: String,
    val unread: Int,
    val online: Boolean,
    val pinned: Boolean,
    val status: String,
    val nickname: String,
)

data class ChatMessageResponse(
    val id: Long,
    val content: String,
    val time: String,
    val isMine: Boolean,
)

data class ConversationDetailResponse(
    val id: Long,
    val participantUserId: Long,
    val name: String,
    val avatarSeed: String,
    val online: Boolean,
    val nickname: String,
    val messages: List<ChatMessageResponse>,
)

data class OpenDirectConversationRequest(
    val targetUserId: Long,
)

data class SendMessageRequest(
    val content: String,
)

data class NotificationResponse(
    val id: Long,
    val type: String,
    val icon: String,
    val title: String,
    val content: String,
    val time: String,
    val read: Boolean,
)
