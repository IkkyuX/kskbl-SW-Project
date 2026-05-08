package com.ikkyux.swproject.message

import com.ikkyux.swproject.common.ApiResponse
import com.ikkyux.swproject.common.CurrentUserResolver
import org.springframework.web.bind.annotation.*

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

    @PostMapping("/conversations/{id}")
    fun sendMessage(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
        @PathVariable id: Long,
        @RequestBody request: SendMessageRequest,
    ): ApiResponse<ChatMessageResponse> =
        ApiResponse.success(messageService.sendMessage(currentUserResolver.resolve(headerUserId, requestUserId)!!, id, request))

    @GetMapping("/notifications")
    fun notifications(
        @RequestHeader("X-User-Id", required = false) headerUserId: Long?,
        @RequestAttribute("currentUserId", required = false) requestUserId: Long?,
    ): ApiResponse<List<NotificationResponse>> =
        ApiResponse.success(messageService.getNotifications(currentUserResolver.resolve(headerUserId, requestUserId)!!))
}
