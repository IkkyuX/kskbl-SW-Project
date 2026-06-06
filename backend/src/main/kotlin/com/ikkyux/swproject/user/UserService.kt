package com.ikkyux.swproject.user

import com.ikkyux.swproject.community.repository.PostCommentRepository
import com.ikkyux.swproject.community.repository.PostRepository
import com.ikkyux.swproject.message.MessageService
import com.ikkyux.swproject.message.SendMessageRequest
import com.ikkyux.swproject.message.repository.MessageRepository
import com.ikkyux.swproject.user.entity.BlockRecordEntity
import com.ikkyux.swproject.user.entity.FriendRequestEntity
import com.ikkyux.swproject.user.entity.FriendshipEntity
import com.ikkyux.swproject.user.entity.UserProfileEntity
import com.ikkyux.swproject.user.entity.UserTagEntity
import com.ikkyux.swproject.user.repository.BlockRecordRepository
import com.ikkyux.swproject.user.repository.FriendRequestRepository
import com.ikkyux.swproject.user.repository.FriendshipRepository
import com.ikkyux.swproject.user.repository.TagRepository
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import com.ikkyux.swproject.user.repository.UserTagRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.multipart.MultipartFile
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
class UserService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val tagRepository: TagRepository,
    private val userTagRepository: UserTagRepository,
    private val postRepository: PostRepository,
    private val postCommentRepository: PostCommentRepository,
    private val messageRepository: MessageRepository,
    private val messageService: MessageService,
    private val friendshipRepository: FriendshipRepository,
    private val friendRequestRepository: FriendRequestRepository,
    private val blockRecordRepository: BlockRecordRepository,
    @Value("\${app.public-base-url:http://localhost:8080}") private val publicBaseUrl: String,
) {

    fun getProfile(requestedUserId: Long?): UserProfileResponse {
        val userId = resolveUserId(requestedUserId)
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("用户不存在") }
        val profile = userProfileRepository.findByUserId(userId)
            ?: throw IllegalArgumentException("用户资料不存在")
        val tagIds = userTagRepository.findByUserId(userId).map { it.tagId }
        val tags = if (tagIds.isEmpty()) emptyList() else tagRepository.findAllByIdIn(tagIds).map { it.nameZh }
        val levelSummary = buildLevelSummary(userId, profile)

        return UserProfileResponse(
            id = userId,
            uNumber = user.uNumber!!,
            nickname = profile.nickname,
            avatarUrl = profile.avatarUrl,
            level = levelSummary.level,
            experience = levelSummary.experience,
            school = profile.schoolCode ?: "",
            major = profile.major ?: "",
            languages = profile.languages?.split(",")?.filter { it.isNotBlank() } ?: emptyList(),
            bio = profile.bio ?: "",
            tags = tags,
            status = tags.firstOrNull { it == "刚到韩国" || it == "选课中" || it == "找兼职中" || it == "心情低落" } ?: "未设置",
            privacyLevel = profile.privacyLevel
        )
    }

    fun getLevelSummary(requestedUserId: Long?): LevelSummaryResponse {
        val userId = resolveUserId(requestedUserId)
        val profile = userProfileRepository.findByUserId(userId)
            ?: throw IllegalArgumentException("用户资料不存在")
        return buildLevelSummary(userId, profile)
    }

    @Transactional
    fun updateProfile(requestedUserId: Long?, request: UpdateProfileRequest): UserProfileResponse {
        val userId = resolveUserId(requestedUserId)
        val profile = userProfileRepository.findByUserId(userId) ?: UserProfileEntity(userId = userId)
        profile.nickname = request.nickname
        profile.schoolCode = request.school
        profile.major = request.major
        profile.languages = request.languages.joinToString(",")
        profile.bio = request.bio
        profile.privacyLevel = request.privacyLevel.ifBlank { profile.privacyLevel }
        profile.updatedAt = java.time.LocalDateTime.now()
        userProfileRepository.save(profile)
        return getProfile(userId)
    }

    @Transactional
    fun updateAvatar(requestedUserId: Long?, file: MultipartFile): UserProfileResponse {
        require(!file.isEmpty) { "头像文件不能为空" }
        require(file.contentType?.startsWith("image/") == true) { "请上传图片文件" }

        val userId = resolveUserId(requestedUserId)
        val profile = userProfileRepository.findByUserId(userId) ?: UserProfileEntity(userId = userId)
        val avatarUrl = storeAvatar(userId, file)
        profile.avatarUrl = avatarUrl
        profile.updatedAt = java.time.LocalDateTime.now()
        userProfileRepository.save(profile)
        return getProfile(userId)
    }

    fun getTags(): Map<String, List<String>> =
        mapOf(
            "interestTags" to tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("INTEREST").map { it.nameZh },
            "sceneTags" to tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("SCENE").map { it.nameZh },
            "statusTags" to tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("STATUS").map { it.nameZh }
        )

    fun getTagCatalog(): TagCatalogResponse =
        TagCatalogResponse(
            interestTags = tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("INTEREST").map {
                TagOptionResponse(id = it.id!!, name = it.nameZh, type = it.tagType)
            },
            sceneTags = tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("SCENE").map {
                TagOptionResponse(id = it.id!!, name = it.nameZh, type = it.tagType)
            },
            statusTags = tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("STATUS").map {
                TagOptionResponse(id = it.id!!, name = it.nameZh, type = it.tagType)
            },
        )

    fun getPublicUsers(): List<PublicUserSummaryResponse> =
        userRepository.findAll()
            .mapNotNull { user ->
                val userId = user.id ?: return@mapNotNull null
                val profile = userProfileRepository.findByUserId(userId) ?: return@mapNotNull null
                PublicUserSummaryResponse(
                    userId = userId,
                    uNumber = user.uNumber ?: return@mapNotNull null,
                    email = user.email,
                    nickname = profile.nickname,
                    originalNickname = profile.nickname,
                    remarkName = null,
                    isFriend = false,
                    avatarUrl = profile.avatarUrl,
                    school = profile.schoolCode ?: "",
                    major = profile.major ?: "",
                    languages = profile.languages?.split(",")?.filter { it.isNotBlank() } ?: emptyList(),
                    bio = profile.bio ?: "",
                )
            }
            .sortedBy { it.uNumber }

    fun getPublicUser(requestedUserId: Long?, userId: Long): PublicUserSummaryResponse {
        val currentUserId = resolveUserId(requestedUserId)
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("用户不存在") }
        val profile = userProfileRepository.findByUserId(userId)
            ?: throw IllegalArgumentException("用户资料不存在")
        val friendship = friendshipRepository.findByUserIdAndFriendUserId(currentUserId, userId)
        val originalNickname = profile.nickname
        return PublicUserSummaryResponse(
            userId = userId,
            uNumber = user.uNumber ?: throw IllegalArgumentException("用户编号不存在"),
            email = user.email,
            nickname = resolveFriendDisplayName(friendship, originalNickname),
            originalNickname = originalNickname,
            remarkName = friendship?.remarkName?.trim()?.takeIf { it.isNotBlank() },
            isFriend = friendship?.status == "ACTIVE",
            avatarUrl = profile.avatarUrl,
            school = profile.schoolCode ?: "",
            major = profile.major ?: "",
            languages = profile.languages?.split(",")?.filter { it.isNotBlank() } ?: emptyList(),
            bio = profile.bio ?: "",
        )
    }

    fun getBlockedUsers(requestedUserId: Long?): List<BlockResponse> {
        val userId = resolveUserId(requestedUserId)
        return blockRecordRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
            .mapNotNull { record ->
                val targetUser = userRepository.findById(record.targetUserId).orElse(null) ?: return@mapNotNull null
                val profile = userProfileRepository.findByUserId(record.targetUserId) ?: return@mapNotNull null
                BlockResponse(
                    userId = record.userId,
                    targetUserId = record.targetUserId,
                    targetUNumber = targetUser.uNumber!!,
                    targetNickname = profile.nickname,
                    targetAvatarUrl = profile.avatarUrl,
                    createdAt = record.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                )
            }
    }

    @Transactional
    fun blockUser(requestedUserId: Long?, request: BlockUserRequest): BlockResponse {
        val userId = resolveUserId(requestedUserId)
        require(request.targetUserId != userId) { "不能屏蔽自己" }
        userRepository.findById(request.targetUserId).orElseThrow { IllegalArgumentException("目标用户不存在") }

        val record = blockRecordRepository.findByUserIdAndTargetUserId(userId, request.targetUserId)
            ?: BlockRecordEntity(userId = userId, targetUserId = request.targetUserId)
        record.createdAt = LocalDateTime.now()
        return blockRecordToResponse(blockRecordRepository.save(record))
    }

    @Transactional
    fun unblockUser(requestedUserId: Long?, targetUserId: Long): Map<String, Any> {
        val userId = resolveUserId(requestedUserId)
        blockRecordRepository.deleteByUserIdAndTargetUserId(userId, targetUserId)
        return mapOf("status" to "UNBLOCKED", "targetUserId" to targetUserId)
    }

    fun getFriends(requestedUserId: Long?): List<FriendResponse> {
        val userId = resolveUserId(requestedUserId)
        return friendshipRepository.findAllByUserIdAndStatusOrderByCreatedAtDesc(userId)
            .filter { friendship -> !isBlockedBetween(userId, friendship.friendUserId) }
            .mapNotNull { friendship ->
                val friendUser = userRepository.findById(friendship.friendUserId).orElse(null) ?: return@mapNotNull null
                val profile = userProfileRepository.findByUserId(friendship.friendUserId) ?: return@mapNotNull null
                val originalNickname = profile.nickname
                FriendResponse(
                    userId = friendship.friendUserId,
                    uNumber = friendUser.uNumber!!,
                    nickname = resolveFriendDisplayName(friendship, originalNickname),
                    originalNickname = originalNickname,
                    remarkName = friendship.remarkName?.trim()?.takeIf { it.isNotBlank() },
                    avatarUrl = profile.avatarUrl,
                    school = profile.schoolCode ?: "",
                    major = profile.major ?: "",
                    bio = profile.bio ?: "",
                    status = "ACTIVE",
                )
            }
    }

    @Transactional
    fun updateFriendRemark(requestedUserId: Long?, friendUserId: Long, request: UpdateFriendRemarkRequest): FriendResponse {
        val userId = resolveUserId(requestedUserId)
        require(friendUserId != userId) { "不能给自己设置备注" }
        val friendship = friendshipRepository.findByUserIdAndFriendUserId(userId, friendUserId)
            ?: throw IllegalArgumentException("该用户不是你的好友")
        require(friendship.status == "ACTIVE") { "该用户不是你的好友" }
        friendship.remarkName = normalizeRemarkName(request.remarkName)
        friendship.updatedAt = LocalDateTime.now()
        friendshipRepository.save(friendship)
        return getFriends(userId).firstOrNull { it.userId == friendUserId }
            ?: throw IllegalArgumentException("好友不存在")
    }

    fun getFriendRequests(requestedUserId: Long?): List<FriendRequestResponse> {
        val userId = resolveUserId(requestedUserId)
        val requests = friendRequestRepository.findAllByRequesterUserIdOrderByUpdatedAtDesc(userId) +
            friendRequestRepository.findAllByReceiverUserIdOrderByUpdatedAtDesc(userId)
        return requests.distinctBy { it.id }
            .sortedByDescending { it.updatedAt }
            .filter { request -> !isBlockedBetween(userId, request.requesterUserId) && !isBlockedBetween(userId, request.receiverUserId) }
            .map { it.toFriendRequestResponse(userId) }
    }

    @Transactional
    fun requestFriend(requestedUserId: Long?, request: AddFriendRequest): FriendRequestResponse {
        val userId = resolveUserId(requestedUserId)
        val targetUserId = resolveTargetUserId(request)
        if (userId == targetUserId) {
            throw IllegalArgumentException("不能添加自己为好友")
        }
        userRepository.findById(targetUserId).orElseThrow { IllegalArgumentException("目标用户不存在") }
        require(!isBlockedBetween(userId, targetUserId)) { "已屏蔽对方，无法发送好友申请" }
        if (friendshipRepository.existsByUserIdAndFriendUserIdAndStatus(userId, targetUserId)) {
            val existing = friendRequestRepository.findByRequesterUserIdAndReceiverUserId(userId, targetUserId)
                ?: FriendRequestEntity(requesterUserId = userId, receiverUserId = targetUserId)
            existing.status = "ACCEPTED"
            existing.updatedAt = LocalDateTime.now()
            return friendRequestRepository.save(existing).toFriendRequestResponse(userId)
        }

        val reciprocalPending = friendRequestRepository.findByRequesterUserIdAndReceiverUserId(targetUserId, userId)
        if (reciprocalPending?.status == "PENDING") {
            return acceptFriendRequest(userId, reciprocalPending.id!!)
        }

        val now = LocalDateTime.now()
        val friendRequest = friendRequestRepository.findByRequesterUserIdAndReceiverUserId(userId, targetUserId)
            ?: FriendRequestEntity(
                requesterUserId = userId,
                receiverUserId = targetUserId,
                createdAt = now,
            )
        if (friendRequest.status != "ACCEPTED") {
            friendRequest.status = "PENDING"
        }
        friendRequest.updatedAt = now
        return friendRequestRepository.save(friendRequest).toFriendRequestResponse(userId)
    }

    @Transactional
    fun acceptFriendRequest(requestedUserId: Long?, requestId: Long): FriendRequestResponse {
        val userId = resolveUserId(requestedUserId)
        val friendRequest = friendRequestRepository.findById(requestId)
            .orElseThrow { IllegalArgumentException("好友申请不存在") }
        if (friendRequest.receiverUserId != userId) {
            throw IllegalArgumentException("只能处理发给你的好友申请")
        }
        val shouldSendWelcomeMessage = friendRequest.status != "ACCEPTED"
        friendRequest.status = "ACCEPTED"
        friendRequest.updatedAt = LocalDateTime.now()
        upsertFriendship(friendRequest.requesterUserId, friendRequest.receiverUserId)
        upsertFriendship(friendRequest.receiverUserId, friendRequest.requesterUserId)
        val response = friendRequestRepository.save(friendRequest).toFriendRequestResponse(userId)
        if (shouldSendWelcomeMessage) {
            val directConversation = messageService.openDirectConversation(userId, friendRequest.requesterUserId)
            messageService.sendMessage(
                userId,
                directConversation.id,
                SendMessageRequest(content = "你们已经成为好友了，快来打个招呼吧～")
            )
        }
        return response
    }

    @Transactional
    fun rejectFriendRequest(requestedUserId: Long?, requestId: Long): FriendRequestResponse {
        val userId = resolveUserId(requestedUserId)
        val friendRequest = friendRequestRepository.findById(requestId)
            .orElseThrow { IllegalArgumentException("好友申请不存在") }
        if (friendRequest.receiverUserId != userId) {
            throw IllegalArgumentException("只能处理发给你的好友申请")
        }
        friendRequest.status = "REJECTED"
        friendRequest.updatedAt = LocalDateTime.now()
        return friendRequestRepository.save(friendRequest).toFriendRequestResponse(userId)
    }

    @Transactional
    fun updateTags(requestedUserId: Long?, request: UpdateTagsRequest): Map<String, Any> {
        val userId = resolveUserId(requestedUserId)
        userTagRepository.deleteByUserId(userId)
        request.tagIds.distinct().forEach { tagId ->
            userTagRepository.save(UserTagEntity(userId = userId, tagId = tagId))
        }
        return mapOf("userId" to userId, "tagIds" to request.tagIds.distinct(), "status" to "UPDATED")
    }

    private fun upsertFriendship(userId: Long, friendUserId: Long) {
        val now = LocalDateTime.now()
        val friendship = friendshipRepository.findByUserIdAndFriendUserId(userId, friendUserId)
            ?: FriendshipEntity(userId = userId, friendUserId = friendUserId, createdAt = now)
        friendship.status = "ACTIVE"
        friendship.updatedAt = now
        friendshipRepository.save(friendship)
    }

    fun getFriendRequestStatus(userId: Long, targetUserId: Long): Pair<String?, String?> {
        if (isBlockedBetween(userId, targetUserId)) {
            return null to null
        }
        val outgoing = friendRequestRepository.findByRequesterUserIdAndReceiverUserId(userId, targetUserId)
        if (outgoing != null) {
            return outgoing.status to "OUTGOING"
        }
        val incoming = friendRequestRepository.findByRequesterUserIdAndReceiverUserId(targetUserId, userId)
        if (incoming != null) {
            return incoming.status to "INCOMING"
        }
        return null to null
    }

    private fun FriendRequestEntity.toFriendRequestResponse(currentUserId: Long): FriendRequestResponse {
        val targetUserId = if (requesterUserId == currentUserId) receiverUserId else requesterUserId
        val targetUser = userRepository.findById(targetUserId).orElseThrow { IllegalArgumentException("目标用户不存在") }
        val targetProfile = userProfileRepository.findByUserId(targetUserId)
        val direction = if (requesterUserId == currentUserId) "OUTGOING" else "INCOMING"
        return FriendRequestResponse(
            id = id!!,
            requesterUserId = requesterUserId,
            receiverUserId = receiverUserId,
            targetUserId = targetUserId,
            targetUNumber = targetUser.uNumber!!,
            targetNickname = targetProfile?.nickname ?: "未知用户",
            targetAvatarUrl = targetProfile?.avatarUrl,
            direction = direction,
            status = status,
            statusLabel = statusLabel(status, direction),
            canRespond = direction == "INCOMING" && status == "PENDING",
            updatedAt = updatedAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
        )
    }

    private fun blockRecordToResponse(record: BlockRecordEntity): BlockResponse {
        val profile = userProfileRepository.findByUserId(record.targetUserId)
        return BlockResponse(
            userId = record.userId,
            targetUserId = record.targetUserId,
            targetUNumber = userRepository.findById(record.targetUserId).orElse(null)?.uNumber ?: 0L,
            targetNickname = profile?.nickname ?: "未知用户",
            targetAvatarUrl = profile?.avatarUrl,
            createdAt = record.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
        )
    }

    fun findByUNumber(uNumber: Long): UNumberLookupResponse {
        val user = userRepository.findByUNumber(uNumber)
            ?: throw IllegalArgumentException("目标用户不存在")
        val profile = userProfileRepository.findByUserId(user.id!!)
            ?: throw IllegalArgumentException("用户资料不存在")
        return UNumberLookupResponse(
            userId = user.id!!,
            uNumber = user.uNumber!!,
            nickname = profile.nickname,
            avatarUrl = profile.avatarUrl,
        )
    }

    private fun statusLabel(status: String, direction: String): String =
        when (status) {
            "PENDING" -> if (direction == "OUTGOING") "待同意" else "待处理"
            "REJECTED" -> "被拒绝"
            "ACCEPTED" -> "已同意"
            else -> status
        }

    private fun normalizeRemarkName(remarkName: String): String? =
        remarkName.trim()
            .take(24)
            .takeIf { it.isNotBlank() }

    fun resolveFriendDisplayName(friendship: FriendshipEntity?, originalNickname: String): String =
        friendship?.remarkName?.trim()?.takeIf { it.isNotBlank() } ?: originalNickname

    private fun buildLevelSummary(userId: Long, profile: UserProfileEntity): LevelSummaryResponse {
        val publishedPostCount = postRepository.countByUserIdAndStatus(userId).toInt()
        val visibleCommentCount = postCommentRepository.countByUserIdAndStatus(userId).toInt()
        val sentMessageCount = messageRepository.countBySenderId(userId).toInt()
        val friendCount = friendshipRepository.countByUserIdAndStatus(userId).toInt()
        val profileCompletionCount = listOf(
            profile.nickname.isNotBlank(),
            !profile.avatarUrl.isNullOrBlank(),
            !profile.schoolCode.isNullOrBlank(),
            !profile.major.isNullOrBlank(),
            !profile.languages.isNullOrBlank(),
            !profile.bio.isNullOrBlank(),
        ).count { it }
        val publishedPosts = postRepository.findAllByUserIdAndStatus(userId)
        val receivedLikeCount = publishedPosts.sumOf { it.likeCount }
        val receivedFavoriteCount = publishedPosts.sumOf { it.favoriteCount }

        val rules = listOf(
            LevelRuleResponse(
                key = "profile_completion",
                label = "资料完善",
                description = "头像、学校、专业、语言、简介等每完善一项增加经验。",
                expPerUnit = 8,
                count = profileCompletionCount,
                earnedExp = profileCompletionCount * 8,
            ),
            LevelRuleResponse(
                key = "posts",
                label = "发布内容",
                description = "每发布一条动态或帖子获得经验。",
                expPerUnit = 18,
                count = publishedPostCount,
                earnedExp = publishedPostCount * 18,
            ),
            LevelRuleResponse(
                key = "comments",
                label = "评论互动",
                description = "每发布一条评论获得经验。",
                expPerUnit = 6,
                count = visibleCommentCount,
                earnedExp = visibleCommentCount * 6,
            ),
            LevelRuleResponse(
                key = "messages",
                label = "聊天活跃",
                description = "每发送一条消息获得少量经验。",
                expPerUnit = 2,
                count = sentMessageCount,
                earnedExp = sentMessageCount * 2,
            ),
            LevelRuleResponse(
                key = "friends",
                label = "好友关系",
                description = "每拥有一位好友获得经验。",
                expPerUnit = 12,
                count = friendCount,
                earnedExp = friendCount * 12,
            ),
            LevelRuleResponse(
                key = "likes_received",
                label = "收获点赞",
                description = "帖子收到点赞时增加经验。",
                expPerUnit = 1,
                count = receivedLikeCount,
                earnedExp = receivedLikeCount,
            ),
            LevelRuleResponse(
                key = "favorites_received",
                label = "收获收藏",
                description = "帖子收到收藏时增加更多经验。",
                expPerUnit = 3,
                count = receivedFavoriteCount,
                earnedExp = receivedFavoriteCount * 3,
            ),
        )

        val totalExperience = rules.sumOf { it.earnedExp }
        val snapshot = calculateLevelSnapshot(totalExperience)

        return LevelSummaryResponse(
            level = snapshot.level,
            experience = totalExperience,
            currentLevelExp = snapshot.currentLevelExp,
            nextLevelExp = snapshot.nextLevelExp,
            expIntoLevel = snapshot.expIntoLevel,
            expNeededForNextLevel = snapshot.expNeededForNextLevel,
            progressPercent = snapshot.progressPercent,
            rules = rules,
        )
    }

    private fun calculateLevelSnapshot(totalExperience: Int): LevelSnapshot {
        var level = 1
        var currentLevelExp = 0
        var currentLevelRange = requiredExpForNextLevel(level)
        var nextLevelExp = currentLevelRange

        while (totalExperience >= nextLevelExp) {
            level += 1
            currentLevelExp = nextLevelExp
            currentLevelRange = requiredExpForNextLevel(level)
            nextLevelExp += currentLevelRange
        }

        val expIntoLevel = totalExperience - currentLevelExp
        val expNeededForNextLevel = nextLevelExp - totalExperience
        val progressPercent = ((expIntoLevel.toDouble() / currentLevelRange.toDouble()) * 100.0)
            .toInt()
            .coerceIn(0, 100)

        return LevelSnapshot(
            level = level,
            currentLevelExp = currentLevelExp,
            nextLevelExp = nextLevelExp,
            expIntoLevel = expIntoLevel,
            expNeededForNextLevel = expNeededForNextLevel,
            progressPercent = progressPercent,
        )
    }

    private fun requiredExpForNextLevel(level: Int): Int = 100 + ((level - 1) * 20)

    private data class LevelSnapshot(
        val level: Int,
        val currentLevelExp: Int,
        val nextLevelExp: Int,
        val expIntoLevel: Int,
        val expNeededForNextLevel: Int,
        val progressPercent: Int,
    )

    private fun resolveUserId(requestedUserId: Long?): Long =
        requestedUserId ?: userRepository.findFirstByOrderByIdAsc()?.id
        ?: throw IllegalArgumentException("当前没有可用用户")

    private fun resolveTargetUserId(request: AddFriendRequest): Long {
        request.targetUserId?.let { return it }
        val uNumber = request.targetUNumber ?: throw IllegalArgumentException("请提供用户编号")
        return userRepository.findByUNumber(uNumber)?.id
            ?: throw IllegalArgumentException("目标用户不存在")
    }

    private fun isBlockedBetween(userId: Long, targetUserId: Long): Boolean =
        blockRecordRepository.existsByUserIdAndTargetUserId(userId, targetUserId) ||
            blockRecordRepository.existsByUserIdAndTargetUserId(targetUserId, userId)

    private fun storeAvatar(userId: Long, file: MultipartFile): String {
        val uploadDir = Paths.get("uploads", "avatars")
        Files.createDirectories(uploadDir)

        val extension = when (file.originalFilename?.substringAfterLast('.', "")?.lowercase()) {
            "jpg", "jpeg", "png", "gif", "webp" -> file.originalFilename!!.substringAfterLast('.')
            else -> "png"
        }
        val filename = "user-${userId}-${UUID.randomUUID()}.$extension"
        val target = uploadDir.resolve(filename)
        file.inputStream.use { input ->
            Files.copy(input, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING)
        }
        return "$publicBaseUrl/uploads/avatars/$filename"
    }
}
