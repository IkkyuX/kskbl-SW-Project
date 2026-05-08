package com.ikkyux.swproject.community.repository

import com.ikkyux.swproject.community.entity.PostEntity
import org.springframework.data.jpa.repository.JpaRepository

interface PostRepository : JpaRepository<PostEntity, Long> {
    fun findAllByStatusOrderByCreatedAtDesc(status: String = "PUBLISHED"): List<PostEntity>
    fun existsByTitle(title: String): Boolean
}
