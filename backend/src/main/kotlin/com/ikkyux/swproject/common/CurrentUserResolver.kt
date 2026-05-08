package com.ikkyux.swproject.common

import org.springframework.stereotype.Component

@Component
class CurrentUserResolver {
    fun resolve(headerUserId: Long?, requestUserId: Long?): Long? = requestUserId ?: headerUserId
}
