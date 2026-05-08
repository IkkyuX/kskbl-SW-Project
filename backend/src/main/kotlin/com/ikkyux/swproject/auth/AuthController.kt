package com.ikkyux.swproject.auth

import com.ikkyux.swproject.common.ApiResponse
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
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

    @GetMapping("/me")
    fun me(): ApiResponse<Map<String, Any>> =
        ApiResponse.success(
            mapOf(
                "id" to 1,
                "email" to "demo@student.app",
                "nickname" to "Demo User",
                "status" to "ACTIVE"
            )
        )
}
