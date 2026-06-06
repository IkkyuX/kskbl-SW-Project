package com.ikkyux.swproject.message

import com.ikkyux.swproject.common.ApiResponse
import com.ikkyux.swproject.common.CurrentUserResolver
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/v1/messages")
class MessageController(
    private val messageService: MessageService,
    private val currentUserResolver: CurrentUserResolver,
) {

    @GetMapping("/conversations")
    fun conversations(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<List<ConversationSummaryResponse>> =
        ApiResponse.success(messageService.getConversations(currentUserResolver.resolve(headerUserId, requestUserId)!!))

    @GetMapping("/conversations/{id}")
    fun conversationDetail(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
    ): ApiResponse<ConversationDetailResponse> =
        ApiResponse.success(messageService.getConversationDetail(currentUserResolver.resolve(headerUserId, requestUserId)!!, id))

    @PostMapping("/direct")
    fun openDirectConversation(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: OpenDirectConversationRequest,
    ): ApiResponse<ConversationDetailResponse> =
        ApiResponse.success(messageService.openDirectConversation(currentUserResolver.resolve(headerUserId, requestUserId)!!, request.targetUserId))

    @PostMapping("/groups")
    fun openGroupConversation(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestBody request: OpenGroupConversationRequest,
    ): ApiResponse<ConversationDetailResponse> =
        ApiResponse.success(
            request.groupNumber?.let {
                messageService.openGroupConversationByNumber(currentUserResolver.resolve(headerUserId, requestUserId)!!, it)
            } ?: messageService.createGroupConversation(
                userId = currentUserResolver.resolve(headerUserId, requestUserId)!!,
                memberUserIds = request.memberUserIds,
                groupName = request.groupName,
                groupDescription = request.groupDescription,
                groupAvatarUrl = request.groupAvatarUrl,
            )
        )

    @GetMapping("/groups/{id}/members")
    fun groupMembers(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
    ): ApiResponse<List<GroupMemberResponse>> =
        ApiResponse.success(messageService.getGroupMembers(currentUserResolver.resolve(headerUserId, requestUserId)!!, id))

    @PutMapping("/groups/{id}")
    fun updateGroupConversation(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
        @RequestBody request: UpdateGroupConversationRequest,
    ): ApiResponse<ConversationDetailResponse> =
        ApiResponse.success(messageService.updateGroupConversation(currentUserResolver.resolve(headerUserId, requestUserId)!!, id, request))

    @PostMapping("/conversations/{id}")
    fun sendMessage(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
        @RequestBody request: SendMessageRequest,
    ): ApiResponse<ChatMessageResponse> =
        ApiResponse.success(messageService.sendMessage(currentUserResolver.resolve(headerUserId, requestUserId)!!, id, request))

    @PostMapping("/media/voice")
    fun uploadVoiceMessage(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @RequestParam("file") file: MultipartFile,
    ): ApiResponse<UploadedMessageMediaResponse> =
        ApiResponse.success(messageService.uploadVoiceMessage(currentUserResolver.resolve(headerUserId, requestUserId)!!, file))

    @GetMapping("/notifications")
    fun notifications(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<List<NotificationResponse>> =
        ApiResponse.success(messageService.getNotifications(currentUserResolver.resolve(headerUserId, requestUserId)!!))
}
