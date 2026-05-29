package com.lysernfy

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.media.MediaMetadataRetriever

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "lysernfy"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        RNBootSplash.init(this, R.style.BootTheme)
        super.onCreate(savedInstanceState)

        // Handle app opened from external audio file
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)

        setIntent(intent)

        // Handle new incoming intent safely
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {

        if (intent?.action != Intent.ACTION_VIEW) {
            return
        }

        val data: Uri = intent.data ?: return

        try {

            val retriever = MediaMetadataRetriever()
            retriever.setDataSource(this, data)

            val rawTitle =
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)

            val rawArtist =
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST)

            val rawAlbum =
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM)

            val duration =
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)

            val artworkBytes = retriever.embeddedPicture

            var artworkBase64: String? = null

            if (artworkBytes != null) {
                artworkBase64 =
                    "data:image/jpeg;base64," +
                            Base64.encodeToString(
                                artworkBytes,
                                Base64.NO_WRAP
                            )
            }

            retriever.release()

            val title = rawTitle
                ?: data.lastPathSegment
                    ?.substringAfterLast("/")
                    ?.substringBeforeLast(".")
                ?: "Unknown"

            val artist = rawArtist ?: "Unknown Artist"

            val album = rawAlbum ?: "Unknown Album"

            val map = Arguments.createMap()

            map.putString("uri", data.toString())
            map.putString("title", title)
            map.putString("artist", artist)
            map.putString("album", album)
            map.putString("duration", duration)

            artworkBase64?.let {
                map.putString("artwork", it)
            }

            val reactContext: ReactContext? =
                reactNativeHost.reactInstanceManager.currentReactContext

            reactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("OpenAudioFile", map)

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}