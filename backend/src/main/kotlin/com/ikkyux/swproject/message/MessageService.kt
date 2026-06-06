package com.ikkyux.swproject.message

import com.ikkyux.swproject.message.entity.MessageEntity
import com.ikkyux.swproject.message.entity.ConversationEntity
import com.ikkyux.swproject.message.entity.ConversationMemberEntity
import com.ikkyux.swproject.user.repository.BlockRecordRepository
import com.ikkyux.swproject.message.repository.ConversationMemberRepository
import com.ikkyux.swproject.message.repository.ConversationRepository
import com.ikkyux.swproject.message.repository.MessageRepository
import com.ikkyux.swproject.user.repository.FriendRequestRepository
import com.ikkyux.swproject.user.repository.FriendshipRepository
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import com.ikkyux.swproject.user.repository.VerificationRecordRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.random.Random
import java.util.UUID

@Service
class MessageService(
    private val conversationRepository: ConversationRepository,
    private val conversationMemberRepository: ConversationMemberRepository,
    private val messageRepository: MessageRepository,
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val verificationRecordRepository: VerificationRecordRepository,
    private val friendRequestRepository: FriendRequestRepository,
    private val friendshipRepository: FriendshipRepository,
    private val blockRecordRepository: BlockRecordRepository,
    @Value("\${app.public-base-url:http://localhost:8080}") private val appPublicBaseUrl: String,
) {

    fun getConversations(userId: Long): List<ConversationSummaryResponse> {
        val memberships = conversationMemberRepository.findAllByUserId(userId)
        return memberships.mapNotNull { membership ->
            val conversation = conversationRepository.findById(membership.conversationId).orElse(null) ?: return@mapNotNull null
            val lastMessage = messageRepository.findTopByConversationIdOrderBySentAtDesc(conversation.id!!) ?: return@mapNotNull null
            if (conversation.conversationType == "GROUP") {
                val groupMembers = conversationMemberRepository.findAllByConversationId(conversation.id!!)
                val avatarSeed = "group-${conversation.groupNumber ?: conversation.id}"
                ConversationSummaryResponse(
                    id = conversation.id!!,
                    participantUserId = 0L,
                    groupNumber = conversation.groupNumber,
                    groupName = conversation.groupName,
                    groupDescription = conversation.groupDescription,
                    name = groupName(conversation),
                    avatarSeed = avatarSeed,
                    avatarUrl = conversation.groupAvatarUrl,
                    lastMessage = lastMessage.content,
                    time = formatTime(lastMessage.sentAt),
                    unread = membership.unreadCount,
                    online = groupMembers.size > 1,
                    pinned = membership.unreadCount > 0,
                    status = if (lastMessage.senderId == userId) "sent" else "read",
                    nickname = "",
                    isFriend = false,
                    temporary = false,
                    requestStatus = null,
                    requestStatusLabel = null,
                    requestDirection = null,
                    requestId = null,
                )
            } else {
                val otherMember = conversationMemberRepository.findAllByConversationId(conversation.id!!)
                    .firstOrNull { it.userId != userId } ?: return@mapNotNull null
                if (isBlockedBetween(userId, otherMember.userId)) {
                    return@mapNotNull null
                }
                val isFriend = friendshipRepository.existsByUserIdAndFriendUserIdAndStatus(userId, otherMember.userId)
                if (!isFriend) {
                    return@mapNotNull null
                }
                val otherProfile = userProfileRepository.findByUserId(otherMember.userId) ?: return@mapNotNull null
                val friendship = friendshipRepository.findByUserIdAndFriendUserId(userId, otherMember.userId)
                val (requestStatus, requestDirection, requestId, requestStatusLabel) = friendRequestMeta(userId, otherMember.userId)
                val displayName = resolveFriendDisplayName(friendship, otherProfile.nickname)

                ConversationSummaryResponse(
                    id = conversation.id!!,
                    participantUserId = otherMember.userId,
                    groupNumber = null,
                    groupName = null,
                    groupDescription = null,
                    name = displayName,
                    avatarSeed = otherProfile.nickname,
                    avatarUrl = otherProfile.avatarUrl,
                    lastMessage = lastMessage.content,
                    time = formatTime(lastMessage.sentAt),
                    unread = membership.unreadCount,
                    online = true,
                    pinned = membership.unreadCount > 0,
                    status = if (lastMessage.senderId == userId) "sent" else "read",
                    nickname = otherProfile.nickname,
                    isFriend = true,
                    temporary = false,
                    requestStatus = requestStatus,
                    requestStatusLabel = requestStatusLabel,
                    requestDirection = requestDirection,
                    requestId = requestId,
                )
            }
        }.sortedByDescending { it.time }
    }

    @Transactional
    fun getConversationDetail(userId: Long, conversationId: Long): ConversationDetailResponse {
        val membership = conversationMemberRepository.findByConversationIdAndUserId(conversationId, userId)
            ?: throw IllegalArgumentException("会话不存在")
        membership.unreadCount = 0
        conversationMemberRepository.save(membership)
        val conversation = conversationRepository.findById(conversationId)
            .orElseThrow { IllegalArgumentException("会话不存在") }

        val isGroup = conversation.conversationType == "GROUP"
        val participants = conversationMemberRepository.findAllByConversationId(conversationId)
        val otherMember = participants.firstOrNull { it.userId != userId }
        val otherProfile = otherMember?.userId?.let { userProfileRepository.findByUserId(it) }
        val friendship = otherMember?.let { friendshipRepository.findByUserIdAndFriendUserId(userId, it.userId) }
        val (requestStatus, requestDirection, requestId, requestStatusLabel) =
            otherMember?.let { friendRequestMeta(userId, it.userId) } ?: Quad(null, null, null, null)
        val displayName = if (isGroup) null else otherProfile?.let { resolveFriendDisplayName(friendship, it.nickname) }

        return ConversationDetailResponse(
            id = conversationId,
            participantUserId = if (isGroup) 0L else otherMember?.userId ?: 0L,
            groupNumber = conversation.groupNumber,
            groupName = conversation.groupName,
            groupDescription = conversation.groupDescription,
            name = if (isGroup) groupName(conversation) else displayName ?: throw IllegalArgumentException("用户资料不存在"),
            avatarSeed = if (isGroup) "group-${conversation.groupNumber ?: conversation.id}" else otherProfile!!.nickname,
            avatarUrl = if (isGroup) conversation.groupAvatarUrl else otherProfile?.avatarUrl,
            online = isGroup || (otherMember != null && !isBlockedBetween(userId, otherMember.userId)),
            nickname = if (isGroup) "" else otherProfile?.nickname ?: throw IllegalArgumentException("用户资料不存在"),
            isFriend = !isGroup && otherMember?.let { friendshipRepository.existsByUserIdAndFriendUserIdAndStatus(userId, it.userId) } == true,
            temporary = !isGroup && otherMember?.let { !friendshipRepository.existsByUserIdAndFriendUserIdAndStatus(userId, it.userId) } == true,
            requestStatus = if (isGroup) null else requestStatus,
            requestStatusLabel = if (isGroup) null else requestStatusLabel,
            requestDirection = if (isGroup) null else requestDirection,
            requestId = if (isGroup) null else requestId,
            messages = messageRepository.findAllByConversationIdOrderBySentAtAsc(conversationId).map {
                ChatMessageResponse(
                    id = it.id!!,
                    content = it.content,
                    time = formatTime(it.sentAt),
                    isMine = it.senderId == userId,
                    messageType = it.messageType,
                    mediaUrl = it.mediaUrl,
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
        if (isBlockedBetween(userId, targetUserId)) {
            throw IllegalArgumentException("已屏蔽对方，无法发起私聊")
        }

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
    fun openGroupConversation(userId: Long, memberUserIds: List<Long>): ConversationDetailResponse {
        val targetMemberIds = memberUserIds.distinct().filter { it != userId }
        require(targetMemberIds.isNotEmpty()) { "请选择至少一位群成员" }
        targetMemberIds.forEach { userRepository.findById(it).orElseThrow { IllegalArgumentException("群成员不存在") } }

        val expectedMemberIds = (targetMemberIds + userId).toSet()
        val existing = conversationMemberRepository.findAllByUserId(userId)
            .map { it.conversationId }
            .distinct()
            .firstOrNull { conversationId ->
                val conversation = conversationRepository.findById(conversationId).orElse(null) ?: return@firstOrNull false
                if (conversation.conversationType != "GROUP") return@firstOrNull false
                val members = conversationMemberRepository.findAllByConversationId(conversationId).map { it.userId }.toSet()
                members == expectedMemberIds
            }

        return existing?.let { getConversationDetail(userId, it) }
            ?: createGroupConversation(
                userId = userId,
                memberUserIds = targetMemberIds,
                groupName = null,
                groupDescription = null,
                groupAvatarUrl = null,
            )
    }

    @Transactional
    fun openGroupConversationByNumber(userId: Long, groupNumber: Long): ConversationDetailResponse {
        val conversation = conversationRepository.findAll().firstOrNull {
            it.conversationType == "GROUP" && it.groupNumber == groupNumber
        } ?: throw IllegalArgumentException("群号不存在")
        if (conversationMemberRepository.findByConversationIdAndUserId(conversation.id!!, userId) == null) {
            conversationMemberRepository.save(
                ConversationMemberEntity(
                    conversationId = conversation.id!!,
                    userId = userId,
                    unreadCount = 0,
                )
            )
        }
        return getConversationDetail(userId, conversation.id!!)
    }

    fun getGroupMembers(userId: Long, conversationId: Long): List<GroupMemberResponse> {
        val conversation = conversationRepository.findById(conversationId).orElseThrow { IllegalArgumentException("群聊不存在") }
        if (conversation.conversationType != "GROUP") {
            throw IllegalArgumentException("不是群聊")
        }
        if (conversationMemberRepository.findByConversationIdAndUserId(conversationId, userId) == null) {
            throw IllegalArgumentException("你不是群成员")
        }
        return conversationMemberRepository.findAllByConversationId(conversationId).mapNotNull { member ->
            val user = userRepository.findById(member.userId).orElse(null) ?: return@mapNotNull null
            val profile = userProfileRepository.findByUserId(member.userId) ?: return@mapNotNull null
            GroupMemberResponse(
                userId = member.userId,
                uNumber = user.uNumber!!,
                nickname = profile.nickname,
                avatarUrl = profile.avatarUrl,
                isAdmin = member.isAdmin,
            )
        }
    }

    @Transactional
    fun updateGroupConversation(userId: Long, conversationId: Long, request: UpdateGroupConversationRequest): ConversationDetailResponse {
        val conversation = conversationRepository.findById(conversationId).orElseThrow { IllegalArgumentException("群聊不存在") }
        if (conversation.conversationType != "GROUP") {
            throw IllegalArgumentException("不是群聊")
        }
        if (conversationMemberRepository.findByConversationIdAndUserId(conversationId, userId) == null) {
            throw IllegalArgumentException("你不是群成员")
        }
        conversation.groupName = request.groupName?.trim()?.takeIf { it.isNotBlank() } ?: conversation.groupName
        conversation.groupDescription = request.groupDescription?.trim()?.takeIf { it.isNotBlank() } ?: conversation.groupDescription
        conversation.groupAvatarUrl = request.groupAvatarUrl?.trim()?.takeIf { it.isNotBlank() } ?: conversation.groupAvatarUrl
        conversationRepository.save(conversation)

        val existingMembers = conversationMemberRepository.findAllByConversationId(conversationId).map { it.userId }.toSet()
        val targetMemberIds = request.memberUserIds.distinct().filter { it != userId && !existingMembers.contains(it) }
        targetMemberIds.forEach { userRepository.findById(it).orElseThrow { IllegalArgumentException("群成员不存在") } }
        targetMemberIds.forEach { memberId ->
            conversationMemberRepository.save(
                ConversationMemberEntity(conversationId = conversationId, userId = memberId, unreadCount = 0)
            )
        }
        return getConversationDetail(userId, conversationId)
    }

    @Transactional
    fun createGroupConversation(
        userId: Long,
        memberUserIds: List<Long>,
        groupName: String?,
        groupDescription: String?,
        groupAvatarUrl: String?,
    ): ConversationDetailResponse {
        val targetMemberIds = memberUserIds.distinct().filter { it != userId }
        require(targetMemberIds.isNotEmpty()) { "请选择至少一位群成员" }
        targetMemberIds.forEach { userRepository.findById(it).orElseThrow { IllegalArgumentException("群成员不存在") } }
        val conversation = conversationRepository.save(
            ConversationEntity(
                conversationType = "GROUP",
                groupNumber = generateUniqueGroupNumber(),
                groupName = groupName?.trim()?.takeIf { it.isNotBlank() },
                groupDescription = groupDescription?.trim()?.takeIf { it.isNotBlank() },
                groupAvatarUrl = groupAvatarUrl?.trim()?.takeIf { it.isNotBlank() },
                status = "ACTIVE",
            )
        )
        (targetMemberIds + userId).distinct().forEach { memberId ->
            conversationMemberRepository.save(
                ConversationMemberEntity(
                    conversationId = conversation.id!!,
                    userId = memberId,
                    unreadCount = 0,
                    isAdmin = memberId == userId,
                )
            )
        }
        return getConversationDetail(userId, conversation.id!!)
    }

    @Transactional
    fun sendMessage(userId: Long, conversationId: Long, request: SendMessageRequest): ChatMessageResponse {
        if (conversationMemberRepository.findByConversationIdAndUserId(conversationId, userId) == null) {
            throw IllegalArgumentException("会话不存在")
        }
        val normalizedMessageType = request.messageType?.trim()?.uppercase()?.takeIf { it.isNotBlank() } ?: "TEXT"
        require(normalizedMessageType == "TEXT" || normalizedMessageType == "VOICE") { "暂不支持的消息类型" }
        if (normalizedMessageType == "VOICE") {
            require(!request.mediaUrl.isNullOrBlank()) { "语音消息缺少音频文件" }
        }
        val message = messageRepository.save(
            MessageEntity(
                conversationId = conversationId,
                senderId = userId,
                messageType = normalizedMessageType,
                content = request.content,
                mediaUrl = request.mediaUrl?.trim()?.takeIf { it.isNotBlank() },
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
            messageType = message.messageType,
            mediaUrl = message.mediaUrl,
        )
    }

    @Transactional
    fun uploadVoiceMessage(userId: Long, file: MultipartFile): UploadedMessageMediaResponse {
        require(!file.isEmpty) { "语音文件不能为空" }
        require(file.contentType?.startsWith("audio/") == true || file.originalFilename?.substringAfterLast('.', "")?.lowercase() in setOf("webm", "mp3", "wav", "m4a", "ogg", "aac")) {
            "请上传音频文件"
        }
        return UploadedMessageMediaResponse(mediaUrl = storeVoiceMessage(userId, file))
    }

    fun getNotifications(userId: Long): List<NotificationResponse> {
        val notifications = mutableListOf<NotificationResponse>()

        friendRequestRepository.findAllByRequesterUserIdOrderByUpdatedAtDesc(userId)
            .take(3)
            .forEach { request ->
                val targetProfile = userProfileRepository.findByUserId(request.receiverUserId) ?: return@forEach
                notifications += NotificationResponse(
                    id = request.id!!,
                    type = "friend_request",
                    icon = "👋",
                    title = if (request.status == "PENDING") "好友申请待处理" else "好友申请已更新",
                    content = "来自 ${targetProfile.nickname} 的好友申请，当前状态：${request.status}",
                    time = formatTime(request.updatedAt),
                    read = request.status == "ACCEPTED",
                )
            }

        verificationRecordRepository.findTopByUserIdOrderByCreatedAtDesc(userId)?.let { verification ->
            notifications += NotificationResponse(
                id = verification.id!!,
                type = "verification",
                icon = "🛡️",
                title = "认证状态更新",
                content = "你的认证当前状态为 ${verification.status}。",
                time = formatTime(verification.createdAt),
                read = verification.status == "APPROVED",
            )
        }

        val conversations = conversationMemberRepository.findAllByUserId(userId)
            .mapNotNull { membership ->
                val conversation = conversationRepository.findById(membership.conversationId).orElse(null) ?: return@mapNotNull null
                val lastMessage = messageRepository.findTopByConversationIdOrderBySentAtDesc(conversation.id!!) ?: return@mapNotNull null
                NotificationResponse(
                    id = conversation.id!!,
                    type = "message",
                    icon = "💬",
                    title = "新的消息",
                    content = lastMessage.content.take(40),
                    time = formatTime(lastMessage.sentAt),
                    read = membership.unreadCount == 0,
                )
            }

        return (notifications + conversations)
            .sortedByDescending { it.time }
            .take(10)
    }

    private fun formatTime(value: LocalDateTime): String =
        value.format(DateTimeFormatter.ofPattern("MM-dd HH:mm"))

    private fun friendRequestMeta(userId: Long, otherUserId: Long): Quad<String?, String?, Long?, String?> {
        val outgoing = friendRequestRepository.findByRequesterUserIdAndReceiverUserId(userId, otherUserId)
        if (outgoing != null) {
            return Quad(outgoing.status, "OUTGOING", outgoing.id, requestStatusLabel(outgoing.status, "OUTGOING"))
        }
        val incoming = friendRequestRepository.findByRequesterUserIdAndReceiverUserId(otherUserId, userId)
        if (incoming != null) {
            return Quad(incoming.status, "INCOMING", incoming.id, requestStatusLabel(incoming.status, "INCOMING"))
        }
        return Quad(null, null, null, null)
    }

    private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)

    private fun isBlockedBetween(userId: Long, targetUserId: Long): Boolean =
        blockRecordRepository.existsByUserIdAndTargetUserId(userId, targetUserId) ||
            blockRecordRepository.existsByUserIdAndTargetUserId(targetUserId, userId)

    private fun requestStatusLabel(status: String, direction: String): String =
        when (status) {
            "PENDING" -> if (direction == "OUTGOING") "待同意" else "待处理"
            "REJECTED" -> "被拒绝"
            "ACCEPTED" -> "已同意"
            else -> status
        }

    private fun resolveFriendDisplayName(friendship: com.ikkyux.swproject.user.entity.FriendshipEntity?, originalNickname: String): String =
        friendship?.remarkName?.trim()?.takeIf { it.isNotBlank() } ?: originalNickname

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

    private fun generateUniqueGroupNumber(): Long {
        var groupNumber: Long
        do {
            groupNumber = Random.nextLong(100_000_000L, 999_999_999L)
        } while (conversationRepository.findAll().any { it.groupNumber == groupNumber })
        return groupNumber
    }

    private fun groupName(conversation: ConversationEntity): String =
        "群聊${conversation.groupNumber ?: conversation.id}"

    private fun storeVoiceMessage(userId: Long, file: MultipartFile): String {
        val uploadDir = Paths.get("uploads", "messages", "voice")
        Files.createDirectories(uploadDir)

        val extension = when (file.originalFilename?.substringAfterLast('.', "")?.lowercase()) {
            "webm", "mp3", "wav", "m4a", "ogg", "aac" -> file.originalFilename!!.substringAfterLast('.')
            else -> "webm"
        }
        val filename = "voice-${userId}-${UUID.randomUUID()}.$extension"
        val target = uploadDir.resolve(filename)
        file.inputStream.use { input ->
            Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING)
        }
        return "$appPublicBaseUrl/uploads/messages/voice/$filename"
    }
}
