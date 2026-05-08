package com.ikkyux.swproject.user

data class SubmitVerificationRequest(
    val verifyType: String,
    val fileUrl: String
)

data class VerificationRecordResponse(
    val id: Long,
    val verifyType: String,
    val fileUrl: String,
    val status: String,
    val rejectReason: String?
)
