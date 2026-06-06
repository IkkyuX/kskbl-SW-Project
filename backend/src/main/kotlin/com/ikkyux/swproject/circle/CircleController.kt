package com.ikkyux.swproject.circle

import com.ikkyux.swproject.common.ApiResponse
import com.ikkyux.swproject.community.PostSummaryResponse
import com.ikkyux.swproject.common.CurrentUserResolver
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/v1/circles")
class CircleController(
    private val circleService: CircleService,
    private val currentUserResolver: CurrentUserResolver,
) {

    @GetMapping
    fun discover(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<List<CircleSummaryResponse>> =
        ApiResponse.success(circleService.getDiscoverCircles(currentUserResolver.resolve(headerUserId, requestUserId)!!))

    @PostMapping
    fun create(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @Valid @RequestBody request: CreateCircleRequest,
    ): ApiResponse<CircleDetailResponse> =
        ApiResponse.success(circleService.createCircle(currentUserResolver.resolve(headerUserId, requestUserId)!!, request))

    @PostMapping("/icon")
    fun uploadIcon(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestParam("file") file: MultipartFile,
    ): ApiResponse<Map<String, String>> =
        ApiResponse.success(circleService.uploadCircleIcon(currentUserResolver.resolve(headerUserId, requestUserId)!!, file))

    @GetMapping("/joined")
    fun joined(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<List<JoinedCircleResponse>> =
        ApiResponse.success(circleService.getJoinedCircles(currentUserResolver.resolve(headerUserId, requestUserId)!!))

    @GetMapping("/{id}")
    fun detail(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
    ): ApiResponse<CircleDetailResponse> =
        ApiResponse.success(circleService.getCircleDetail(currentUserResolver.resolve(headerUserId, requestUserId)!!, id))

    @GetMapping("/{id}/activities")
    fun activities(@PathVariable id: Long): ApiResponse<List<CircleActivityResponse>> =
        ApiResponse.success(circleService.getCircleActivities(id))

    @GetMapping("/{id}/members")
    fun members(@PathVariable id: Long): ApiResponse<List<CircleMemberResponse>> =
        ApiResponse.success(circleService.getCircleMembers(id))

    @GetMapping("/{id}/posts")
    fun posts(@PathVariable id: Long): ApiResponse<List<PostSummaryResponse>> =
        ApiResponse.success(circleService.getCirclePosts(id))

    @PatchMapping("/{id}/announcement")
    fun updateAnnouncement(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateCircleAnnouncementRequest,
    ): ApiResponse<CircleDetailResponse> =
        ApiResponse.success(
            circleService.updateAnnouncement(
                currentUserResolver.resolve(headerUserId, requestUserId)!!,
                id,
                request,
            )
        )

    @PostMapping("/{id}/admins")
    fun addAdmin(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateCircleAdminRequest,
    ): ApiResponse<List<CircleMemberResponse>> =
        ApiResponse.success(
            circleService.addAdmin(
                currentUserResolver.resolve(headerUserId, requestUserId)!!,
                id,
                request,
            )
        )

    @DeleteMapping("/{id}/admins/{targetUserId}")
    fun removeAdmin(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
        @PathVariable targetUserId: Long,
    ): ApiResponse<List<CircleMemberResponse>> =
        ApiResponse.success(
            circleService.removeAdmin(
                currentUserResolver.resolve(headerUserId, requestUserId)!!,
                id,
                targetUserId,
            )
        )

    @DeleteMapping("/{id}/posts/{postId}")
    fun deleteCirclePost(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
        @PathVariable postId: Long,
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.success(
            circleService.deleteCirclePost(
                currentUserResolver.resolve(headerUserId, requestUserId)!!,
                id,
                postId,
            )
        )

    @PostMapping("/{id}/join")
    fun join(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.success(circleService.joinCircle(currentUserResolver.resolve(headerUserId, requestUserId)!!, id))

    @PostMapping("/{id}/leave")
    fun leave(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.success(circleService.leaveCircle(currentUserResolver.resolve(headerUserId, requestUserId)!!, id))

    @DeleteMapping("/{id}")
    fun deleteCircle(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.success(circleService.deleteCircle(currentUserResolver.resolve(headerUserId, requestUserId)!!, id))
}
