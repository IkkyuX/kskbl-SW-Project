package com.ikkyux.swproject.content

data class ArticleSummaryResponse(
    val id: Long,
    val category: String,
    val title: String,
    val summary: String,
    val updatedAt: String,
    val sourceName: String
)

data class ArticleDetailResponse(
    val id: Long,
    val category: String,
    val title: String,
    val content: String,
    val updatedAt: String,
    val sourceName: String,
    val sourceUrl: String?
)
