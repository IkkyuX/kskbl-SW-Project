package com.ikkyux.swproject.update

data class LiveUpdateBundleResponse(
    val bundleId: String,
    val artifactType: String = "zip",
    val downloadUrl: String,
    val checksum: String? = null,
    val signature: String? = null,
    val versionName: String? = null,
    val versionCode: Int? = null,
    val notes: String? = null,
    val platform: String,
    val channel: String,
)

data class LiveUpdateManifestFile(
    val bundleId: String,
    val artifactType: String = "zip",
    val downloadUrl: String? = null,
    val bundlePath: String? = null,
    val checksum: String? = null,
    val signature: String? = null,
    val versionName: String? = null,
    val versionCode: Int? = null,
    val minVersionName: String? = null,
    val minVersionCode: Int? = null,
    val notes: String? = null,
)
