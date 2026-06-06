package com.ikkyux.swproject.user.entity

import com.ikkyux.swproject.auth.RegisterType
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class UserEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "u_number", unique = true)
    var uNumber: Long? = null,

    @Column(unique = true)
    var email: String? = null,

    @Column(unique = true)
    var phone: String? = null,

    @Column(name = "password_hash", nullable = false)
    var passwordHash: String = "",

    @Enumerated(EnumType.STRING)
    @Column(name = "register_type", nullable = false)
    var registerType: RegisterType = RegisterType.EMAIL,

    @Column(nullable = false)
    var status: String = "ACTIVE",

    @Column(name = "last_login_at")
    var lastLoginAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
