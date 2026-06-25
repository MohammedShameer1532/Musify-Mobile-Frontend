import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Slider from '@react-native-community/slider';
import TrackPlayer, { RepeatMode, State, useActiveTrack, usePlaybackState, useProgress } from 'react-native-track-player';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { getAuth } from '@react-native-firebase/auth';
import { GOOGLE_CLIENT_ID, API_URL } from '@env';
import { useBottomSheet } from '../contextProvider/bottomSheetContext';
import { SearchContext } from '../contextProvider/searchContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { decode } from 'html-entities';



const Music = ({ hideActions = false }) => {
  const { position, duration } = useProgress();
  const playbackState = usePlaybackState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeatOne, setIsRepeatOne] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentSong = useActiveTrack();
  const { openSheet } = useBottomSheet();
  const { setAddtoplaylist } = useContext(SearchContext);


  useEffect(() => {
    setIsPlaying(playbackState?.state === State.Playing);
  }, [playbackState]);


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

  
    const formatSongTitle = (rawTitle) => {
      if (!rawTitle) return 'Unknown';
  
      const decoded = decode(rawTitle); // Converts &quot; to "
      const titleMatch = decoded.match(/^(.+?)\s*\(From\s+"([^"]+)"\)/i);
  
      if (titleMatch) {
        const mainTitle = titleMatch[1].trim();
        const source = titleMatch[2].trim();
        return `${mainTitle} from ${source}`;
      }
  
      return decoded.trim(); // fallback if pattern doesn't match
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

  const handleShuffleToggle = async () => {
    setIsShuffle(prev => !prev);

    if (!isShuffle) {
      // Shuffle ON → pick a random track
      const queue = await TrackPlayer.getQueue();
      if (queue.length > 0) {
        const randomIndex = Math.floor(Math.random() * queue.length);
        await TrackPlayer.skip(randomIndex);
        await TrackPlayer.play();
      }
    } else {
      // Shuffle OFF → do nothing special, normal order resumes
      console.error("Shuffle disabled");
    }
  };



  const handleRepeatToggle = async () => {
    if (!isRepeatOne) {
      await TrackPlayer.setRepeatMode(RepeatMode.Track);
      setIsRepeatOne(true);
    } else {
      await TrackPlayer.setRepeatMode(RepeatMode.Off);
      setIsRepeatOne(false);
    }
  };

  const handlelike = async () => {
    if (loading || !currentSong) return;

    setLoading(true);

    try {
      const users = getAuth().currentUser;

      if (!users) return;

      if (liked) {
        // UNLIKE
        await axios.post(`${API_URL}/api/unlike`, {
          userId: users.uid,
          songId: currentSong.id,
        });

        setLiked(false);
      } else {
        // LIKE
        await axios.post(`${API_URL}/api/like`, {
          userId: users.uid,
          songId: currentSong.id,
          title: formatSongTitle(currentSong.title),
          artist: formatSongTitle(currentSong.artist),
          artwork: currentSong.artwork,
          url: currentSong.url,
          album: formatSongTitle(currentSong.album),
          year: currentSong.year,
        });

        setLiked(true);
      }
    } catch (error) {
      console.error("Like API error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    let isMounted = true;

    const checkIfLiked = async () => {
      try {
        const users = getAuth().currentUser;
        if (!users || !currentSong?.id) return;

        const res = await axios.get(`${API_URL}/api/likes/check`, {
          params: { userId: users.uid, songId: currentSong.id },
        });

        if (isMounted) {
          setLiked(res.data.liked);

        }
      } catch (error) {
        console.error("Check like error:", error.response?.data || error.message);
      }
    };

    checkIfLiked();

    return () => {
      isMounted = false; // prevent state update after unmount
    };
  }, [currentSong?.id]);



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
          <FontAwesome6 name="backward-step" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSeekBackward}>
          <Ionicons name="play-back" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause}>
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={72}
            color="#1DB954"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSeekForward}>
          <Ionicons name="play-forward" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkipToNext}>
          <FontAwesome6 name="forward-step" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      {!hideActions && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShuffleToggle}>
            <Ionicons name="shuffle" size={25} color={isShuffle ? '#1DB954' : '#fff'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleRepeatToggle}>
            <MaterialIcons name="repeat-one" size={25} color={isRepeatOne ? '#1DB954' : '#fff'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handlelike}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={25} color={liked ? "#ff3b30" : "#fff"} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}
            onPress={() => {
              setAddtoplaylist(currentSong);
              openSheet();
            }}>
            <MaterialCommunityIcons name="playlist-music" size={25} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
};

export default Music;

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  actionBtn: {
    padding: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
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
    marginTop: 0,
  },
});
