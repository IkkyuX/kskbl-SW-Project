package com.ikkyux.swproject.user.repository

import com.ikkyux.swproject.user.entity.TagEntity
import org.springframework.data.jpa.repository.JpaRepository

interface TagRepository : JpaRepository<TagEntity, Long> {
    fun findByTagTypeAndStatusOrderBySortOrderAsc(tagType: String, status: String = "ACTIVE"): List<TagEntity>
    fun findAllByIdIn(ids: List<Long>): List<TagEntity>
}
