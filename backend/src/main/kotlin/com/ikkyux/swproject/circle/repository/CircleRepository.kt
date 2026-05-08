package com.ikkyux.swproject.circle.repository

import com.ikkyux.swproject.circle.entity.CircleEntity
import org.springframework.data.jpa.repository.JpaRepository

interface CircleRepository : JpaRepository<CircleEntity, Long> {
    fun findAllByStatusOrderByHotScoreDesc(status: String = "ACTIVE"): List<CircleEntity>
}
