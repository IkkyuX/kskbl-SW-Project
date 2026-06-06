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
import com.ikkyux.swproject.user.entity.FriendshipEntity
import com.ikkyux.swproject.user.entity.UserEntity
import com.ikkyux.swproject.user.entity.UserProfileEntity
import com.ikkyux.swproject.user.entity.UserTagEntity
import com.ikkyux.swproject.user.repository.FriendshipRepository
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

    private data class TestUserSeed(
        val uNumber: Long,
        val email: String,
        val nickname: String,
        val schoolCode: String,
        val major: String,
        val languages: String,
        val bio: String,
        val avatarPath: String,
        val tagNames: List<String>,
    )

    @Bean
    fun seedData(
        userRepository: UserRepository,
        userProfileRepository: UserProfileRepository,
        tagRepository: TagRepository,
        userTagRepository: UserTagRepository,
        friendshipRepository: FriendshipRepository,
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
                    uNumber = 10000001L,
                    email = "demo@student.app",
                    passwordHash = passwordEncoder.encode("123456"),
                    registerType = RegisterType.EMAIL
                )
            )
            val friendUser = userRepository.save(
                UserEntity(
                    uNumber = 10000002L,
                    email = "lina@student.app",
                    passwordHash = passwordEncoder.encode("123456"),
                    registerType = RegisterType.EMAIL
                )
            )

            userProfileRepository.save(UserProfileEntity(userId = demoUser.id, nickname = "Demo User", level = 12, schoolCode = "KYUNGHEE", major = "Computer Science", languages = "Chinese,Korean,English", bio = "新来的留学生，希望认识同校朋友。"))
            userProfileRepository.save(UserProfileEntity(userId = friendUser.id, nickname = "Lina", level = 8, schoolCode = "KOREA", major = "Business", languages = "Chinese,English", bio = "也刚到韩国，想认识一些新朋友。"))
        }

        val testUsers = listOf(
            TestUserSeed(
                uNumber = 10000003L,
                email = "soyoung@test.local",
                nickname = "SoYoung",
                schoolCode = "SEOUL",
                major = "Media Communication",
                languages = "Korean,English",
                bio = "平时爱逛咖啡店，也喜欢拍照记录生活。",
                avatarPath = "/uploads/avatars/test-user-01.webp",
                tagNames = listOf("学习", "找饭搭子", "刚到韩国"),
            ),
            TestUserSeed(
                uNumber = 10000004L,
                email = "mingyu@test.local",
                nickname = "Mingyu",
                schoolCode = "YONSEI",
                major = "Computer Science",
                languages = "Chinese,Korean,English",
                bio = "白天上课，晚上打游戏，周末会去探店。",
                avatarPath = "/uploads/avatars/test-user-02.webp",
                tagNames = listOf("运动", "找学习搭子", "选课中"),
            ),
            TestUserSeed(
                uNumber = 10000005L,
                email = "hana@test.local",
                nickname = "Hana",
                schoolCode = "KOREA",
                major = "Design",
                languages = "Japanese,Korean,English",
                bio = "喜欢插画、展览和小众风格的街区。",
                avatarPath = "/uploads/avatars/test-user-03.webp",
                tagNames = listOf("学习", "找饭搭子", "选课中"),
            ),
            TestUserSeed(
                uNumber = 10000006L,
                email = "junho@test.local",
                nickname = "Junho",
                schoolCode = "HANYANG",
                major = "Business",
                languages = "Korean,Chinese",
                bio = "常年在找饭搭子，顺便研究二手和兼职信息。",
                avatarPath = "/uploads/avatars/test-user-04.webp",
                tagNames = listOf("运动", "找饭搭子", "刚到韩国"),
            ),
            TestUserSeed(
                uNumber = 10000007L,
                email = "yuki@test.local",
                nickname = "Yuki",
                schoolCode = "EWHA",
                major = "International Studies",
                languages = "Japanese,Korean",
                bio = "想认识更多留学生朋友，也会分享学习资料。",
                avatarPath = "/uploads/avatars/test-user-05.webp",
                tagNames = listOf("学习", "找学习搭子", "刚到韩国"),
            ),
            TestUserSeed(
                uNumber = 10000008L,
                email = "chenxi@test.local",
                nickname = "Chenxi",
                schoolCode = "SUNGKYUNKWAN",
                major = "Economics",
                languages = "Chinese,Korean,English",
                bio = "最近在熟悉首尔生活，周末会出去拍街景。",
                avatarPath = "/uploads/avatars/test-user-06.webp",
                tagNames = listOf("运动", "找饭搭子", "选课中"),
            ),
            TestUserSeed(
                uNumber = 10000009L,
                email = "minseo@test.local",
                nickname = "Minseo",
                schoolCode = "HUFS",
                major = "Tourism",
                languages = "Korean,English",
                bio = "喜欢旅行、徒步和收集城市里的小店。",
                avatarPath = "/uploads/avatars/test-user-07.webp",
                tagNames = listOf("运动", "找学习搭子", "刚到韩国"),
            ),
        )

        testUsers.forEach { seed ->
            val user = userRepository.findByEmail(seed.email) ?: userRepository.save(
                UserEntity(
                    uNumber = seed.uNumber,
                    email = seed.email,
                    passwordHash = passwordEncoder.encode("123456"),
                    registerType = RegisterType.EMAIL,
                )
            )
            if (user.uNumber == null) {
                user.uNumber = seed.uNumber
                userRepository.save(user)
            }

            val profile = userProfileRepository.findByUserId(user.id!!) ?: UserProfileEntity(userId = user.id)
            profile.nickname = seed.nickname
            profile.avatarUrl = seed.avatarPath
            profile.schoolCode = seed.schoolCode
            profile.major = seed.major
            profile.languages = seed.languages
            profile.bio = seed.bio
            profile.level = profile.level.coerceAtLeast(1)
            profile.updatedAt = LocalDateTime.now()
            userProfileRepository.save(profile)
        }

        var nextLegacyUNumber = userRepository.findAll()
            .mapNotNull { it.uNumber }
            .maxOrNull() ?: 60000L
        userRepository.findAll().filter { it.uNumber == null }.forEach { user ->
            nextLegacyUNumber += 1
            user.uNumber = nextLegacyUNumber
            userRepository.save(user)
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

        val tagsByName = tagRepository.findAll().associateBy { it.nameZh }

        val demoUser = userRepository.findByEmail("demo@student.app") ?: return@CommandLineRunner
        fun ensureFriendship(userId: Long, friendUserId: Long) {
            if (!friendshipRepository.existsByUserIdAndFriendUserIdAndStatus(userId, friendUserId)) {
                friendshipRepository.save(FriendshipEntity(userId = userId, friendUserId = friendUserId))
            }
        }

        userRepository.findByEmail("lina@student.app")?.let { friendUser ->
            ensureFriendship(demoUser.id!!, friendUser.id!!)
            ensureFriendship(friendUser.id!!, demoUser.id!!)
        }

        if (userTagRepository.findByUserId(demoUser.id!!).isEmpty()) {
            tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("SCENE").firstOrNull()?.let {
                userTagRepository.save(UserTagEntity(userId = demoUser.id!!, tagId = it.id!!))
            }
            tagRepository.findByTagTypeAndStatusOrderBySortOrderAsc("STATUS").firstOrNull()?.let {
                userTagRepository.save(UserTagEntity(userId = demoUser.id!!, tagId = it.id!!))
            }
        }

        val friendUser = userRepository.findByEmail("lina@student.app")
        friendUser?.id?.let { userId ->
            if (userTagRepository.findByUserId(userId).isEmpty()) {
                listOf("学习", "找饭搭子", "刚到韩国").forEach { tagName ->
                    tagsByName[tagName]?.id?.let { tagId ->
                        userTagRepository.save(UserTagEntity(userId = userId, tagId = tagId))
                    }
                }
            }
        }

        testUsers.forEach { seed ->
            val user = userRepository.findByEmail(seed.email) ?: return@forEach
            if (userTagRepository.findByUserId(user.id!!).isEmpty()) {
                seed.tagNames.forEach { tagName ->
                    tagsByName[tagName]?.id?.let { tagId ->
                        userTagRepository.save(UserTagEntity(userId = user.id!!, tagId = tagId))
                    }
                }
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
        val friendUserForPosts = userRepository.findByEmail("lina@student.app")
        if (friendUserForPosts != null && !postRepository.existsByTitle("今天在安国散步，发现一家很安静的书店")) {
            postRepository.save(
                PostEntity(
                    userId = friendUserForPosts.id!!,
                    boardId = boardsByName["交友活动"]?.id ?: boardsByName.values.first().id!!,
                    title = "今天在安国散步，发现一家很安静的书店",
                    content = "下午下课后去安国附近走了一圈，路上有很多小店适合慢慢逛。下次想约朋友一起去拍照和喝咖啡。",
                    anonymous = false,
                    likeCount = 12,
                    commentCount = 2,
                    favoriteCount = 5
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
            val suggestedUser = userRepository.findByEmail("mina@student.app") ?: userRepository.save(
                UserEntity(
                    email = "mina@student.app",
                    passwordHash = passwordEncoder.encode("123456"),
                    registerType = RegisterType.EMAIL
                )
            )
            if (userProfileRepository.findByUserId(suggestedUser.id!!) == null) {
                userProfileRepository.save(
                    UserProfileEntity(
                        userId = suggestedUser.id,
                        nickname = "Mina",
                        schoolCode = "YONSEI",
                        major = "Design",
                        languages = "Korean,English",
                        bio = "喜欢逛展、拍照和喝咖啡，最近在熟悉首尔。",
                    )
                )
            }
            matchRecommendationRepository.save(
                MatchRecommendationEntity(
                    userId = demoUser.id!!,
                    targetUserId = suggestedUser.id!!,
                    matchScore = BigDecimal("94.8"),
                    matchReason = "同在韩国生活，兴趣标签也很接近"
                )
            )
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
                    CircleEntity(nameZh = "首尔大学留学生", iconEmoji = "🎓", description = "首尔大学在读留学生交流圈", ownerUserId = demoUser.id!!, announcement = "欢迎新成员入圈，发言前请先阅读校园生活与签证经验置顶帖。", memberCount = 2340, postCount = 156, hotScore = 95),
                    CircleEntity(nameZh = "美食探店小分队", iconEmoji = "🍜", description = "发现首尔好吃的餐厅和美食", ownerUserId = demoUser.id!!, announcement = "欢迎分享近期探店体验，广告与代购内容会被移除。", memberCount = 1892, postCount = 423, hotScore = 92),
                    CircleEntity(nameZh = "弘大周末局", iconEmoji = "🎉", description = "周末一起去弘大玩耍！", ownerUserId = demoUser.id!!, announcement = "欢迎加入圈子，请文明交流并尽量提供真实有用的信息。", memberCount = 856, postCount = 89, hotScore = 70),
                    CircleEntity(nameZh = "打工情报站", iconEmoji = "💼", description = "分享打工信息、时薪、经验", ownerUserId = demoUser.id!!, announcement = "请在发布岗位前确认时薪、地点与签证要求，避免无效信息。", memberCount = 1245, postCount = 234, hotScore = 88),
                )
            )
            circles.firstOrNull { it.nameZh == "美食探店小分队" }?.let {
                circleMemberRepository.save(
                    CircleMemberEntity(circleId = it.id!!, userId = demoUser.id!!, unreadCount = 12, isAdmin = true)
                )
            }
        }

        val circleFriendUser = userRepository.findByEmail("lina@student.app")
        circleRepository.findAll().firstOrNull { it.nameZh == "美食探店小分队" }?.let { foodCircle ->
            if (circleMemberRepository.findByCircleIdAndUserId(foodCircle.id!!, demoUser.id!!) == null) {
                circleMemberRepository.save(
                    CircleMemberEntity(circleId = foodCircle.id!!, userId = demoUser.id!!, unreadCount = 12, isAdmin = true)
                )
            }
            if (circleFriendUser != null && circleMemberRepository.findByCircleIdAndUserId(foodCircle.id!!, circleFriendUser.id!!) == null) {
                circleMemberRepository.save(
                    CircleMemberEntity(circleId = foodCircle.id!!, userId = circleFriendUser.id!!, unreadCount = 0, isAdmin = true)
                )
            }
        }

        circleRepository.findAll().firstOrNull { it.nameZh == "首尔大学留学生" }?.let { schoolCircle ->
            if (circleMemberRepository.findByCircleIdAndUserId(schoolCircle.id!!, demoUser.id!!) == null) {
                circleMemberRepository.save(
                    CircleMemberEntity(circleId = schoolCircle.id!!, userId = demoUser.id!!, unreadCount = 0, isAdmin = true)
                )
            }
        }

        circleRepository.findAll().forEach { circle ->
            if (circle.ownerUserId == 0L) {
                circle.ownerUserId = demoUser.id!!
            }
            if (circle.announcement.isBlank()) {
                circle.announcement = when {
                    circle.nameZh.contains("大学") -> "欢迎新成员入圈，发言前请先阅读校园生活与签证经验置顶帖。"
                    circle.nameZh.contains("美食") -> "欢迎分享近期探店体验，广告与代购内容会被移除。"
                    circle.nameZh.contains("打工") -> "请在发布岗位前确认时薪、地点与签证要求，避免无效信息。"
                    else -> "欢迎加入圈子，请文明交流并尽量提供真实有用的信息。"
                }
            }
            circleRepository.save(circle)
        }

        if (conversationRepository.count() == 0L) {
            val chatFriendUser = userRepository.findByEmail("lina@student.app") ?: return@CommandLineRunner
            val conversation = conversationRepository.save(
                ConversationEntity(
                    conversationType = "PRIVATE",
                    status = "ACTIVE",
                )
            )
            conversationMemberRepository.save(ConversationMemberEntity(conversationId = conversation.id!!, userId = demoUser.id!!, unreadCount = 1))
            conversationMemberRepository.save(ConversationMemberEntity(conversationId = conversation.id!!, userId = chatFriendUser.id!!, unreadCount = 0))

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
                    senderId = chatFriendUser.id!!,
                    content = "对呀，我最近也在熟悉学校和生活。",
                    sentAt = LocalDateTime.now().minusHours(3),
                )
            )
            val last = messageRepository.save(
                MessageEntity(
                    conversationId = conversation.id!!,
                    senderId = chatFriendUser.id!!,
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
