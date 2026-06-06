package com.ikkyux.swproject.community

import com.ikkyux.swproject.common.ApiResponse
import com.ikkyux.swproject.common.CurrentUserResolver
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/posts")
class CommunityController(
    private val communityService: CommunityService,
    private val currentUserResolver: CurrentUserResolver,
) {

    @GetMapping
    fun getPosts(): ApiResponse<List<PostSummaryResponse>> =
        ApiResponse.success(communityService.getPosts())

    @GetMapping("/boards")
    fun getBoards(): ApiResponse<List<BoardSummaryResponse>> =
        ApiResponse.success(communityService.getBoards())

    @GetMapping("/discover/{theme}")
    fun getThemePosts(@PathVariable theme: String): ApiResponse<List<PostSummaryResponse>> =
        ApiResponse.success(communityService.getThemePosts(theme))

    @GetMapping("/moments")
    fun getMomentPosts(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<List<PostSummaryResponse>> =
        ApiResponse.success(communityService.getMomentPosts(resolveCurrentUserId(headerUserId, requestUserId)))

    @GetMapping("/{id:\\d+}")
    fun getPostDetail(@PathVariable id: Long): ApiResponse<PostDetailResponse> =
        ApiResponse.success(communityService.getPostDetail(id))

    @PostMapping
    fun createPost(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: CreatePostRequest,
    ): ApiResponse<PostSummaryResponse> =
        ApiResponse.success(communityService.createPost(resolveCurrentUserId(headerUserId, requestUserId), request))

    @PostMapping("/moments")
    fun createMomentPost(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: CreateMomentPostRequest,
    ): ApiResponse<PostSummaryResponse> =
        ApiResponse.success(communityService.createMomentPost(resolveCurrentUserId(headerUserId, requestUserId), request))

    @PostMapping("/{id:\\d+}/like")
    fun updatePostLike(
        @PathVariable id: Long,
        @RequestBody request: UpdatePostLikeRequest,
    ): ApiResponse<PostReactionResponse> = ApiResponse.success(communityService.updatePostLike(id, request))

    @PostMapping("/{id:\\d+}/favorite")
    fun updatePostFavorite(
        @PathVariable id: Long,
        @RequestBody request: UpdatePostFavoriteRequest,
    ): ApiResponse<PostReactionResponse> = ApiResponse.success(communityService.updatePostFavorite(id, request))

    @PostMapping("/{id:\\d+}/comments")
    fun createComment(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
        @RequestBody request: CreateCommentRequest,
    ): ApiResponse<PostCommentResponse> =
        ApiResponse.success(communityService.createComment(resolveCurrentUserId(headerUserId, requestUserId), id, request))

    private fun resolveCurrentUserId(headerUserId: Long?, requestUserId: Long?): Long =
        currentUserResolver.resolve(headerUserId, requestUserId) ?: throw IllegalArgumentException("请先登录")
}
