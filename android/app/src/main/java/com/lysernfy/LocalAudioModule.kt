package com.lysernfy

import android.app.Activity
import android.content.ContentResolver
import android.content.ContentUris
import android.content.IntentSender
import android.database.ContentObserver
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

class LocalAudioModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext),
    ActivityEventListener {


@ReactMethod
fun addListener(eventName: String) {
}

@ReactMethod
fun removeListeners(count: Int) {
}
    private var deletePromise: Promise? = null

    // =========================================
    // MEDIASTORE OBSERVER
    // =========================================

    private var mediaObserver: ContentObserver? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "LocalAudio"

    // =========================================
    // SEND EVENT TO REACT NATIVE
    // =========================================

    private fun sendEvent(eventName: String) {

        reactApplicationContext
            .getJSModule(
                DeviceEventManagerModule
                    .RCTDeviceEventEmitter::class.java
            )
            .emit(eventName, null)
    }

    // =========================================
    // START WATCHING AUDIO CHANGES
    // =========================================

    @ReactMethod
    fun startWatchingAudio() {

        if (mediaObserver != null) return

        mediaObserver =
            object : ContentObserver(
                Handler(Looper.getMainLooper())
            ) {

                override fun onChange(selfChange: Boolean) {

                    super.onChange(selfChange)

                    sendEvent("LOCAL_AUDIO_CHANGED")
                }
            }

        reactApplicationContext
            .contentResolver
            .registerContentObserver(
                MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                true,
                mediaObserver!!
            )
    }

    // =========================================
    // STOP WATCHING
    // =========================================

    @ReactMethod
    fun stopWatchingAudio() {

        mediaObserver?.let {

            reactApplicationContext
                .contentResolver
                .unregisterContentObserver(it)
        }

        mediaObserver = null
    }

    // =========================================
    // DELETE SONG
    // =========================================

    @ReactMethod
    fun deleteAudioFile(
        path: String,
        id: String,
        promise: Promise
    ) {

        try {

            val contentResolver =
                reactApplicationContext.contentResolver

            val contentUri =
                ContentUris.withAppendedId(
                    MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                    id.toLong()
                )

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {

                try {

                    val deleteRequest =
                        MediaStore.createDeleteRequest(
                            contentResolver,
                            listOf(contentUri)
                        )

                    deletePromise = promise

                    currentActivity
                        ?.startIntentSenderForResult(
                            deleteRequest.intentSender,
                            DELETE_REQUEST_CODE,
                            null,
                            0,
                            0,
                            0
                        )

                } catch (e: IntentSender.SendIntentException) {

                    promise.reject(
                        "DELETE_ERROR",
                        e
                    )
                }

            } else {

                val file = File(path)

                if (file.exists()) {
                    file.delete()
                }

                contentResolver.delete(
                    contentUri,
                    null,
                    null
                )

                promise.resolve(true)
            }

        } catch (e: Exception) {

            promise.reject(
                "DELETE_ERROR",
                e
            )
        }
    }

    companion object {

        const val DELETE_REQUEST_CODE = 5001
    }

    override fun onActivityResult(
        activity: Activity?,
        requestCode: Int,
        resultCode: Int,
        data: android.content.Intent?
    ) {

        if (requestCode == DELETE_REQUEST_CODE) {

            if (resultCode == Activity.RESULT_OK) {

                deletePromise?.resolve(true)

            } else {

                deletePromise?.reject(
                    "DELETE_CANCELLED",
                    "User cancelled deletion"
                )
            }

            deletePromise = null
        }
    }

    override fun onNewIntent(
        intent: android.content.Intent?
    ) {}

    // =========================================
    // FETCH AUDIO FILES
    // =========================================

    @ReactMethod
    fun getAudioFiles(
        promise: Promise
    ) {

        try {

            val contentResolver:
                    ContentResolver =
                reactApplicationContext
                    .contentResolver

            val uri =
                MediaStore
                    .Audio
                    .Media
                    .EXTERNAL_CONTENT_URI

            val selection =
                "${MediaStore.Audio.Media.IS_MUSIC} != 0"

            val projection = arrayOf(

                MediaStore.Audio.Media._ID,

                MediaStore.Audio.Media.TITLE,

                MediaStore.Audio.Media.ARTIST,

                MediaStore.Audio.Media.ALBUM,

                MediaStore.Audio.Media.ALBUM_ID,

                MediaStore.Audio.Media.DURATION,

                MediaStore.Audio.Media.DATA,

                MediaStore.Audio.Media.TRACK,
            )

            val sortOrder =
                "${MediaStore.Audio.Media.DATE_ADDED} DESC"

            val cursor =
                contentResolver.query(
                    uri,
                    projection,
                    selection,
                    null,
                    sortOrder
                )

            val audioList =
                Arguments.createArray()

            cursor?.use {

                while (it.moveToNext()) {

                    val song =
                        Arguments.createMap()

                    val path =
                        it.getString(
                            it.getColumnIndexOrThrow(
                                MediaStore
                                    .Audio
                                    .Media
                                    .DATA
                            )
                        )

                    val albumId =
                        it.getLong(
                            it.getColumnIndexOrThrow(
                                MediaStore
                                    .Audio
                                    .Media
                                    .ALBUM_ID
                            )
                        )

                    val albumArtUri =
                        Uri.parse(
                            "content://media/external/audio/albumart"
                        )

                    val artworkUri =
                        ContentUris.withAppendedId(
                            albumArtUri,
                            albumId
                        )

                    var hasArtwork = false

                    try {

                        val inputStream =
                            contentResolver
                                .openInputStream(
                                    artworkUri
                                )

                        if (inputStream != null) {

                            hasArtwork = true

                            inputStream.close()
                        }

                    } catch (e: Exception) {

                        Log.w(
                            "LocalAudioModule",
                            "No artwork for albumId: $albumId"
                        )
                    }

                    song.putString(
                        "id",
                        it.getString(
                            it.getColumnIndexOrThrow(
                                MediaStore
                                    .Audio
                                    .Media
                                    ._ID
                            )
                        )
                    )

                    song.putString(
                        "title",
                        it.getString(
                            it.getColumnIndexOrThrow(
                                MediaStore
                                    .Audio
                                    .Media
                                    .TITLE
                            )
                        )
                    )

                    song.putString(
                        "artist",
                        it.getString(
                            it.getColumnIndexOrThrow(
                                MediaStore
                                    .Audio
                                    .Media
                                    .ARTIST
                            )
                        )
                    )

                    song.putString(
                        "album",
                        it.getString(
                            it.getColumnIndexOrThrow(
                                MediaStore
                                    .Audio
                                    .Media
                                    .ALBUM
                            )
                        )
                    )

                    song.putDouble(
                        "duration",
                        it.getLong(
                            it.getColumnIndexOrThrow(
                                MediaStore
                                    .Audio
                                    .Media
                                    .DURATION
                            )
                        ).toDouble()
                    )

                    song.putString(
                        "path",
                        path
                    )

                    song.putString(
                        "track",
                        it.getString(
                            it.getColumnIndexOrThrow(
                                MediaStore
                                    .Audio
                                    .Media
                                    .TRACK
                            )
                        )
                    )

                    song.putBoolean(
                        "hasArtwork",
                        hasArtwork
                    )

                    if (hasArtwork) {

                        song.putString(
                            "artwork",
                            artworkUri.toString()
                        )
                    }

                    audioList.pushMap(song)
                }
            }

            promise.resolve(audioList)

        } catch (e: Exception) {

            Log.e(
                "LocalAudioModule",
                "Error fetching audio files",
                e
            )

            promise.reject(
                "ERROR",
                e
            )
        }
    }
}