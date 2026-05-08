package com.ikkyux.swproject.auth

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Date
import javax.crypto.SecretKey

@Service
class JwtService(
    @Value("\${app.jwt-secret}") secret: String,
) {
    private val key: SecretKey = Keys.hmacShaKeyFor(secret.padEnd(32, 'x').toByteArray(StandardCharsets.UTF_8))

    fun generateAccessToken(userId: Long, email: String?): String {
        val now = Instant.now()
        return Jwts.builder()
            .subject(userId.toString())
            .claim("email", email)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(7, ChronoUnit.DAYS)))
            .signWith(key)
            .compact()
    }

    fun generateRefreshToken(userId: Long): String {
        val now = Instant.now()
        return Jwts.builder()
            .subject(userId.toString())
            .claim("type", "refresh")
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(30, ChronoUnit.DAYS)))
            .signWith(key)
            .compact()
    }

    fun parse(token: String): Claims =
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload

    fun extractUserId(token: String): Long = parse(token).subject.toLong()
}
