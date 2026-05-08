package com.ikkyux.swproject.content.repository

import com.ikkyux.swproject.content.entity.ArticleCategoryEntity
import org.springframework.data.jpa.repository.JpaRepository

interface ArticleCategoryRepository : JpaRepository<ArticleCategoryEntity, Long> {
    fun findByStatusOrderBySortOrderAsc(status: String = "ACTIVE"): List<ArticleCategoryEntity>
}
