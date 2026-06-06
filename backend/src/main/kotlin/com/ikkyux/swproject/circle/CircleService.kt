package com.ikkyux.swproject.circle

import com.ikkyux.swproject.circle.entity.CircleMemberEntity
import com.ikkyux.swproject.circle.entity.CircleEntity
import com.ikkyux.swproject.circle.repository.CircleMemberRepository
import com.ikkyux.swproject.circle.repository.CircleRepository
import com.ikkyux.swproject.community.entity.PostEntity
import com.ikkyux.swproject.community.PostSummaryResponse
import com.ikkyux.swproject.community.repository.BoardRepository
import com.ikkyux.swproject.community.repository.PostRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

@Service
class CircleService(
    private val circleRepository: CircleRepository,
    private val circleMemberRepository: CircleMemberRepository,
    private val boardRepository: BoardRepository,
    private val postRepository: PostRepository,
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    @Value("\${app.public-base-url:http://localhost:8080}") private val appPublicBaseUrl: String,
) {
    private val objectMapper = jacksonObjectMapper()

    fun getDiscoverCircles(userId: Long): List<CircleSummaryResponse> {
        val joinedIds = circleMemberRepository.findAllByUserId(userId).map { it.circleId }.toSet()
        return circleRepository.findAllByStatusOrderByHotScoreDesc().map { circle ->
            CircleSummaryResponse(
                id = circle.id!!,
                name = circle.nameZh,
                icon = circle.iconEmoji,
                members = circleMemberRepository.countByCircleId(circle.id!!).toInt(),
                posts = countRelatedPosts(circle.nameZh),
                description = circle.description,
                tags = deriveTags(circle.nameZh),
                hot = circle.hotScore >= 80,
                joined = joinedIds.contains(circle.id!!),
            )
        }
    }

    fun getJoinedCircles(userId: Long): List<JoinedCircleResponse> =
        circleMemberRepository.findAllByUserId(userId).mapNotNull { member ->
            val circle = circleRepository.findById(member.circleId).orElse(null) ?: return@mapNotNull null
            JoinedCircleResponse(
                id = circle.id!!,
                name = circle.nameZh,
                icon = circle.iconEmoji,
                members = circleMemberRepository.countByCircleId(circle.id!!).toInt(),
                unread = member.unreadCount,
                lastMessage = "${circle.nameZh} 有新的讨论，快来看看。",
                lastTime = formatTime(member.joinedAt),
                isAdmin = member.isAdmin || circle.ownerUserId == userId,
                isOwner = circle.ownerUserId == userId,
            )
        }

    fun getCircleDetail(userId: Long, circleId: Long): CircleDetailResponse {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        val member = circleMemberRepository.findByCircleIdAndUserId(circleId, userId)
        val isOwner = circle.ownerUserId == userId
        val isAdmin = member?.isAdmin == true || isOwner
        val joined = member != null || isOwner
        return CircleDetailResponse(
            id = circle.id!!,
            name = circle.nameZh,
            icon = circle.iconEmoji,
            members = circleMemberRepository.countByCircleId(circle.id!!).toInt(),
            posts = countRelatedPosts(circle.nameZh),
            description = circle.description,
            tags = deriveTags(circle.nameZh),
            hot = circle.hotScore >= 80,
            joined = joined,
            isAdmin = isAdmin,
            isOwner = isOwner,
            canManageAdmins = isOwner,
            canDeleteCircle = isOwner,
            canManageContent = isAdmin,
            announcement = circle.announcement.ifBlank { buildAnnouncement(circle.nameZh) },
        )
    }

    fun getCircleActivities(circleId: Long): List<CircleActivityResponse> {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        val now = LocalDateTime.now()
        return listOf(
            CircleActivityResponse(
                id = "${circle.id}-notice",
                type = "NOTICE",
                title = "圈子公告已更新",
                content = circle.announcement.ifBlank { buildAnnouncement(circle.nameZh) },
                createdAt = formatTime(now.minusHours(2)),
            ),
            CircleActivityResponse(
                id = "${circle.id}-event",
                type = "EVENT",
                title = "${circle.nameZh} 发起了新的线下活动",
                content = buildActivityMessage(circle.nameZh),
                createdAt = formatTime(now.minusDays(1)),
            ),
            CircleActivityResponse(
                id = "${circle.id}-digest",
                type = "DIGEST",
                title = "本周圈子讨论摘要",
                content = "本周共有 ${circle.postCount} 条相关帖子正在讨论，欢迎参与交流。",
                createdAt = formatTime(now.minusDays(2)),
            ),
        )
    }

    fun getCircleMembers(circleId: Long): List<CircleMemberResponse> {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        return circleMemberRepository.findAllByCircleIdOrderByIsAdminDescJoinedAtAsc(circleId).map { member ->
            val user = userRepository.findById(member.userId).orElse(null)
            val profile = userProfileRepository.findByUserId(member.userId)
            CircleMemberResponse(
                id = member.id!!,
                userId = member.userId,
                nickname = profile?.nickname ?: user?.email?.substringBefore("@") ?: "Unknown",
                school = profile?.schoolCode ?: "未填写学校",
                major = profile?.major ?: "未填写专业",
                bio = profile?.bio ?: "这个同学还没有写自我介绍。",
                avatarUrl = profile?.avatarUrl,
                isAdmin = member.isAdmin || circle.ownerUserId == member.userId,
                isOwner = circle.ownerUserId == member.userId,
                joinedAt = formatTime(member.joinedAt),
            )
        }
    }

    fun getCirclePosts(circleId: Long): List<PostSummaryResponse> {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        val boards = boardRepository.findAll().associateBy { it.id }
        val profiles = userProfileRepository.findAll().associateBy { it.userId }
        val keywords = derivePostKeywords(circle.nameZh)

        val filtered = postRepository.findAllByStatusOrderByCreatedAtDesc().filter { post ->
            val text = listOfNotNull(post.title, post.content, boards[post.boardId]?.nameZh).joinToString(" ")
            keywords.any { keyword -> text.contains(keyword, ignoreCase = true) }
        }.ifEmpty {
            postRepository.findAllByStatusOrderByCreatedAtDesc().take(3)
        }

        return filtered.map { post ->
            PostSummaryResponse(
                id = post.id!!,
                authorUserId = if (post.anonymous) null else post.userId,
                authorName = if (post.anonymous) "匿名用户" else (profiles[post.userId]?.nickname ?: "未知用户"),
                authorAvatarUrl = if (post.anonymous) null else profiles[post.userId]?.avatarUrl,
                boardName = boards[post.boardId]?.nameZh ?: "未分类",
                title = post.title ?: "无标题帖子",
                summary = post.content.take(80),
                imageUrls = decodeImageUrls(post.imageUrlsJson),
                likeCount = post.likeCount,
                commentCount = post.commentCount,
                favoriteCount = post.favoriteCount,
                createdAt = post.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            )
        }
    }

    @Transactional
    fun createCircle(userId: Long, request: CreateCircleRequest): CircleDetailResponse {
        val circle = circleRepository.save(
            CircleEntity(
                nameZh = request.name.trim(),
                iconEmoji = request.icon?.trim()?.takeIf { it.isNotBlank() } ?: "⭐",
                description = request.description.trim(),
                ownerUserId = userId,
                announcement = buildAnnouncement(request.name.trim()),
                memberCount = 1,
                postCount = 0,
                hotScore = 0,
            )
        )
        circleMemberRepository.save(
            CircleMemberEntity(
                circleId = circle.id!!,
                userId = userId,
                unreadCount = 0,
                isAdmin = true,
            )
        )
        return getCircleDetail(userId, circle.id!!)
    }

    @Transactional
    fun updateAnnouncement(userId: Long, circleId: Long, request: UpdateCircleAnnouncementRequest): CircleDetailResponse {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        requireCircleManager(userId, circleId)
        circle.announcement = request.announcement.trim()
        circleRepository.save(circle)
        return getCircleDetail(userId, circleId)
    }

    @Transactional
    fun addAdmin(userId: Long, circleId: Long, request: UpdateCircleAdminRequest): List<CircleMemberResponse> {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        requireCircleOwner(userId, circle)
        val targetMember = circleMemberRepository.findByCircleIdAndUserId(circleId, request.targetUserId)
            ?: throw IllegalArgumentException("目标用户还不是频道成员")
        require(circle.ownerUserId != request.targetUserId) { "频道主已拥有全部管理权限" }
        targetMember.isAdmin = true
        circleMemberRepository.save(targetMember)
        return getCircleMembers(circleId)
    }

    @Transactional
    fun removeAdmin(userId: Long, circleId: Long, targetUserId: Long): List<CircleMemberResponse> {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        requireCircleOwner(userId, circle)
        require(circle.ownerUserId != targetUserId) { "不能移除频道主的管理身份" }
        val targetMember = circleMemberRepository.findByCircleIdAndUserId(circleId, targetUserId)
            ?: throw IllegalArgumentException("目标用户不在该频道中")
        targetMember.isAdmin = false
        circleMemberRepository.save(targetMember)
        return getCircleMembers(circleId)
    }

    @Transactional
    fun uploadCircleIcon(userId: Long, file: MultipartFile): Map<String, String> {
        require(!file.isEmpty) { "头像文件不能为空" }
        require(file.contentType?.startsWith("image/") == true) { "请上传图片文件" }
        return mapOf("iconUrl" to storeCircleIcon(userId, file))
    }

    @Transactional
    fun joinCircle(userId: Long, circleId: Long): Map<String, Any> {
        if (circleMemberRepository.findByCircleIdAndUserId(circleId, userId) == null) {
            circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
            circleMemberRepository.save(
                CircleMemberEntity(
                    circleId = circleId,
                    userId = userId,
                    unreadCount = 0,
                    isAdmin = false,
                )
            )
        }
        return mapOf("circleId" to circleId, "status" to "JOINED")
    }

    @Transactional
    fun leaveCircle(userId: Long, circleId: Long): Map<String, Any> {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        require(circle.ownerUserId != userId) { "频道主不能直接退出频道，请先删除频道或转交管理" }
        val member = circleMemberRepository.findByCircleIdAndUserId(circleId, userId)
            ?: return mapOf("circleId" to circleId, "status" to "NOT_JOINED")
        circleMemberRepository.delete(member)
        return mapOf("circleId" to circleId, "status" to "LEFT")
    }

    @Transactional
    fun deleteCirclePost(userId: Long, circleId: Long, postId: Long): Map<String, Any> {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        requireCircleManager(userId, circle.id!!)
        val post = postRepository.findById(postId).orElseThrow { IllegalArgumentException("帖子不存在") }
        require(post.status == "PUBLISHED") { "帖子已删除" }
        require(belongsToCircle(circle, post)) { "该帖子不属于当前频道" }
        post.status = "DELETED"
        postRepository.save(post)
        return mapOf("circleId" to circleId, "postId" to postId, "status" to "DELETED")
    }

    @Transactional
    fun deleteCircle(userId: Long, circleId: Long): Map<String, Any> {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        requireCircleOwner(userId, circle)
        circleMemberRepository.deleteAllByCircleId(circleId)
        circle.status = "DELETED"
        circleRepository.save(circle)
        return mapOf("circleId" to circleId, "status" to "DELETED")
    }

    private fun deriveTags(name: String): List<String> =
        when {
            name.contains("大学") -> listOf("学习", "生活", "交友")
            name.contains("美食") -> listOf("美食", "探店", "分享")
            name.contains("打工") -> listOf("打工", "兼职", "求职")
            else -> listOf("交流", "兴趣")
        }

    private fun buildAnnouncement(name: String): String =
        when {
            name.contains("大学") -> "欢迎新成员入圈，发言前请先阅读校园生活与签证经验置顶帖。"
            name.contains("美食") -> "欢迎分享近期探店体验，广告与代购内容会被移除。"
            name.contains("打工") -> "请在发布岗位前确认时薪、地点与签证要求，避免无效信息。"
            else -> "欢迎加入圈子，请文明交流并尽量提供真实有用的信息。"
        }

    private fun buildActivityMessage(name: String): String =
        when {
            name.contains("美食") -> "本周六晚 7 点一起去延南洞新店探店，感兴趣的同学可以在群内接龙。"
            name.contains("大学") -> "本周将组织新生选课和宿舍申请经验分享，欢迎提前整理问题。"
            name.contains("打工") -> "更新了最新兼职情报汇总，建议优先查看时薪和通勤距离。"
            else -> "圈子管理员正在征集下一次活动主题，欢迎在讨论区留言。"
        }

    private fun derivePostKeywords(name: String): List<String> =
        when {
            name.contains("美食") -> listOf("美食", "探店", "部队锅", "延南洞", "聚餐")
            name.contains("大学") -> listOf("新生", "学校", "选课", "校园", "留学生")
            name.contains("打工") -> listOf("兼职", "打工", "时薪", "面试", "便利店")
            else -> listOf("交友", "周末", "活动", "弘大")
        }

    private fun belongsToCircle(circle: CircleEntity, post: PostEntity): Boolean {
        val boards = boardRepository.findAll().associateBy { it.id }
        val text = listOfNotNull(post.title, post.content, boards[post.boardId]?.nameZh).joinToString(" ")
        return derivePostKeywords(circle.nameZh).any { keyword -> text.contains(keyword, ignoreCase = true) }
    }

    private fun requireCircleManager(userId: Long, circleId: Long) {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        if (circle.ownerUserId == userId) {
            return
        }
        val member = circleMemberRepository.findByCircleIdAndUserId(circleId, userId)
            ?: throw IllegalArgumentException("你不是该频道成员")
        require(member.isAdmin) { "仅频道管理员可执行此操作" }
    }

    private fun requireCircleOwner(userId: Long, circle: CircleEntity) {
        require(circle.ownerUserId == userId) { "仅频道主可执行此操作" }
    }

    private fun formatTime(value: LocalDateTime): String =
        value.format(DateTimeFormatter.ofPattern("MM-dd HH:mm"))

    private fun decodeImageUrls(imageUrlsJson: String?): List<String> =
        if (imageUrlsJson.isNullOrBlank()) emptyList() else objectMapper.readValue(imageUrlsJson)

    private fun countRelatedPosts(circleName: String): Int {
        val boards = boardRepository.findAll().associateBy { it.id }
        val keywords = derivePostKeywords(circleName)
        return postRepository.findAllByStatusOrderByCreatedAtDesc().count { post ->
            val text = listOfNotNull(post.title, post.content, boards[post.boardId]?.nameZh).joinToString(" ")
            keywords.any { keyword -> text.contains(keyword, ignoreCase = true) }
        }
    }

    private fun storeCircleIcon(userId: Long, file: MultipartFile): String {
        val uploadDir = Paths.get("uploads", "circles")
        Files.createDirectories(uploadDir)

        val extension = when (file.originalFilename?.substringAfterLast('.', "")?.lowercase()) {
            "jpg", "jpeg", "png", "gif", "webp" -> file.originalFilename!!.substringAfterLast('.')
            else -> "png"
        }
        val filename = "circle-${userId}-${UUID.randomUUID()}.$extension"
        val target = uploadDir.resolve(filename)
        file.inputStream.use { input ->
            Files.copy(input, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING)
        }
        return "$appPublicBaseUrl/uploads/circles/$filename"
    }
}
