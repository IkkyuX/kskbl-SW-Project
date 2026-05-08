package com.ikkyux.swproject.user

import com.ikkyux.swproject.user.entity.VerificationRecordEntity
import com.ikkyux.swproject.user.repository.UserRepository
import com.ikkyux.swproject.user.repository.VerificationRecordRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class VerificationService(
    private val userRepository: UserRepository,
    private val verificationRecordRepository: VerificationRecordRepository,
) {

    @Transactional
    fun submit(requestedUserId: Long?, request: SubmitVerificationRequest): VerificationRecordResponse {
        val userId = resolveUserId(requestedUserId)
        val saved = verificationRecordRepository.save(
            VerificationRecordEntity(
                userId = userId,
                verifyType = request.verifyType,
                fileUrl = request.fileUrl,
                status = "PENDING"
            )
        )
        return saved.toResponse()
    }

    fun getLatest(requestedUserId: Long?): VerificationRecordResponse? {
        val userId = resolveUserId(requestedUserId)
        return verificationRecordRepository.findTopByUserIdOrderByCreatedAtDesc(userId)?.toResponse()
    }

    private fun resolveUserId(requestedUserId: Long?): Long =
        requestedUserId ?: userRepository.findFirstByOrderByIdAsc()?.id
        ?: throw IllegalArgumentException("当前没有可用用户")

    private fun VerificationRecordEntity.toResponse() = VerificationRecordResponse(
        id = id!!,
        verifyType = verifyType,
        fileUrl = fileUrl,
        status = status,
        rejectReason = rejectReason
    )
}
