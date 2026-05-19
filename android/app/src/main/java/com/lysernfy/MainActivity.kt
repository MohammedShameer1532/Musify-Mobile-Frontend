package com.lysernfy

import android.content.Intent
import android.net.Uri
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.media.MediaMetadataRetriever 
import android.util.Base64

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "lysernfy"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleIntent(intent)
  }

  override fun onStart() {
    super.onStart()
    handleIntent(intent)
  }


private fun handleIntent(intent: Intent?) {
    val data: Uri? = intent?.data
    if (data != null) {
        val retriever = MediaMetadataRetriever()
        retriever.setDataSource(this, data)
        val rawTitle = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)
val rawArtist = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST)
val rawAlbum = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM)

val title = rawTitle ?: data.lastPathSegment
    ?.substringAfterLast("/")
    ?.substringBeforeLast(".")
    ?: "Unknown"

val artist = rawArtist ?: "Unknown Artist"
val album = rawAlbum ?: "Unknown Album"

        val duration = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)

        val artworkBytes = retriever.embeddedPicture
        var artworkBase64: String? = null
        if (artworkBytes != null) {
            artworkBase64 = "data:image/jpeg;base64," +
                Base64.encodeToString(artworkBytes, Base64.DEFAULT)
        }

        retriever.release()

        val map = Arguments.createMap()
        map.putString("uri", data.toString())
        map.putString("title", title)
        map.putString("artist", artist)
        map.putString("album", album)
        map.putString("duration", duration)
        if (artworkBase64 != null) {
            map.putString("artwork", artworkBase64)
        }

        val reactContext: ReactContext? = this.reactInstanceManager.currentReactContext
        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("OpenAudioFile", map)
    }
}

}
