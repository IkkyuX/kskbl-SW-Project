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
    name = "friend_requests",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_friend_requests_pair", columnNames = ["requester_user_id", "receiver_user_id"])
    ],
)
class FriendRequestEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "requester_user_id", nullable = false)
    var requesterUserId: Long = 0,

    @Column(name = "receiver_user_id", nullable = false)
    var receiverUserId: Long = 0,

    @Column(nullable = false)
    var status: String = "PENDING",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
