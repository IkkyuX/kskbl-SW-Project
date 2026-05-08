package com.ikkyux.swproject.common

import jakarta.validation.ConstraintViolationException
import org.springframework.http.HttpStatus
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleValidation(ex: MethodArgumentNotValidException): ApiResponse<Unit> {
        val message = ex.bindingResult.fieldErrors.firstOrNull()?.defaultMessage ?: "Invalid request"
        return ApiResponse.fail(400, message)
    }

    @ExceptionHandler(ConstraintViolationException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleConstraint(ex: ConstraintViolationException): ApiResponse<Unit> =
        ApiResponse.fail(400, ex.message ?: "Constraint violation")

    @ExceptionHandler(IllegalArgumentException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleIllegalArgument(ex: IllegalArgumentException): ApiResponse<Unit> =
        ApiResponse.fail(400, ex.message ?: "Bad request")
}
