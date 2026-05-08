package com.ikkyux.swproject.user

import com.ikkyux.swproject.common.ApiResponse
import com.ikkyux.swproject.common.CurrentUserResolver
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

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

    @PutMapping("/profile")
    fun updateProfile(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: UpdateProfileRequest
    ): ApiResponse<UserProfileResponse> =
        ApiResponse.success(userService.updateProfile(currentUserResolver.resolve(headerUserId, requestUserId), request))

    @GetMapping("/tags")
    fun getAvailableTags(): ApiResponse<Map<String, List<String>>> =
        ApiResponse.success(userService.getTags())

    @GetMapping("/tag-options")
    fun getTagOptions(): ApiResponse<TagCatalogResponse> =
        ApiResponse.success(userService.getTagCatalog())

    @PutMapping("/tags")
    fun updateTags(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: UpdateTagsRequest
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.success(userService.updateTags(currentUserResolver.resolve(headerUserId, requestUserId), request))
}
