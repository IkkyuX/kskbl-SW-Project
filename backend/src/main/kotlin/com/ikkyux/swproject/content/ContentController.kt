package com.ikkyux.swproject.content

import com.ikkyux.swproject.common.ApiResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/articles")
class ContentController(
    private val contentService: ContentService
) {

    @GetMapping
    fun getArticles(): ApiResponse<List<ArticleSummaryResponse>> =
        ApiResponse.success(contentService.getArticles())

    @GetMapping("/{id}")
    fun getArticleDetail(@PathVariable id: Long): ApiResponse<ArticleDetailResponse> =
        ApiResponse.success(contentService.getArticleDetail(id))
}
