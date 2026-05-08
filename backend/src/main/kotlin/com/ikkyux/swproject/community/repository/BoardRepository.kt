package com.ikkyux.swproject.community.repository

import com.ikkyux.swproject.community.entity.BoardEntity
import org.springframework.data.jpa.repository.JpaRepository

interface BoardRepository : JpaRepository<BoardEntity, Long> {
    fun findByStatusOrderBySortOrderAsc(status: String = "ACTIVE"): List<BoardEntity>
}
