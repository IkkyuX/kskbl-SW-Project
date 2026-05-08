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
) {

    @Transactional
    fun register(request: RegisterRequest): AuthResponse {
        if (userRepository.existsByEmail(request.email)) {
            throw IllegalArgumentException("邮箱已被注册")
        }

        val user = userRepository.save(
            UserEntity(
                email = request.email,
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
            nickname = request.nickname
        )
    }

    @Transactional
    fun login(request: LoginRequest): AuthResponse {
        val user = userRepository.findByEmail(request.email)
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
            nickname = profile.nickname
        )
    }
}
