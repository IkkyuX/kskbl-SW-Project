package com.ikkyux.swproject.bootstrap

import com.ikkyux.swproject.auth.RegisterType
import com.ikkyux.swproject.circle.entity.CircleEntity
import com.ikkyux.swproject.circle.entity.CircleMemberEntity
import com.ikkyux.swproject.circle.repository.CircleMemberRepository
import com.ikkyux.swproject.circle.repository.CircleRepository
import com.ikkyux.swproject.community.entity.BoardEntity
import com.ikkyux.swproject.community.entity.PostEntity
import com.ikkyux.swproject.community.repository.BoardRepository
import com.ikkyux.swproject.community.repository.PostRepository
import com.ikkyux.swproject.content.entity.ArticleCategoryEntity
import com.ikkyux.swproject.content.entity.ArticleEntity
import com.ikkyux.swproject.content.repository.ArticleCategoryRepository
import com.ikkyux.swproject.content.repository.ArticleRepository
import com.ikkyux.swproject.match.entity.MatchRecommendationEntity
import com.ikkyux.swproject.match.repository.MatchRecommendationRepository
import com.ikkyux.swproject.message.entity.ConversationEntity
import com.ikkyux.swproject.message.entity.ConversationMemberEntity
import com.ikkyux.swproject.message.entity.MessageEntity
import com.ikkyux.swproject.message.repository.ConversationMemberRepository
import com.ikkyux.swproject.message.repository.ConversationRepository
import com.ikkyux.swproject.message.repository.MessageRepository
import com.ikkyux.swproject.user.entity.TagEntity
import com.ikkyux.swproject.user.entity.UserEntity
import com.ikkyux.swproject.user.entity.UserProfileEntity
import com.ikkyux.swproject.user.entity.UserTagEntity
import com.ikkyux.swproject.user.repository.TagRepository
import com.ikkyux.swproject.user.repository.UserProfileRepository
import com.ikkyux.swproject.user.repository.UserRepository
import com.ikkyux.swproject.user.repository.UserTagRepository
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.password.PasswordEncoder
import java.math.BigDecimal
import java.time.LocalDateTime

@Configuration
class DataInitializer {

