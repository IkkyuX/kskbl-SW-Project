package com.ikkyux.swproject.user

import com.ikkyux.swproject.common.ApiResponse
import com.ikkyux.swproject.common.CurrentUserResolver
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/verifications")
class VerificationController(
    private val verificationService: VerificationService,
    private val currentUserResolver: CurrentUserResolver,
) {

    @PostMapping
    fun submit(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: SubmitVerificationRequest,
    ): ApiResponse<VerificationRecordResponse> =
        ApiResponse.success(verificationService.submit(currentUserResolver.resolve(headerUserId, requestUserId), request))

    @GetMapping("/latest")
    fun latest(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<VerificationRecordResponse?> =
        ApiResponse.success(verificationService.getLatest(currentUserResolver.resolve(headerUserId, requestUserId)))
}
