package com.ikkyux.swproject.auth

import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class RegisterRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank @field:Size(min = 6, max = 64) val password: String,
    @field:NotBlank val nickname: String,
    @field:NotBlank @field:Pattern(regexp = "\\d{6}", message = "验证码必须为 6 位数字") val verificationCode: String,
)

data class LoginRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank val password: String
)

data class SendEmailCodeRequest(
    @field:NotBlank @field:Email val email: String,
    @field:Pattern(
        regexp = "REGISTER|LOGIN|RESET_PASSWORD",
        message = "验证码场景不支持",
    )
    val scene: String = "REGISTER",
)

data class SendEmailCodeResponse(
    val message: String,
    val expiresInSeconds: Long,
    val resendIntervalSeconds: Long,
)

data class LoginWithCodeRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank @field:Pattern(regexp = "\\d{6}", message = "验证码必须为 6 位数字") val verificationCode: String,
)

data class ResetPasswordRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank @field:Pattern(regexp = "\\d{6}", message = "验证码必须为 6 位数字") val verificationCode: String,
    @field:NotBlank @field:Size(min = 6, max = 64) val newPassword: String,
)

data class AuthResponse(
    val token: String,
    val refreshToken: String,
    val userId: Long,
    @get:JsonProperty("unumber")
    val uNumber: Long,
    val nickname: String
)

data class AuthUserResponse(
    val userId: Long,
    @get:JsonProperty("unumber")
    val uNumber: Long,
    val email: String?,
    val nickname: String,
    val status: String
)
