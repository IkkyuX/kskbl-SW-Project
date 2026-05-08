package com.ikkyux.swproject.user

import com.ikkyux.swproject.user.entity.UserProfileEntity
import com.ikkyux.swproject.user.entity.UserTagEntity
import com.ikkyux.swproject.user.repository.TagRepository
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import com.ikkyux.swproject.user.repository.UserTagRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    private val tagRepository: TagRepository,
    private val userTagRepository: UserTagRepository,
) {

    fun getProfile(requestedUserId: Long?): UserProfileResponse {
        val userId = resolveUserId(requestedUserId)
        val profile = userProfileRepository.findByUserId(userId)
            ?: throw IllegalArgumentException("用户资料不存在")
        val tagIds = userTagRepository.findByUserId(userId).map { it.tagId }
        val tags = if (tagIds.isEmpty()) emptyList() else tagRepository.findAllByIdIn(tagIds).map { it.nameZh }

        return UserProfileResponse(
            id = userId,
            nickname = profile.nickname,
            school = profile.schoolCode ?: "",
            major = profile.major ?: "",
            languages = profile.languages?.split(",")?.filter { it.isNotBlank() } ?: emptyList(),
            bio = profile.bio ?: "",
            tags = tags,
            status = tags.firstOrNull { it == "刚到韩国" || it == "选课中" || it == "找兼职中" || it == "心情低落" } ?: "未设置"
        )
    }

    @Transactional
    fun updateProfile(requestedUserId: Long?, request: UpdateProfileRequest): UserProfileResponse {
        val userId = resolveUserId(requestedUserId)
        val profile = userProfileRepository.findByUserId(userId) ?: UserProfileEntity(userId = userId)
        profile.nickname = request.nickname
        profile.schoolCode = request.school
        profile.major = request.major
        profile.languages = request.languages.joinToString(",")
        profile.bio = request.bio
        userProfileRepository.save(profile)
        return getProfile(userId)
    }

    fun getTags(): Map<String, List<String>> =
        mapOf(
            "interestTags" to tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("INTEREST").map { it.nameZh },
            "sceneTags" to tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("SCENE").map { it.nameZh },
            "statusTags" to tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("STATUS").map { it.nameZh }
        )

    fun getTagCatalog(): TagCatalogResponse =
        TagCatalogResponse(
            interestTags = tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("INTEREST").map {
                TagOptionResponse(id = it.id!!, name = it.nameZh, type = it.tagType)
            },
            sceneTags = tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("SCENE").map {
                TagOptionResponse(id = it.id!!, name = it.nameZh, type = it.tagType)
            },
            statusTags = tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("STATUS").map {
                TagOptionResponse(id = it.id!!, name = it.nameZh, type = it.tagType)
            },
        )

    @Transactional
    fun updateTags(requestedUserId: Long?, request: UpdateTagsRequest): Map<String, Any> {
        val userId = resolveUserId(requestedUserId)
        userTagRepository.deleteByUserId(userId)
        request.tagIds.distinct().forEach { tagId ->
            userTagRepository.save(UserTagEntity(userId = userId, tagId = tagId))
        }
        return mapOf("userId" to userId, "tagIds" to request.tagIds.distinct(), "status" to "UPDATED")
    }

    private fun resolveUserId(requestedUserId: Long?): Long =
        requestedUserId ?: userRepository.findFirstByOrderByIdAsc()?.id
        ?: throw IllegalArgumentException("当前没有可用用户")
}
