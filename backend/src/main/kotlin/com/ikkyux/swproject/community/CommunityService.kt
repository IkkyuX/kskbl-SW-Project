package com.ikkyux.swproject.community

import com.ikkyux.swproject.community.entity.PostEntity
import com.ikkyux.swproject.community.entity.PostCommentEntity
import com.ikkyux.swproject.community.repository.BoardRepository
import com.ikkyux.swproject.community.repository.PostCommentRepository
import com.ikkyux.swproject.community.repository.PostRepository
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
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
) {
    private val objectMapper = jacksonObjectMapper()

    fun getPosts(): List<PostSummaryResponse> {
        val boards = boardRepository.findAll().associateBy { it.id }
        val profiles = userProfileRepository.findAll().associateBy { it.userId }
        return postRepository.findAllByStatusOrderByCreatedAtDesc().map { post -> buildPostSummary(post, boards, profiles) }
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

    @Transactional
    fun createPost(request: CreatePostRequest): PostSummaryResponse {
        val userId = userRepository.findFirstByOrderByIdAsc()?.id
            ?: throw IllegalArgumentException("当前没有可用用户")
        val board = boardRepository.findById(request.boardId)
            .orElseThrow { IllegalArgumentException("板块不存在") }
        val profile = userProfileRepository.findByUserId(userId)
            ?: throw IllegalArgumentException("用户资料不存在") 

        val saved = postRepository.save(
            PostEntity(
                userId = userId,
                boardId = board.id!!,
                title = request.title,
                content = request.content,
                imageUrlsJson = encodeImageUrls(request.imageUrls),
                anonymous = request.anonymous
            )
        )

        return PostSummaryResponse(
            id = saved.id!!,
            authorName = if (saved.anonymous) "匿名用户" else profile.nickname,
            boardName = board.nameZh,
            title = saved.title ?: "无标题帖子",
            summary = saved.content.take(80),
            imageUrls = decodeImageUrls(saved.imageUrlsJson),
            likeCount = saved.likeCount,
            commentCount = saved.commentCount,
            favoriteCount = saved.favoriteCount,
            createdAt = saved.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
    }

    fun getPostDetail(id: Long): PostDetailResponse {
        val post = postRepository.findById(id)
            .orElseThrow { IllegalArgumentException("帖子不存在") }
        val board = boardRepository.findById(post.boardId).orElseThrow { IllegalArgumentException("板块不存在") }
        val author = userProfileRepository.findByUserId(post.userId)
        val comments = postCommentRepository.findAllByPostIdAndStatusOrderByCreatedAtAsc(id).map { comment ->
            PostCommentResponse(
                id = comment.id!!,
                authorName = userProfileRepository.findByUserId(comment.userId)?.nickname ?: "未知用户",
                content = comment.content,
                createdAt = comment.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            )
        }

        return PostDetailResponse(
            id = post.id!!,
            authorName = if (post.anonymous) "匿名用户" else (author?.nickname ?: "未知用户"),
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
    fun createComment(postId: Long, request: CreateCommentRequest): PostCommentResponse {
        val post = postRepository.findById(postId)
            .orElseThrow { IllegalArgumentException("帖子不存在") }
        val userId = userRepository.findFirstByOrderByIdAsc()?.id
            ?: throw IllegalArgumentException("当前没有可用用户")
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
            content = saved.content,
            createdAt = saved.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
    }

    private fun buildPostSummary(
        post: PostEntity,
        boards: Map<Long?, com.ikkyux.swproject.community.entity.BoardEntity>,
        profiles: Map<Long?, com.ikkyux.swproject.user.entity.UserProfileEntity>,
    ): PostSummaryResponse =
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