    @Bean
    fun seedData(
        userRepository: UserRepository,
        userProfileRepository: UserProfileRepository,
        tagRepository: TagRepository,
        userTagRepository: UserTagRepository,
        boardRepository: BoardRepository,
        postRepository: PostRepository,
        articleCategoryRepository: ArticleCategoryRepository,
        articleRepository: ArticleRepository,
        matchRecommendationRepository: MatchRecommendationRepository,
        circleRepository: CircleRepository,
        circleMemberRepository: CircleMemberRepository,
        conversationRepository: ConversationRepository,
        conversationMemberRepository: ConversationMemberRepository,
        messageRepository: MessageRepository,
        passwordEncoder: PasswordEncoder,
    ) = CommandLineRunner {
        if (userRepository.count() == 0L) {
            val demoUser = userRepository.save(
                UserEntity(
                    email = "demo@student.app",
                    passwordHash = passwordEncoder.encode("123456"),
                    registerType = RegisterType.EMAIL
                )
            )
            val friendUser = userRepository.save(
                UserEntity(
                    email = "lina@student.app",
                    passwordHash = passwordEncoder.encode("123456"),
                    registerType = RegisterType.EMAIL
                )
            )

            userProfileRepository.save(UserProfileEntity(userId = demoUser.id, nickname = "Demo User", schoolCode = "KYUNGHEE", major = "Computer Science", languages = "Chinese,Korean,English", bio = "新来的留学生，希望认识同校朋友。"))
            userProfileRepository.save(UserProfileEntity(userId = friendUser.id, nickname = "Lina", schoolCode = "KOREA", major = "Business", languages = "Chinese,English", bio = "也刚到韩国，想认识一些新朋友。"))
        }

        if (tagRepository.count() == 0L) {
            tagRepository.saveAll(
                listOf(
                    TagEntity(tagType = "INTEREST", nameZh = "运动", nameKo = "운동", nameEn = "Sports", sortOrder = 1),
                    TagEntity(tagType = "INTEREST", nameZh = "学习", nameKo = "공부", nameEn = "Study", sortOrder = 2),
                    TagEntity(tagType = "SCENE", nameZh = "找饭搭子", nameKo = "밥친구", nameEn = "Meal Buddy", sortOrder = 1),
                    TagEntity(tagType = "SCENE", nameZh = "找学习搭子", nameKo = "공부친구", nameEn = "Study Buddy", sortOrder = 2),
                    TagEntity(tagType = "STATUS", nameZh = "刚到韩国", nameKo = "한국에 막 도착", nameEn = "New in Korea", sortOrder = 1),
                    TagEntity(tagType = "STATUS", nameZh = "选课中", nameKo = "수강신청 중", nameEn = "Selecting Courses", sortOrder = 2),
                )
            )
        }

        val demoUser = userRepository.findByEmail("demo@student.app") ?: return@CommandLineRunner
        if (userTagRepository.findByUserId(demoUser.id!!).isEmpty()) {
            tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("SCENE").firstOrNull()?.let {
                userTagRepository.save(UserTagEntity(userId = demoUser.id!!, tagId = it.id!!))
            }
            tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("STATUS").firstOrNull()?.let {
                userTagRepository.save(UserTagEntity(userId = demoUser.id!!, tagId = it.id!!))
            }
        }

        if (boardRepository.count() == 0L) {
            boardRepository.saveAll(
                listOf(
                    BoardEntity(nameZh = "新生报到", nameKo = "신입생 신고", nameEn = "New Students", sortOrder = 1),
                    BoardEntity(nameZh = "学习选课", nameKo = "수업 및 학업", nameEn = "Study & Courses", sortOrder = 2),
                    BoardEntity(nameZh = "交友活动", nameKo = "교류 활동", nameEn = "Social Activities", sortOrder = 3),
                )
            )
        }

        if (postRepository.count() == 0L) {
            val board = boardRepository.findByStatusOrderBySortOrderAsc().first()
            postRepository.save(
                PostEntity(
                    userId = demoUser.id!!,
                    boardId = board.id!!,
                    title = "第一次办登陆证需要准备什么？",
                    content = "想问一下大家第一次去办理时都带了哪些材料，有没有容易漏掉的项目。",
                    anonymous = true
                )
            )
        }

        val boardsByName = boardRepository.findByStatusOrderBySortOrderAsc().associateBy { it.nameZh }
        if (!postRepository.existsByTitle("新村这家部队锅值得冲吗？")) {
            postRepository.save(
                PostEntity(
                    userId = demoUser.id!!,
                    boardId = boardsByName["交友活动"]?.id ?: boardsByName.values.first().id!!,
                    title = "新村这家部队锅值得冲吗？",
                    content = "准备周末和圈子里的朋友去新村聚餐，有人吃过这家部队锅吗？想听听口味和人均评价。",
                    anonymous = false,
                    likeCount = 18,
                    commentCount = 4,
                    favoriteCount = 7
                )
            )
        }
        if (!postRepository.existsByTitle("第一次找兼职要注意哪些坑？")) {
            postRepository.save(
                PostEntity(
                    userId = demoUser.id!!,
                    boardId = boardsByName["新生报到"]?.id ?: boardsByName.values.first().id!!,
                    title = "第一次找兼职要注意哪些坑？",
                    content = "最近在看咖啡店和便利店的兼职信息，想问问学长学姐面试和签约时最需要注意什么。",
                    anonymous = true,
                    likeCount = 25,
                    commentCount = 6,
                    favoriteCount = 11
                )
            )
        }
        if (!postRepository.existsByTitle("延南洞周末探店有人一起吗")) {
            postRepository.save(
                PostEntity(
                    userId = demoUser.id!!,
                    boardId = boardsByName["交友活动"]?.id ?: boardsByName.values.first().id!!,
                    title = "延南洞周末探店有人一起吗",
                    content = "圈子里如果有人周末想去延南洞吃甜品和逛文创店，可以一起组队，顺便拍点照片。",
                    anonymous = false,
                    likeCount = 31,
                    commentCount = 8,
                    favoriteCount = 15
                )
            )
        }
        if (!postRepository.existsByTitle("江南咖啡店招晚班兼职")) {
            postRepository.save(
                PostEntity(
                    userId = demoUser.id!!,
                    boardId = boardsByName["新生报到"]?.id ?: boardsByName.values.first().id!!,
                    title = "江南咖啡店招晚班兼职",
                    content = "朋友店里在招平日晚班兼职，时薪 12000 韩元，需要基础韩语沟通能力，适合下课后去做。",
                    anonymous = false,
                    likeCount = 19,
                    commentCount = 3,
                    favoriteCount = 9
                )
            )
        }
        if (!postRepository.existsByTitle("毕业回国出二手显示器和书桌")) {
            postRepository.save(
                PostEntity(
                    userId = demoUser.id!!,
                    boardId = boardsByName["学习选课"]?.id ?: boardsByName.values.first().id!!,
                    title = "毕业回国出二手显示器和书桌",
                    content = "月底回国，二手显示器和宜家书桌一起转让，支持自提，价格可以商量。",
                    anonymous = false,
                    likeCount = 14,
                    commentCount = 2,
                    favoriteCount = 6
                )
            )
        }
        if (!postRepository.existsByTitle("弘大某中介收了钱不办事，大家注意避雷")) {
            postRepository.save(
                PostEntity(
                    userId = demoUser.id!!,
                    boardId = boardsByName["新生报到"]?.id ?: boardsByName.values.first().id!!,
                    title = "弘大某中介收了钱不办事，大家注意避雷",
                    content = "签约前承诺帮忙协调入住，收完定金后态度大变，消息也不回。大家租房前一定要确认合同和收据。",
                    anonymous = true,
                    likeCount = 37,
                    commentCount = 9,
                    favoriteCount = 18
                )
            )
        }

        if (articleCategoryRepository.count() == 0L) {
            articleCategoryRepository.saveAll(
                listOf(
                    ArticleCategoryEntity(nameZh = "签证证件", nameKo = "비자 및 서류", nameEn = "Visa & Documents", sortOrder = 1),
                    ArticleCategoryEntity(nameZh = "学校报到", nameKo = "학교 등록", nameEn = "School Registration", sortOrder = 2),
                )
            )
        }

        if (articleRepository.count() == 0L) {
            val category = articleCategoryRepository.findByStatusOrderBySortOrderAsc().first()
            articleRepository.save(
                ArticleEntity(
                    categoryId = category.id!!,
                    titleZh = "外国人登陆证办理指南",
                    titleKo = "외국인 등록증 신청 가이드",
                    titleEn = "Alien Registration Card Guide",
                    contentZh = "整理了办理地点、材料、流程和常见问题。",
                    contentKo = "신청 장소, 준비 서류, 절차와 자주 묻는 질문을 정리했습니다.",
                    contentEn = "This guide covers locations, required documents, process, and FAQs.",
                    sourceName = "平台编辑部",
                    publishedAt = LocalDateTime.now()
                )
            )
        }

        if (matchRecommendationRepository.count() == 0L) {
            val friendUser = userRepository.findByEmail("lina@student.app") ?: return@CommandLineRunner
            matchRecommendationRepository.save(
                MatchRecommendationEntity(
                    userId = demoUser.id!!,
                    targetUserId = friendUser.id!!,
                    matchScore = BigDecimal("92.5"),
                    matchReason = "同为中文用户，且都处于新生适应阶段"
                )
            )
        }

        if (circleRepository.count() == 0L) {
            val circles = circleRepository.saveAll(
                listOf(
                    CircleEntity(nameZh = "首尔大学留学生", iconEmoji = "🎓", description = "首尔大学在读留学生交流圈", memberCount = 2340, postCount = 156, hotScore = 95),
                    CircleEntity(nameZh = "美食探店小分队", iconEmoji = "🍜", description = "发现首尔好吃的餐厅和美食", memberCount = 1892, postCount = 423, hotScore = 92),
                    CircleEntity(nameZh = "弘大周末局", iconEmoji = "🎉", description = "周末一起去弘大玩耍！", memberCount = 856, postCount = 89, hotScore = 70),
                    CircleEntity(nameZh = "打工情报站", iconEmoji = "💼", description = "分享打工信息、时薪、经验", memberCount = 1245, postCount = 234, hotScore = 88),
                )
            )
            circles.firstOrNull { it.nameZh == "美食探店小分队" }?.let {
                circleMemberRepository.save(
                    CircleMemberEntity(circleId = it.id!!, userId = demoUser.id!!, unreadCount = 12, isAdmin = false)
                )
            }
        }

        val friendUser = userRepository.findByEmail("lina@student.app")
        circleRepository.findAll().firstOrNull { it.nameZh == "美食探店小分队" }?.let { foodCircle ->
            if (circleMemberRepository.findByCircleIdAndUserId(foodCircle.id!!, demoUser.id!!) == null) {
                circleMemberRepository.save(
                    CircleMemberEntity(circleId = foodCircle.id!!, userId = demoUser.id!!, unreadCount = 12, isAdmin = false)
                )
            }
            if (friendUser != null && circleMemberRepository.findByCircleIdAndUserId(foodCircle.id!!, friendUser.id!!) == null) {
                circleMemberRepository.save(
                    CircleMemberEntity(circleId = foodCircle.id!!, userId = friendUser.id!!, unreadCount = 0, isAdmin = true)
                )
            }
        }

        circleRepository.findAll().firstOrNull { it.nameZh == "首尔大学留学生" }?.let { schoolCircle ->
            if (circleMemberRepository.findByCircleIdAndUserId(schoolCircle.id!!, demoUser.id!!) == null) {
                circleMemberRepository.save(
                    CircleMemberEntity(circleId = schoolCircle.id!!, userId = demoUser.id!!, unreadCount = 0, isAdmin = false)
                )
            }
        }

        if (conversationRepository.count() == 0L) {
            val friendUser = userRepository.findByEmail("lina@student.app") ?: return@CommandLineRunner
            val conversation = conversationRepository.save(
                ConversationEntity(
                    conversationType = "PRIVATE",
                    status = "ACTIVE",
                )
            )
            conversationMemberRepository.save(ConversationMemberEntity(conversationId = conversation.id!!, userId = demoUser.id!!, unreadCount = 1))
            conversationMemberRepository.save(ConversationMemberEntity(conversationId = conversation.id!!, userId = friendUser.id!!, unreadCount = 0))

            val m1 = messageRepository.save(
                MessageEntity(
                    conversationId = conversation.id!!,
                    senderId = demoUser.id!!,
                    content = "你好！看到你也刚到韩国。",
                    sentAt = LocalDateTime.now().minusHours(4),
                )
            )
            messageRepository.save(
                MessageEntity(
                    conversationId = conversation.id!!,
                    senderId = friendUser.id!!,
                    content = "对呀，我最近也在熟悉学校和生活。",
                    sentAt = LocalDateTime.now().minusHours(3),
                )
            )
            val last = messageRepository.save(
                MessageEntity(
                    conversationId = conversation.id!!,
                    senderId = friendUser.id!!,
                    content = "周末要不要一起去吃饭？",
                    sentAt = LocalDateTime.now().minusMinutes(15),
                )
            )
            conversation.lastMessageId = last.id ?: m1.id
            conversation.lastMessageAt = last.sentAt
            conversation.updatedAt = LocalDateTime.now()
            conversationRepository.save(conversation)
        }
    }
}
