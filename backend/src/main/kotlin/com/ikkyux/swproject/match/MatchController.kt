package com.ikkyux.swproject.match

import com.ikkyux.swproject.common.ApiResponse
import com.ikkyux.swproject.common.CurrentUserResolver
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/matches")
class MatchController(
    private val matchService: MatchService,
    private val currentUserResolver: CurrentUserResolver,
) {

    @GetMapping("/recommendations")
    fun recommendations(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<List<MatchRecommendationResponse>> =
        ApiResponse.success(matchService.getRecommendations(currentUserResolver.resolve(headerUserId, requestUserId)))

    @PostMapping("/{id}/greet")
    fun greet(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.success(matchService.greet(currentUserResolver.resolve(headerUserId, requestUserId), id))

    @PostMapping("/{id}/skip")
    fun skip(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long
    ): ApiResponse<Map<String, Any>> =
        ApiResponse.success(matchService.skip(currentUserResolver.resolve(headerUserId, requestUserId), id))
}
