package com.ikkyux.swproject.content.repository

import com.ikkyux.swproject.content.entity.ArticleEntity
import org.springframework.data.jpa.repository.JpaRepository

interface ArticleRepository : JpaRepository<ArticleEntity, Long> {
    fun findAllByStatusOrderByUpdatedAtDesc(status: String = "PUBLISHED"): List<ArticleEntity>
}
