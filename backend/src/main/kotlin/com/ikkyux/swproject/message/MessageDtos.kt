package com.ikkyux.swproject.message

data class ConversationSummaryResponse(
    val id: Long,
    val participantUserId: Long,
    val groupNumber: Long?,
    val groupName: String?,
    val groupDescription: String?,
    val name: String,
    val avatarSeed: String,
    val avatarUrl: String?,
    val lastMessage: String,
    val time: String,
    val unread: Int,
    val online: Boolean,
    val pinned: Boolean,
    val status: String,
    val nickname: String,
    val isFriend: Boolean,
    val temporary: Boolean,
    val requestStatus: String?,
    val requestStatusLabel: String?,
    val requestDirection: String?,
    val requestId: Long?,
)

data class ChatMessageResponse(
    val id: Long,
    val content: String,
    val time: String,
    val isMine: Boolean,
    val messageType: String,
    val mediaUrl: String?,
)

data class ConversationDetailResponse(
    val id: Long,
    val participantUserId: Long,
    val groupNumber: Long?,
    val groupName: String?,
    val groupDescription: String?,
    val name: String,
    val avatarSeed: String,
    val avatarUrl: String?,
    val online: Boolean,
    val nickname: String,
    val isFriend: Boolean,
    val temporary: Boolean,
    val requestStatus: String?,
    val requestStatusLabel: String?,
    val requestDirection: String?,
    val requestId: Long?,
    val messages: List<ChatMessageResponse>,
)

data class OpenDirectConversationRequest(
    val targetUserId: Long,
)

data class OpenGroupConversationRequest(
    val groupNumber: Long? = null,
    val memberUserIds: List<Long> = emptyList(),
    val groupName: String? = null,
    val groupDescription: String? = null,
    val groupAvatarUrl: String? = null,
)

data class UpdateGroupConversationRequest(
    val groupName: String? = null,
    val groupDescription: String? = null,
    val groupAvatarUrl: String? = null,
    val memberUserIds: List<Long> = emptyList(),
)

data class SendMessageRequest(
    val content: String,
    val messageType: String? = null,
    val mediaUrl: String? = null,
)

data class UploadedMessageMediaResponse(
    val mediaUrl: String,
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

data class GroupMemberResponse(
    val userId: Long,
    val uNumber: Long,
    val nickname: String,
    val avatarUrl: String?,
    val isAdmin: Boolean,
)
