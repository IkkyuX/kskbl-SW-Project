package com.ikkyux.swproject.auth

import com.ikkyux.swproject.auth.entity.EmailVerificationCodeEntity
import com.ikkyux.swproject.auth.repository.EmailVerificationCodeRepository
import com.ikkyux.swproject.user.repository.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.LocalDateTime

@Service
class AuthVerificationService(
    private val emailVerificationCodeRepository: EmailVerificationCodeRepository,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val mailSender: JavaMailSender,
    @Value("\${spring.mail.username:}") private val mailUsername: String,
    @Value("\${app.auth.email-code.from-address:}") private val fromAddress: String,
    @Value("\${app.auth.email-code.expire-minutes:10}") private val expireMinutes: Long,
    @Value("\${app.auth.email-code.resend-interval-seconds:60}") private val resendIntervalSeconds: Long,
) {

    @Transactional
    fun sendRegisterCode(request: SendEmailCodeRequest): SendEmailCodeResponse {
        val scene = normalizeScene(request.scene)
        val normalizedEmail = normalizeEmail(request.email)
        when (scene) {
            REGISTER_SCENE -> require(!userRepository.existsByEmail(normalizedEmail)) { "邮箱已被注册" }
            LOGIN_SCENE, RESET_PASSWORD_SCENE -> require(userRepository.existsByEmail(normalizedEmail)) { "账号不存在" }
        }

        val latest = emailVerificationCodeRepository.findTopByEmailAndSceneOrderByCreatedAtDesc(normalizedEmail, scene)
        val now = LocalDateTime.now()
        if (latest != null) {
            val secondsSinceLastSend = java.time.Duration.between(latest.createdAt, now).seconds
            require(secondsSinceLastSend >= resendIntervalSeconds) { "验证码发送过于频繁，请稍后再试" }
        }

        val code = generateCode()
        sendEmail(normalizedEmail, code, scene)

        emailVerificationCodeRepository.save(
            EmailVerificationCodeEntity(
                email = normalizedEmail,
                scene = scene,
                codeHash = passwordEncoder.encode(code),
                status = "SENT",
                expiresAt = now.plusMinutes(expireMinutes),
                createdAt = now,
                updatedAt = now,
            )
        )

        return SendEmailCodeResponse(
            message = "验证码已发送，请查收邮箱",
            expiresInSeconds = expireMinutes * 60,
            resendIntervalSeconds = resendIntervalSeconds,
        )
    }

    @Transactional
    fun verifyCode(email: String, verificationCode: String, scene: String) {
        val normalizedEmail = normalizeEmail(email)
        val normalizedCode = verificationCode.trim()
        val normalizedScene = normalizeScene(scene)
        require(normalizedCode.matches(Regex("\\d{6}"))) { "验证码格式不正确" }

        val record = emailVerificationCodeRepository.findTopByEmailAndSceneOrderByCreatedAtDesc(normalizedEmail, normalizedScene)
            ?: throw IllegalArgumentException("请先获取验证码")
        require(record.status != "USED" && record.usedAt == null) { "验证码已失效，请重新获取" }
        require(record.expiresAt.isAfter(LocalDateTime.now())) { "验证码已过期，请重新获取" }
        require(passwordEncoder.matches(normalizedCode, record.codeHash)) { "验证码错误" }

        record.status = "USED"
        record.usedAt = LocalDateTime.now()
        record.updatedAt = LocalDateTime.now()
        emailVerificationCodeRepository.save(record)
    }

    fun normalizeEmail(email: String): String {
        val normalized = email.trim().lowercase()
        require(normalized.isNotBlank()) { "邮箱不能为空" }
        require(EMAIL_REGEX.matches(normalized)) { "邮箱格式不正确" }
        return normalized
    }

    fun normalizeScene(scene: String): String {
        val normalized = scene.trim().uppercase()
        require(normalized in supportedScenes) { "验证码场景不支持" }
        return normalized
    }

    private fun generateCode(): String =
        (1..6)
            .map { secureRandom.nextInt(10) }
            .joinToString(separator = "")

    private fun sendEmail(targetEmail: String, code: String, scene: String) {
        val sender = fromAddress.ifBlank { mailUsername }
        require(sender.isNotBlank()) { "邮件服务未配置发送账号，请先设置 spring.mail.username 或 app.auth.email-code.from-address" }

        val message = SimpleMailMessage().apply {
            setFrom(sender)
            setTo(targetEmail)
            subject = when (scene) {
                LOGIN_SCENE -> "UniLink 登录验证码"
                RESET_PASSWORD_SCENE -> "UniLink 重置密码验证码"
                else -> "UniLink 注册验证码"
            }
            text = buildString {
                appendLine("你好，")
                appendLine()
                appendLine("你的 UniLink 验证码为：$code")
                appendLine("验证码 ${expireMinutes} 分钟内有效，请勿泄露给他人。")
                appendLine()
                appendLine("如果这不是你的操作，请忽略这封邮件。")
            }
        }

        try {
            mailSender.send(message)
        } catch (ex: Exception) {
            throw IllegalArgumentException("验证码发送失败：${ex.message ?: "邮件服务异常"}")
        }
    }

    companion object {
        private const val REGISTER_SCENE = "REGISTER"
        private const val LOGIN_SCENE = "LOGIN"
        private const val RESET_PASSWORD_SCENE = "RESET_PASSWORD"
        private val EMAIL_REGEX = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")
        private val supportedScenes = setOf(REGISTER_SCENE, LOGIN_SCENE, RESET_PASSWORD_SCENE)
        private val secureRandom = SecureRandom()
    }
}
