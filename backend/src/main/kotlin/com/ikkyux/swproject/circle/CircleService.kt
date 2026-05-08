package com.ikkyux.swproject.circle

import com.ikkyux.swproject.circle.entity.CircleMemberEntity
import com.ikkyux.swproject.circle.repository.CircleMemberRepository
import com.ikkyux.swproject.circle.repository.CircleRepository
import com.ikkyux.swproject.community.PostSummaryResponse
import com.ikkyux.swproject.community.repository.BoardRepository
import com.ikkyux.swproject.community.repository.PostRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class CircleService(
    private val circleRepository: CircleRepository,
    private val circleMemberRepository: CircleMemberRepository,
    private val boardRepository: BoardRepository,
    private val postRepository: PostRepository,
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
) {
    private val objectMapper = jacksonObjectMapper()

    fun getDiscoverCircles(userId: Long): List<CircleSummaryResponse> {
        val joinedIds = circleMemberRepository.findAllByUserId(userId).map { it.circleId }.toSet()
        return circleRepository.findAllByStatusOrderByHotScoreDesc().map { circle ->
            CircleSummaryResponse(
                id = circle.id!!,
                name = circle.nameZh,
                icon = circle.iconEmoji,
                members = circle.memberCount,
                posts = circle.postCount,
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
                members = circle.memberCount,
                unread = member.unreadCount,
                lastMessage = "${circle.nameZh} 有新的讨论，快来看看。",
                lastTime = formatTime(member.joinedAt),
                isAdmin = member.isAdmin,
            )
        }

    fun getCircleDetail(userId: Long, circleId: Long): CircleDetailResponse {
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        val member = circleMemberRepository.findByCircleIdAndUserId(circleId, userId)
        return CircleDetailResponse(
            id = circle.id!!,
            name = circle.nameZh,
            icon = circle.iconEmoji,
            members = circle.memberCount,
            posts = circle.postCount,
            description = circle.description,
            tags = deriveTags(circle.nameZh),
            hot = circle.hotScore >= 80,
            joined = member != null,
            isAdmin = member?.isAdmin ?: false,
            announcement = buildAnnouncement(circle.nameZh),
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
                content = buildAnnouncement(circle.nameZh),
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
        circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
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
                isAdmin = member.isAdmin,
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
                authorName = if (post.anonymous) "匿名用户" else (profiles[post.userId]?.nickname ?: "未知用户"),
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
    fun joinCircle(userId: Long, circleId: Long): Map<String, Any> {
        if (circleMemberRepository.findByCircleIdAndUserId(circleId, userId) == null) {
            val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
            circleMemberRepository.save(
                CircleMemberEntity(
                    circleId = circleId,
                    userId = userId,
                    unreadCount = 0,
                    isAdmin = false,
                )
            )
            circle.memberCount += 1
            circleRepository.save(circle)
        }
        return mapOf("circleId" to circleId, "status" to "JOINED")
    }

    @Transactional
    fun leaveCircle(userId: Long, circleId: Long): Map<String, Any> {
        val member = circleMemberRepository.findByCircleIdAndUserId(circleId, userId)
            ?: return mapOf("circleId" to circleId, "status" to "NOT_JOINED")
        circleMemberRepository.delete(member)
        val circle = circleRepository.findById(circleId).orElseThrow { IllegalArgumentException("圈子不存在") }
        if (circle.memberCount > 0) {
            circle.memberCount -= 1
        }
        circleRepository.save(circle)
        return mapOf("circleId" to circleId, "status" to "LEFT")
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

    private fun formatTime(value: LocalDateTime): String =
        value.format(DateTimeFormatter.ofPattern("MM-dd HH:mm"))

    private fun decodeImageUrls(imageUrlsJson: String?): List<String> =
        if (imageUrlsJson.isNullOrBlank()) emptyList() else objectMapper.readValue(imageUrlsJson)
}
