package com.ikkyux.swproject.common

data class ApiResponse<T>(
    val code: Int = 0,
    val message: String = "success",
    val data: T? = null
) {
    companion object {
        fun <T> success(data: T): ApiResponse<T> = ApiResponse(data = data)
        fun success(): ApiResponse<Unit> = ApiResponse(data = Unit)
        fun fail(code: Int, message: String): ApiResponse<Unit> = ApiResponse(code = code, message = message)
    }
}
