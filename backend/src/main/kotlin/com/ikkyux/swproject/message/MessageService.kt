package com.ikkyux.swproject.message

import com.ikkyux.swproject.message.entity.MessageEntity
import com.ikkyux.swproject.message.entity.ConversationEntity
import com.ikkyux.swproject.message.entity.ConversationMemberEntity
import com.ikkyux.swproject.message.repository.ConversationMemberRepository
import com.ikkyux.swproject.message.repository.ConversationRepository
import com.ikkyux.swproject.message.repository.MessageRepository
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import com.ikkyux.swproject.user.repository.VerificationRecordRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class MessageService(
    private val conversationRepository: ConversationRepository,
    private val conversationMemberRepository: ConversationMemberRepository,
    private val messageRepository: MessageRepository,
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val verificationRecordRepository: VerificationRecordRepository,
) {

    fun getConversations(userId: Long): List<ConversationSummaryResponse> {
        val memberships = conversationMemberRepository.findAllByUserId(userId)
        return memberships.mapNotNull { membership ->
            val conversation = conversationRepository.findById(membership.conversationId).orElse(null) ?: return@mapNotNull null
            val lastMessage = messageRepository.findTopByConversationIdOrderBySentAtDesc(conversation.id!!) ?: return@mapNotNull null
            val otherMember = conversationMemberRepository.findAllByConversationId(conversation.id!!)
                .firstOrNull { it.userId != userId } ?: return@mapNotNull null
            val otherProfile = userProfileRepository.findByUserId(otherMember.userId) ?: return@mapNotNull null

            ConversationSummaryResponse(
                id = conversation.id!!,
                participantUserId = otherMember.userId,
                name = otherProfile.nickname,
                avatarSeed = otherProfile.nickname,
                lastMessage = lastMessage.content,
                time = formatTime(lastMessage.sentAt),
                unread = membership.unreadCount,
                online = true,
                pinned = membership.unreadCount > 0,
                status = if (lastMessage.senderId == userId) "sent" else "read",
                nickname = "",
            )
        }.sortedByDescending { it.time }
    }

    @Transactional
    fun getConversationDetail(userId: Long, conversationId: Long): ConversationDetailResponse {
        val membership = conversationMemberRepository.findByConversationIdAndUserId(conversationId, userId)
            ?: throw IllegalArgumentException("会话不存在")
        membership.unreadCount = 0
        conversationMemberRepository.save(membership)

        val otherMember = conversationMemberRepository.findAllByConversationId(conversationId)
            .firstOrNull { it.userId != userId }
            ?: throw IllegalArgumentException("会话成员不存在")
        val otherProfile = userProfileRepository.findByUserId(otherMember.userId)
            ?: throw IllegalArgumentException("用户资料不存在")

        return ConversationDetailResponse(
            id = conversationId,
            participantUserId = otherMember.userId,
            name = otherProfile.nickname,
            avatarSeed = otherProfile.nickname,
            online = true,
            nickname = "",
            messages = messageRepository.findAllByConversationIdOrderBySentAtAsc(conversationId).map {
                ChatMessageResponse(
                    id = it.id!!,
                    content = it.content,
                    time = formatTime(it.sentAt),
                    isMine = it.senderId == userId,
                )
            },
        )
    }

    @Transactional
    fun openDirectConversation(userId: Long, targetUserId: Long): ConversationDetailResponse {
        if (userId == targetUserId) {
            throw IllegalArgumentException("不能和自己发起私聊")
        }
        userRepository.findById(targetUserId).orElseThrow { IllegalArgumentException("目标用户不存在") }

        val existing = conversationMemberRepository.findAllByUserId(userId)
            .map { it.conversationId }
            .firstOrNull { conversationId ->
                val members = conversationMemberRepository.findAllByConversationId(conversationId)
                members.size == 2 && members.any { it.userId == targetUserId }
            }

        val conversationId = existing ?: createDirectConversation(userId, targetUserId)
        return getConversationDetail(userId, conversationId)
    }

    @Transactional
    fun sendMessage(userId: Long, conversationId: Long, request: SendMessageRequest): ChatMessageResponse {
        if (conversationMemberRepository.findByConversationIdAndUserId(conversationId, userId) == null) {
            throw IllegalArgumentException("会话不存在")
        }
        val message = messageRepository.save(
            MessageEntity(
                conversationId = conversationId,
                senderId = userId,
                content = request.content,
                status = "SENT",
                sentAt = LocalDateTime.now(),
            )
        )

        val conversation = conversationRepository.findById(conversationId)
            .orElseThrow { IllegalArgumentException("会话不存在") }
        conversation.lastMessageId = message.id
        conversation.lastMessageAt = message.sentAt
        conversation.updatedAt = LocalDateTime.now()
        conversationRepository.save(conversation)

        conversationMemberRepository.findAllByConversationId(conversationId)
            .filter { it.userId != userId }
            .forEach {
                it.unreadCount += 1
                conversationMemberRepository.save(it)
            }

        return ChatMessageResponse(
            id = message.id!!,
            content = message.content,
            time = formatTime(message.sentAt),
            isMine = true,
        )
    }

    fun getNotifications(userId: Long): List<NotificationResponse> {
        val verification = verificationRecordRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
        val notifications = mutableListOf(
            NotificationResponse(
                id = 1,
                type = "match",
                icon = "👋",
                title = "新的匹配推荐",
                content = "系统为你推荐了更适合当前状态的新朋友。",
                time = "刚刚",
                read = false,
            ),
            NotificationResponse(
                id = 2,
                type = "community",
                icon = "💬",
                title = "社区提醒",
                content = "你关注的话题里出现了新的讨论，可以去看看。",
                time = "30分钟前",
                read = false,
            ),
        )

        if (verification != null) {
            notifications += NotificationResponse(
                id = 3,
                type = "verification",
                icon = "🛡️",
                title = "认证状态更新",
                content = "你的认证当前状态为 ${verification.status}。",
                time = formatTime(verification.createdAt),
                read = verification.status == "APPROVED",
            )
        }

        return notifications
    }

    private fun formatTime(value: LocalDateTime): String =
        value.format(DateTimeFormatter.ofPattern("MM-dd HH:mm"))

    private fun createDirectConversation(userId: Long, targetUserId: Long): Long {
        val conversation = conversationRepository.save(
            ConversationEntity(
                conversationType = "PRIVATE",
                status = "ACTIVE",
            )
        )
        conversationMemberRepository.save(
            ConversationMemberEntity(
                conversationId = conversation.id!!,
                userId = userId,
                unreadCount = 0,
            )
        )
        conversationMemberRepository.save(
            ConversationMemberEntity(
                conversationId = conversation.id!!,
                userId = targetUserId,
                unreadCount = 0,
            )
        )
        return conversation.id!!
    }
}
