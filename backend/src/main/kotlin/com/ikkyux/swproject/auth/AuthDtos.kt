package com.ikkyux.swproject.auth

import jakarta.validation.constraints.NotBlank

data class RegisterRequest(
    @field:NotBlank val email: String,
    @field:NotBlank val password: String,
    @field:NotBlank val nickname: String
)

data class LoginRequest(
    @field:NotBlank val email: String,
    @field:NotBlank val password: String
)

data class AuthResponse(
    val token: String,
    val refreshToken: String,
    val userId: Long,
    val nickname: String
)
