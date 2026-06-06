package com.ikkyux.swproject.update

import com.ikkyux.swproject.common.ApiResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/app-updates")
class LiveUpdateController(
    private val liveUpdateService: LiveUpdateService,
) {

    @GetMapping("/live/latest")
    fun getLatest(
        @RequestParam platform: String,
        @RequestParam channel: String,
        @RequestParam(required = false) versionName: String?,
        @RequestParam(required = false) versionCode: Int?,
    ): ApiResponse<LiveUpdateBundleResponse?> =
        ApiResponse.success(liveUpdateService.getLatest(platform, channel, versionName, versionCode))
}
