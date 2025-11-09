import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Slider from '@react-native-community/slider';
import TrackPlayer, { State, usePlaybackState, useProgress } from 'react-native-track-player';

const Music = () => {
  const { position, duration } = useProgress();
  const playbackState = usePlaybackState();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(playbackState?.state === State.Playing);
  }, [playbackState]);

  useEffect(() => {
    const fetchTrack = async () => {
      const trackId = await TrackPlayer.getActiveTrackIndex();
      if (trackId != null) {
        const track = await TrackPlayer.getTrack(trackId);
        console.log('Currently playing track:', track);
      } else {
        console.log('No track is currently playing');
      }
    };
    fetchTrack();
  }, []);

  const handlePlayPause = async () => {
    const currentState = await TrackPlayer.getPlaybackState();
    if (currentState.state === State.Playing) {
      await TrackPlayer.pause();
      setIsPlaying(false);
    } else {
      await TrackPlayer.play();
      setIsPlaying(true);
    }
  };

  const handleSeekForward = async () => {
    const { position, duration } = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.min(position + 10, duration));
  };

  const handleSeekBackward = async () => {
    const { position } = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.max(position - 10, 0));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

const handleSkipToNext = async () => {
  try {
    await TrackPlayer.skipToNext();
    await TrackPlayer.play(); // start playback after skipping
  } catch (err) {
    console.warn("No next track available:", err);
  }
};

const handleSkipToPrevious = async () => {
  try {
    await TrackPlayer.skipToPrevious();
    await TrackPlayer.play(); // start playback after skipping
  } catch (err) {
    console.warn("No previous track available:", err);
  }
};

  
  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        value={position}
        minimumValue={0}
        maximumValue={duration}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#ccc"
        thumbTintColor="#fff"
        onSlidingComplete={async (value) => {
          await TrackPlayer.seekTo(value);
        }}
      />
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={handleSkipToPrevious}>
          <FontAwesome6 name="backward-step" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSeekBackward}>
          <Ionicons name="play-back" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause}>
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={64}
            color="#1DB954"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSeekForward}>
          <Ionicons name="play-forward" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkipToNext}>
          <FontAwesome6 name="forward-step" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Music;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: -10,
  },
  timeText: {
    color: '#ccc',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
});
