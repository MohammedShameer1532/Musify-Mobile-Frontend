package com.musify

import android.content.ContentResolver
import android.content.ContentUris
import android.net.Uri
import android.provider.MediaStore
import android.util.Log
import com.facebook.react.bridge.*

class LocalAudioModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "LocalAudio"

    @ReactMethod
    fun getAudioFiles(promise: Promise) {
        Log.d("LocalAudioModule", "Fetching audio files...")

        try {
            val contentResolver: ContentResolver = reactApplicationContext.contentResolver
            val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
            val selection = "${MediaStore.Audio.Media.IS_MUSIC} != 0"
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

            val cursor = contentResolver.query(uri, projection, selection, null, null)
            val audioList = Arguments.createArray()

            cursor?.use {
                while (it.moveToNext()) {
                    val song = Arguments.createMap()
                    val path = it.getString(it.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA))
                    val albumId = it.getLong(it.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID))

                    // Build album art URI
                    val albumArtUri = Uri.parse("content://media/external/audio/albumart")
                    val artworkUri = ContentUris.withAppendedId(albumArtUri, albumId) 
                    
                    // Check if artwork exists
                    var hasArtwork = false
                    try {
                        val inputStream = contentResolver.openInputStream(artworkUri)
                        if (inputStream != null) {
                            hasArtwork = true
                            inputStream.close()
                        }
                    } catch (e: Exception) {
                        Log.w("LocalAudioModule", "No artwork for albumId: $albumId")
                    }

                    song.putString("id", it.getString(it.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)))
                    song.putString("title", it.getString(it.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)))
                    song.putString("artist", it.getString(it.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)))
                    song.putString("album", it.getString(it.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)))
                    song.putDouble("duration", it.getLong(it.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)).toDouble())
                    song.putString("path", path)
                    song.putString("artwork", artworkUri.toString()) // ✅ album art URI
                    song.putString("track", it.getString(it.getColumnIndexOrThrow(MediaStore.Audio.Media.TRACK)))
                    song.putBoolean("hasArtwork", hasArtwork)
                     if (hasArtwork) {
                        song.putString("artwork", artworkUri.toString())
                    }
                    audioList.pushMap(song)
                }
            }

            promise.resolve(audioList)
        } catch (e: Exception) {
            Log.e("LocalAudioModule", "Error fetching audio files", e)
            promise.reject("ERROR", e)
        }
    }
}
