package com.ikkyux.swproject.auth

import com.ikkyux.swproject.common.ApiResponse
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService
) {

    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ApiResponse<AuthResponse> =
        ApiResponse.success(authService.register(request))

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ApiResponse<AuthResponse> =
        ApiResponse.success(authService.login(request))

    @PostMapping("/login/code")
    fun loginWithCode(@Valid @RequestBody request: LoginWithCodeRequest): ApiResponse<AuthResponse> =
        ApiResponse.success(authService.loginWithCode(request))

    @PostMapping("/reset-password")
    fun resetPassword(@Valid @RequestBody request: ResetPasswordRequest): ApiResponse<Map<String, String>> =
        ApiResponse.success(authService.resetPassword(request))

    @GetMapping("/me")
    fun me(
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<AuthUserResponse> =
        ApiResponse.success(authService.me(requestUserId ?: throw IllegalArgumentException("请先登录")))
}
