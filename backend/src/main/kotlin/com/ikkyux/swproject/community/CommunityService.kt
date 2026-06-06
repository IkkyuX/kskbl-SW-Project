package com.ikkyux.swproject.community

import com.ikkyux.swproject.community.entity.PostEntity
import com.ikkyux.swproject.community.entity.PostCommentEntity
import com.ikkyux.swproject.community.repository.BoardRepository
import com.ikkyux.swproject.community.repository.PostCommentRepository
import com.ikkyux.swproject.community.repository.PostRepository
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import com.ikkyux.swproject.user.repository.FriendshipRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.format.DateTimeFormatter

@Service
class CommunityService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val boardRepository: BoardRepository,
    private val postRepository: PostRepository,
    private val postCommentRepository: PostCommentRepository,
    private val friendshipRepository: FriendshipRepository,
) {
    private val objectMapper = jacksonObjectMapper()

    fun getPosts(): List<PostSummaryResponse> {
        val boards = boardRepository.findAll().associateBy { it.id }
        val profiles = userProfileRepository.findAll().associateBy { it.userId }
        return postRepository.findAllByStatusOrderByCreatedAtDesc().map { post -> buildPostSummary(post, boards, profiles) }
    }

    fun getBoards(): List<BoardSummaryResponse> =
        boardRepository.findByStatusOrderBySortOrderAsc().map {
            BoardSummaryResponse(
                id = it.id!!,
                nameZh = it.nameZh,
                nameKo = it.nameKo,
                nameEn = it.nameEn,
                sortOrder = it.sortOrder,
            )
        }

    fun getThemePosts(theme: String): List<PostSummaryResponse> {
        val boards = boardRepository.findAll().associateBy { it.id }
        val profiles = userProfileRepository.findAll().associateBy { it.userId }
        val keywords = themeKeywords(theme)
        val filtered = postRepository.findAllByStatusOrderByCreatedAtDesc().filter { post ->
            val searchable = listOfNotNull(post.title, post.content, boards[post.boardId]?.nameZh).joinToString(" ")
            keywords.any { keyword -> searchable.contains(keyword, ignoreCase = true) }
        }
        return filtered.map { post -> buildPostSummary(post, boards, profiles) }
    }

    fun getMomentPosts(userId: Long): List<PostSummaryResponse> {
        val friendIds = getDirectFriendUserIds(userId)
        val visibleUserIds = friendIds + userId
        val boards = boardRepository.findAll().associateBy { it.id }
        val profiles = userProfileRepository.findAll().associateBy { it.userId }
        return postRepository.findAllByStatusOrderByCreatedAtDesc()
            .filter { post -> !post.anonymous && visibleUserIds.contains(post.userId) }
            .map { post -> buildPostSummary(post, boards, profiles) }
    }

    @Transactional
    fun createPost(userId: Long, request: CreatePostRequest): PostSummaryResponse =
        createPostForUser(
            userId = userId,
            boardId = request.boardId,
            title = request.title,
            content = request.content,
            imageUrls = request.imageUrls,
            anonymous = request.anonymous,
        )

    @Transactional
    fun createMomentPost(userId: Long, request: CreateMomentPostRequest): PostSummaryResponse {
        val boardId = boardRepository.findByStatusOrderBySortOrderAsc().firstOrNull()?.id
            ?: throw IllegalArgumentException("默认板块不存在")
        return createPostForUser(
            userId = userId,
            boardId = boardId,
            title = request.title,
            content = request.content,
            imageUrls = request.imageUrls,
            anonymous = false,
        )
    }

    fun getPostDetail(id: Long): PostDetailResponse {
        val post = postRepository.findById(id)
            .orElseThrow { IllegalArgumentException("帖子不存在") }
        val board = boardRepository.findById(post.boardId).orElseThrow { IllegalArgumentException("板块不存在") }
        val author = userProfileRepository.findByUserId(post.userId)
        val comments = postCommentRepository.findAllByPostIdAndStatusOrderByCreatedAtAsc(id).map { comment ->
            val commentAuthor = userProfileRepository.findByUserId(comment.userId)
            PostCommentResponse(
                id = comment.id!!,
                authorName = commentAuthor?.nickname ?: "未知用户",
                authorAvatarUrl = commentAuthor?.avatarUrl,
                content = comment.content,
                createdAt = comment.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            )
        }

        return PostDetailResponse(
            id = post.id!!,
            authorUserId = if (post.anonymous) null else post.userId,
            authorName = if (post.anonymous) "匿名用户" else (author?.nickname ?: "未知用户"),
            authorAvatarUrl = if (post.anonymous) null else author?.avatarUrl,
            boardName = board.nameZh,
            title = post.title ?: "无标题帖子",
            content = post.content,
            imageUrls = decodeImageUrls(post.imageUrlsJson),
            anonymous = post.anonymous,
            likeCount = post.likeCount,
            commentCount = post.commentCount,
            favoriteCount = post.favoriteCount,
            createdAt = post.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            comments = comments
        )
    }

    @Transactional
    fun updatePostLike(postId: Long, request: UpdatePostLikeRequest): PostReactionResponse {
        val post = postRepository.findById(postId)
            .orElseThrow { IllegalArgumentException("帖子不存在") }

        post.likeCount = if (request.liked) {
            post.likeCount + 1
        } else {
            maxOf(0, post.likeCount - 1)
        }
        val saved = postRepository.save(post)

        return PostReactionResponse(
            postId = saved.id!!,
            liked = request.liked,
            likeCount = saved.likeCount,
            commentCount = saved.commentCount,
            favoriteCount = saved.favoriteCount,
        )
    }

    @Transactional
    fun updatePostFavorite(postId: Long, request: UpdatePostFavoriteRequest): PostReactionResponse {
        val post = postRepository.findById(postId)
            .orElseThrow { IllegalArgumentException("帖子不存在") }

        post.favoriteCount = if (request.favorited) {
            post.favoriteCount + 1
        } else {
            maxOf(0, post.favoriteCount - 1)
        }
        val saved = postRepository.save(post)

        return PostReactionResponse(
            postId = saved.id!!,
            liked = request.favorited,
            likeCount = saved.likeCount,
            commentCount = saved.commentCount,
            favoriteCount = saved.favoriteCount,
        )
    }

    @Transactional
    fun createComment(userId: Long, postId: Long, request: CreateCommentRequest): PostCommentResponse {
        val post = postRepository.findById(postId)
            .orElseThrow { IllegalArgumentException("帖子不存在") }
        val profile = userProfileRepository.findByUserId(userId)
            ?: throw IllegalArgumentException("用户资料不存在")

        val saved = postCommentRepository.save(
            PostCommentEntity(
                postId = postId,
                userId = userId,
                content = request.content
            )
        )
        post.commentCount += 1
        postRepository.save(post)

        return PostCommentResponse(
            id = saved.id!!,
            authorName = profile.nickname,
            authorAvatarUrl = profile.avatarUrl,
            content = saved.content,
            createdAt = saved.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
    }

    private fun createPostForUser(
        userId: Long,
        boardId: Long,
        title: String?,
        content: String,
        imageUrls: List<String>,
        anonymous: Boolean,
    ): PostSummaryResponse {
        userRepository.findById(userId).orElseThrow { IllegalArgumentException("用户不存在") }
        val board = boardRepository.findById(boardId)
            .orElseThrow { IllegalArgumentException("板块不存在") }
        val profile = userProfileRepository.findByUserId(userId)
            ?: throw IllegalArgumentException("用户资料不存在")

        val saved = postRepository.save(
            PostEntity(
                userId = userId,
                boardId = board.id!!,
                title = title,
                content = content,
                imageUrlsJson = encodeImageUrls(imageUrls),
                anonymous = anonymous,
            )
        )

        return PostSummaryResponse(
            id = saved.id!!,
            authorUserId = if (saved.anonymous) null else userId,
            authorName = if (saved.anonymous) "匿名用户" else profile.nickname,
            authorAvatarUrl = if (saved.anonymous) null else profile.avatarUrl,
            boardName = board.nameZh,
            title = saved.title ?: "",
            summary = saved.content,
            imageUrls = decodeImageUrls(saved.imageUrlsJson),
            likeCount = saved.likeCount,
            commentCount = saved.commentCount,
            favoriteCount = saved.favoriteCount,
            createdAt = saved.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
    }

    private fun getDirectFriendUserIds(userId: Long): Set<Long> =
        friendshipRepository.findAllByUserIdAndStatusOrderByCreatedAtDesc(userId)
            .map { it.friendUserId }
            .toSet()

    private fun buildPostSummary(
        post: PostEntity,
        boards: Map<Long?, com.ikkyux.swproject.community.entity.BoardEntity>,
        profiles: Map<Long?, com.ikkyux.swproject.user.entity.UserProfileEntity>,
    ): PostSummaryResponse =
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
            createdAt = post.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )

    private fun themeKeywords(theme: String): List<String> =
        when (theme.lowercase()) {
            "job", "parttime" -> listOf("兼职", "打工", "时薪", "面试", "咖啡店", "便利店")
            "secondhand", "market" -> listOf("二手", "转让", "出", "出售", "交易", "课本")
            "warning", "alert" -> listOf("避雷", "不动产", "骗子", "注意", "坑", "黑心")
            else -> emptyList()
        }

    private fun encodeImageUrls(imageUrls: List<String>): String? =
        imageUrls.takeIf { it.isNotEmpty() }?.let { objectMapper.writeValueAsString(it) }

    private fun decodeImageUrls(imageUrlsJson: String?): List<String> =
        if (imageUrlsJson.isNullOrBlank()) emptyList() else objectMapper.readValue(imageUrlsJson)
}
