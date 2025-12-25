import TrackPlayer, {Event} from 'react-native-track-player';
export const PlaybackService = async () => {
  const SEEK_INTERVAL = 10;

  const subscriptions = [
    TrackPlayer.addEventListener(Event.RemotePlay, TrackPlayer.play),
    TrackPlayer.addEventListener(Event.RemotePause, TrackPlayer.pause),
    TrackPlayer.addEventListener(Event.RemoteStop, TrackPlayer.stop),

    TrackPlayer.addEventListener(Event.RemoteNext, async () => {
      try {
        await TrackPlayer.skipToNext();
      } catch (e) {
        console.warn('No next track:', e);
      }
    }),

    TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
      try {
        await TrackPlayer.skipToPrevious();
      } catch (e) {
        console.warn('No previous track:', e);
      }
    }),

    TrackPlayer.addEventListener(Event.RemoteJumpForward, async () => {
      const {position} = await TrackPlayer.getProgress();
      await TrackPlayer.seekTo(position + SEEK_INTERVAL);
    }),

    TrackPlayer.addEventListener(Event.RemoteJumpBackward, async () => {
      const {position} = await TrackPlayer.getProgress();
      await TrackPlayer.seekTo(Math.max(position - SEEK_INTERVAL, 0));
    }),
  ];

  return () => {
    subscriptions.forEach(sub => sub.remove());
  };
};
