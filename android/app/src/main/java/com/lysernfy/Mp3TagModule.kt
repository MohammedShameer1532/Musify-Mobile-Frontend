package com.lysernfy

import com.facebook.react.bridge.*
import java.io.File
import java.net.URL
import org.jaudiotagger.audio.AudioFileIO
import org.jaudiotagger.tag.FieldKey
import org.jaudiotagger.tag.images.ArtworkFactory

class Mp3TagModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "Mp3TagModule"
    }

    @ReactMethod
    fun writeTags(
        audioPath: String,
        tags: ReadableMap,
        promise: Promise
    ) {

        try {

            val file = File(audioPath)

            if (!file.exists()) {
                promise.reject(
                    "FILE_NOT_FOUND",
                    "Audio file not found"
                )
                return
            }

            val audioFile = AudioFileIO.read(file)

            val tag = audioFile.tagOrCreateAndSetDefault

            if (tags.hasKey("title")) {
                tag.setField(
                    FieldKey.TITLE,
                    tags.getString("title")
                )
            }

            if (tags.hasKey("artist")) {
                tag.setField(
                    FieldKey.ARTIST,
                    tags.getString("artist")
                )
            }

            if (tags.hasKey("album")) {
                tag.setField(
                    FieldKey.ALBUM,
                    tags.getString("album")
                )
            }

            if (tags.hasKey("year")) {
                tag.setField(
                    FieldKey.YEAR,
                    tags.getString("year")
                )
            }

            // COVER IMAGE
            if (tags.hasKey("imageUrl")) {

                val imageUrl = tags.getString("imageUrl")

                if (!imageUrl.isNullOrEmpty()) {

                    val tempImage = File.createTempFile(
                        "cover",
                        ".jpg",
                        reactApplicationContext.cacheDir
                    )

                    URL(imageUrl).openStream().use { input ->
                        tempImage.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }

                    val artwork =
                        ArtworkFactory.createArtworkFromFile(tempImage)

                    tag.deleteArtworkField()

                    tag.setField(artwork)
                }
            }

            audioFile.commit()

            promise.resolve("Tags written successfully")

        } catch (e: Exception) {

            e.printStackTrace()

            promise.reject(
                "TAG_ERROR",
                e.message
            )
        }
    }
}