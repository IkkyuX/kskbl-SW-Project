package com.ikkyux.swproject.user

import com.ikkyux.swproject.common.ApiResponse
import com.ikkyux.swproject.common.CurrentUserResolver
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val userService: UserService,
    private val currentUserResolver: CurrentUserResolver,
) {

    @GetMapping("/profile")
    fun getProfile(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<UserProfileResponse> =
        ApiResponse.success(userService.getProfile(currentUserResolver.resolve(headerUserId, requestUserId)))

    @GetMapping("/level-summary")
    fun getLevelSummary(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<LevelSummaryResponse> =
        ApiResponse.success(userService.getLevelSummary(currentUserResolver.resolve(headerUserId, requestUserId)))

    @PutMapping("/profile")
    fun updateProfile(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: UpdateProfileRequest
    ): ApiResponse<UserProfileResponse> =
        ApiResponse.success(userService.updateProfile(currentUserResolver.resolve(headerUserId, requestUserId), request))

    @PutMapping("/profile/avatar")
    fun updateAvatar(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestParam("file") file: MultipartFile,
    ): ApiResponse<UserProfileResponse> =
        ApiResponse.success(userService.updateAvatar(currentUserResolver.resolve(headerUserId, requestUserId), file))

    @GetMapping("/tags")
    fun getAvailableTags(): ApiResponse<Map<String, List<String>>> =
        ApiResponse.success(userService.getTags())

    @GetMapping("/tag-options")
    fun getTagOptions(): ApiResponse<TagCatalogResponse> =
        ApiResponse.success(userService.getTagCatalog())

    @GetMapping("/public")
    fun publicUsers(): ApiResponse<List<PublicUserSummaryResponse>> =
        ApiResponse.success(userService.getPublicUsers())

    @GetMapping("/public/{userId}")
    fun publicUser(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @org.springframework.web.bind.annotation.PathVariable userId: Long,
    ): ApiResponse<PublicUserSummaryResponse> =
        ApiResponse.success(userService.getPublicUser(currentUserResolver.resolve(headerUserId, requestUserId), userId))

    @GetMapping("/lookup")
    fun lookupByUNumber(
        @RequestParam("uNumber") uNumber: Long,
    ): ApiResponse<UNumberLookupResponse> =
        ApiResponse.success(userService.findByUNumber(uNumber))

    @GetMapping("/friends")
    fun friends(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<List<FriendResponse>> =
        ApiResponse.success(userService.getFriends(currentUserResolver.resolve(headerUserId, requestUserId)))

    @PostMapping("/friends")
    fun addFriend(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: AddFriendRequest,
    ): ApiResponse<FriendRequestResponse> =
        ApiResponse.success(userService.requestFriend(currentUserResolver.resolve(headerUserId, requestUserId), request))

    @GetMapping("/friend-requests")
    fun friendRequests(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<List<FriendRequestResponse>> =
        ApiResponse.success(userService.getFriendRequests(currentUserResolver.resolve(headerUserId, requestUserId)))

    @PostMapping("/friend-requests")
    fun requestFriend(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: AddFriendRequest,
    ): ApiResponse<FriendRequestResponse> =
        ApiResponse.success(userService.requestFriend(currentUserResolver.resolve(headerUserId, requestUserId), request))

    @PostMapping("/friend-requests/{id}/accept")
    fun acceptFriendRequest(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @org.springframework.web.bind.annotation.PathVariable id: Long,
    ): ApiResponse<FriendRequestResponse> =
        ApiResponse.success(userService.acceptFriendRequest(currentUserResolver.resolve(headerUserId, requestUserId), id))

    @PostMapping("/friend-requests/{id}/reject")
    fun rejectFriendRequest(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @org.springframework.web.bind.annotation.PathVariable id: Long,
    ): ApiResponse<FriendRequestResponse> =
        ApiResponse.success(userService.rejectFriendRequest(currentUserResolver.resolve(headerUserId, requestUserId), id))

    @PutMapping("/tags")
    fun updateTags(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: UpdateTagsRequest
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.success(userService.updateTags(currentUserResolver.resolve(headerUserId, requestUserId), request))

    @GetMapping("/blocks")
    fun blockedUsers(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<List<BlockResponse>> =
        ApiResponse.success(userService.getBlockedUsers(currentUserResolver.resolve(headerUserId, requestUserId)))

    @PostMapping("/blocks")
    fun blockUser(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: BlockUserRequest,
    ): ApiResponse<BlockResponse> =
        ApiResponse.success(userService.blockUser(currentUserResolver.resolve(headerUserId, requestUserId), request))

    @DeleteMapping("/blocks/{targetUserId}")
    fun unblockUser(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @org.springframework.web.bind.annotation.PathVariable targetUserId: Long,
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.success(userService.unblockUser(currentUserResolver.resolve(headerUserId, requestUserId), targetUserId))

    @PutMapping("/friends/{friendUserId}/remark")
    fun updateFriendRemark(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @org.springframework.web.bind.annotation.PathVariable friendUserId: Long,
        @RequestBody request: UpdateFriendRemarkRequest,
    ): ApiResponse<FriendResponse> =
        ApiResponse.success(
            userService.updateFriendRemark(
                currentUserResolver.resolve(headerUserId, requestUserId),
                friendUserId,
                request,
            )
        )
}
