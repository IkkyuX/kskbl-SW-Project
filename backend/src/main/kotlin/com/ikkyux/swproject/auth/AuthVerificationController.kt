package com.ikkyux.swproject.auth

import com.ikkyux.swproject.common.ApiResponse
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/auth")
class AuthVerificationController(
    private val authVerificationService: AuthVerificationService,
) {

    @PostMapping("/send-code")
    fun sendCode(@Valid @RequestBody request: SendEmailCodeRequest): ApiResponse<SendEmailCodeResponse> =
        ApiResponse.success(authVerificationService.sendRegisterCode(request))
}
