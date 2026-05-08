package com.ikkyux.swproject.community.repository

import com.ikkyux.swproject.community.entity.PostCommentEntity
import org.springframework.data.jpa.repository.JpaRepository

interface PostCommentRepository : JpaRepository<PostCommentEntity, Long> {
    fun findAllByPostIdAndStatusOrderByCreatedAtAsc(postId: Long, status: String = "VISIBLE"): List<PostCommentEntity>
}
