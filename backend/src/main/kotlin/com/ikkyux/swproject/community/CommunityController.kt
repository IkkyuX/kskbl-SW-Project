package com.ikkyux.swproject.community

import com.ikkyux.swproject.common.ApiResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/posts")
class CommunityController(
    private val communityService: CommunityService
) {

    @GetMapping
    fun getPosts(): ApiResponse<List<PostSummaryResponse>> =
        ApiResponse.success(communityService.getPosts())

    @GetMapping("/discover/{theme}")
    fun getThemePosts(@PathVariable theme: String): ApiResponse<List<PostSummaryResponse>> =
        ApiResponse.success(communityService.getThemePosts(theme))

    @GetMapping("/{id}")
    fun getPostDetail(@PathVariable id: Long): ApiResponse<PostDetailResponse> =
        ApiResponse.success(communityService.getPostDetail(id))

    @PostMapping
    fun createPost(@RequestBody request: CreatePostRequest): ApiResponse<PostSummaryResponse> =
        ApiResponse.success(communityService.createPost(request))

    @PostMapping("/{id}/like")
    fun updatePostLike(
        @PathVariable id: Long,
        @RequestBody request: UpdatePostLikeRequest,
    ): ApiResponse<PostReactionResponse> = ApiResponse.success(communityService.updatePostLike(id, request))

    @PostMapping("/{id}/favorite")
    fun updatePostFavorite(
        @PathVariable id: Long,
        @RequestBody request: UpdatePostFavoriteRequest,
    ): ApiResponse<PostReactionResponse> = ApiResponse.success(communityService.updatePostFavorite(id, request))

    @PostMapping("/{id}/comments")
    fun createComment(
        @PathVariable id: Long,
        @RequestBody request: CreateCommentRequest,
    ): ApiResponse<PostCommentResponse> = ApiResponse.success(communityService.createComment(id, request))
}
