package com.lysernfy

import android.media.audiofx.Equalizer
import com.facebook.react.bridge.*

class EqualizerModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private var equalizer: Equalizer? = null

    override fun getName(): String {
        return "EqualizerModule"
    }

    @ReactMethod
    fun initialize(audioSessionId: Int) {
        try {
            equalizer?.release()
            equalizer = Equalizer(0, audioSessionId)
            equalizer?.enabled = true
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun getBandCount(promise: Promise) {
        promise.resolve(equalizer?.numberOfBands?.toInt() ?: 0)
    }

    @ReactMethod
    fun getBandLevelRange(promise: Promise) {
        val range = equalizer?.bandLevelRange

        val map = Arguments.createMap()
        map.putInt("min", range?.get(0)?.toInt() ?: 0)
        map.putInt("max", range?.get(1)?.toInt() ?: 0)

        promise.resolve(map)
    }

    @ReactMethod
    fun setBandLevel(
        band: Int,
        level: Int
    ) {
        equalizer?.setBandLevel(
            band.toShort(),
            level.toShort()
        )
    }

    @ReactMethod
    fun release() {
        equalizer?.release()
        equalizer = null
    }
}