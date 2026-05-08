package com.ikkyux.swproject.content

import com.ikkyux.swproject.content.repository.ArticleCategoryRepository
import com.ikkyux.swproject.content.repository.ArticleRepository
import org.springframework.stereotype.Service
import java.time.format.DateTimeFormatter

@Service
class ContentService(
    private val articleRepository: ArticleRepository,
    private val articleCategoryRepository: ArticleCategoryRepository,
) {

    fun getArticles(): List<ArticleSummaryResponse> {
        val categories = articleCategoryRepository.findAll().associateBy { it.id }
        return articleRepository.findAllByStatusOrderByUpdatedAtDesc().map { article ->
            ArticleSummaryResponse(
                id = article.id!!,
                category = categories[article.categoryId]?.nameZh ?: "未分类",
                title = article.titleZh,
                summary = article.contentZh.take(80),
                updatedAt = article.updatedAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                sourceName = article.sourceName ?: "平台编辑部"
            )
        }
    }

    fun getArticleDetail(id: Long): ArticleDetailResponse {
        val article = articleRepository.findById(id)
            .orElseThrow { IllegalArgumentException("文章不存在") }
        val category = articleCategoryRepository.findById(article.categoryId).orElse(null)
        return ArticleDetailResponse(
            id = article.id!!,
            category = category?.nameZh ?: "未分类",
            title = article.titleZh,
            content = article.contentZh,
            updatedAt = article.updatedAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            sourceName = article.sourceName ?: "平台编辑部",
            sourceUrl = article.sourceUrl
        )
    }
}
