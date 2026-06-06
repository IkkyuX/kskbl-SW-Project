package com.ikkyux.swproject.auth

import com.ikkyux.swproject.user.entity.UserEntity
import com.ikkyux.swproject.user.entity.UserProfileEntity
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
    private val authVerificationService: AuthVerificationService,
) {

    @Transactional
    fun register(request: RegisterRequest): AuthResponse {
        val normalizedEmail = authVerificationService.normalizeEmail(request.email)
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw IllegalArgumentException("邮箱已被注册")
        }
        authVerificationService.verifyCode(normalizedEmail, request.verificationCode, "REGISTER")

        val nextUNumber = nextUNumber()
        val user = userRepository.save(
            UserEntity(
                uNumber = nextUNumber,
                email = normalizedEmail,
                passwordHash = passwordEncoder.encode(request.password),
                registerType = RegisterType.EMAIL
            )
        )

        userProfileRepository.save(
            UserProfileEntity(
                userId = user.id,
                nickname = request.nickname
            )
        )

        return AuthResponse(
            token = jwtService.generateAccessToken(user.id!!, user.email),
            refreshToken = jwtService.generateRefreshToken(user.id!!),
            userId = user.id!!,
            uNumber = user.uNumber!!,
            nickname = request.nickname
        )
    }

    @Transactional
    fun login(request: LoginRequest): AuthResponse {
        val normalizedEmail = authVerificationService.normalizeEmail(request.email)
        val user = userRepository.findByEmail(normalizedEmail)
            ?: throw IllegalArgumentException("账号不存在")

        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            throw IllegalArgumentException("密码错误")
        }

        user.lastLoginAt = LocalDateTime.now()
        userRepository.save(user)

        val profile = userProfileRepository.findByUserId(user.id!!)
            ?: throw IllegalArgumentException("用户资料不存在")

        return AuthResponse(
            token = jwtService.generateAccessToken(user.id!!, user.email),
            refreshToken = jwtService.generateRefreshToken(user.id!!),
            userId = user.id!!,
            uNumber = user.uNumber!!,
            nickname = profile.nickname
        )
    }

    @Transactional
    fun loginWithCode(request: LoginWithCodeRequest): AuthResponse {
        val normalizedEmail = authVerificationService.normalizeEmail(request.email)
        authVerificationService.verifyCode(normalizedEmail, request.verificationCode, "LOGIN")
        val user = userRepository.findByEmail(normalizedEmail)
            ?: throw IllegalArgumentException("账号不存在")
        return buildAuthResponse(user)
    }

    @Transactional
    fun resetPassword(request: ResetPasswordRequest): Map<String, String> {
        val normalizedEmail = authVerificationService.normalizeEmail(request.email)
        authVerificationService.verifyCode(normalizedEmail, request.verificationCode, "RESET_PASSWORD")
        val user = userRepository.findByEmail(normalizedEmail)
            ?: throw IllegalArgumentException("账号不存在")
        user.passwordHash = passwordEncoder.encode(request.newPassword)
        user.updatedAt = LocalDateTime.now()
        userRepository.save(user)
        return mapOf("message" to "密码已重置，请使用新密码登录")
    }

    private fun nextUNumber(): Long {
        val currentMax = userRepository.findAll()
            .mapNotNull { it.uNumber }
            .maxOrNull() ?: 60000L
        return maxOf(currentMax + 1, 60001L)
    }

    @Transactional(readOnly = true)
    fun me(userId: Long): AuthUserResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("账号不存在") }
        val profile = userProfileRepository.findByUserId(userId)
            ?: throw IllegalArgumentException("用户资料不存在")

        return AuthUserResponse(
            userId = user.id!!,
            uNumber = user.uNumber!!,
            email = user.email,
            nickname = profile.nickname,
            status = user.status
        )
    }

    private fun buildAuthResponse(user: UserEntity): AuthResponse {
        user.lastLoginAt = LocalDateTime.now()
        userRepository.save(user)

        val profile = userProfileRepository.findByUserId(user.id!!)
            ?: throw IllegalArgumentException("用户资料不存在")

        return AuthResponse(
            token = jwtService.generateAccessToken(user.id!!, user.email),
            refreshToken = jwtService.generateRefreshToken(user.id!!),
            userId = user.id!!,
            uNumber = user.uNumber!!,
            nickname = profile.nickname
        )
    }
}
