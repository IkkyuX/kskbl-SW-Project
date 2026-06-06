package com.ikkyux.swproject.user.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.LocalDateTime

@Entity
@Table(
    name = "friendships",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_friendships_user_friend", columnNames = ["user_id", "friend_user_id"])
    ],
)
class FriendshipEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    @Column(name = "friend_user_id", nullable = false)
    var friendUserId: Long = 0,

    @Column(nullable = false)
    var status: String = "ACTIVE",

    @Column(name = "remark_name")
    var remarkName: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
