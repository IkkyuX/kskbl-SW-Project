package com.ikkyux.swproject.circle

import com.ikkyux.swproject.common.ApiResponse
import com.ikkyux.swproject.community.PostSummaryResponse
import com.ikkyux.swproject.common.CurrentUserResolver
import org.springframework.web.bind.annotation.*

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
}
