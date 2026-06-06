package com.ikkyux.swproject.update

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

@Service
class LiveUpdateService(
    @Value("\${app.public-base-url:http://localhost:8080}") private val publicBaseUrl: String,
    @Value("\${app.live-update.manifest-root:uploads/app-updates/live}") private val manifestRoot: String,
    private val objectMapper: ObjectMapper,
) {

    fun getLatest(
        platform: String,
        channel: String,
        versionName: String?,
        versionCode: Int?,
    ): LiveUpdateBundleResponse? {
        val manifestPath = resolveManifestPath(platform, channel)
        if (!Files.exists(manifestPath)) {
            return null
        }

        val manifest = objectMapper.readValue(Files.readString(manifestPath), LiveUpdateManifestFile::class.java)
        if (!isCompatible(manifest, versionName, versionCode)) {
            return null
        }
        val downloadUrl = resolveDownloadUrl(platform, channel, manifest)
        return LiveUpdateBundleResponse(
            bundleId = manifest.bundleId,
            artifactType = manifest.artifactType,
            downloadUrl = downloadUrl,
            checksum = manifest.checksum,
            signature = manifest.signature,
            versionName = manifest.versionName ?: versionName,
            versionCode = manifest.versionCode ?: versionCode,
            notes = manifest.notes,
            platform = platform,
            channel = channel,
        )
    }

    private fun isCompatible(
        manifest: LiveUpdateManifestFile,
        versionName: String?,
        versionCode: Int?,
    ): Boolean {
        if (manifest.versionCode != null && versionCode != null && manifest.versionCode != versionCode) {
            return false
        }
        if (!manifest.versionName.isNullOrBlank() && !versionName.isNullOrBlank() && manifest.versionName != versionName) {
            return false
        }
        if (manifest.minVersionCode != null && versionCode != null && versionCode < manifest.minVersionCode) {
            return false
        }
        if (!manifest.minVersionName.isNullOrBlank() && !versionName.isNullOrBlank() && manifest.minVersionName != versionName) {
            return false
        }
        return true
    }

    private fun resolveManifestPath(platform: String, channel: String): Path {
        val safePlatform = sanitizeSegment(platform)
        val safeChannel = sanitizeSegment(channel)
        return Paths.get(manifestRoot, safePlatform, safeChannel, "latest.json")
    }

    private fun resolveDownloadUrl(platform: String, channel: String, manifest: LiveUpdateManifestFile): String {
        val rawPath = (manifest.downloadUrl ?: manifest.bundlePath ?: "bundle.zip").trim()
        if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
            return rawPath
        }
        val relativePath = rawPath.removePrefix("/")
        return "${publicBaseUrl.trimEnd('/')}/uploads/app-updates/live/${sanitizeSegment(platform)}/${sanitizeSegment(channel)}/$relativePath"
    }

    private fun sanitizeSegment(value: String): String =
        value.trim().lowercase().replace(Regex("[^a-z0-9._-]"), "-")
}
