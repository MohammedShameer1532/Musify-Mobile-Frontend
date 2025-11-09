import TrackPlayer, { Event } from 'react-native-track-player';

export const PlaybackService = async function () {
  try {
    TrackPlayer.addEventListener(Event.RemotePlay, async () => {
      await TrackPlayer.play();
    });

    TrackPlayer.addEventListener(Event.RemotePause, async () => {
      await TrackPlayer.pause();
    });

    TrackPlayer.addEventListener(Event.RemoteStop, async () => {
      await TrackPlayer.stop();
    });

    TrackPlayer.addEventListener(Event.RemoteNext, async () => {
      await TrackPlayer.skipToNext();
    });

    TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
      await TrackPlayer.skipToPrevious();
    });
    TrackPlayer.addEventListener(Event.RemoteJumpForward,async()=>{
     const { position } = await TrackPlayer.getProgress();
         await TrackPlayer.seekTo(Math.max(position + 10, 0));
    });
    TrackPlayer.addEventListener(Event.RemoteJumpBackward,async()=>{
     const { position } = await TrackPlayer.getProgress();
         await TrackPlayer.seekTo(Math.max(position - 10, 0));
    });

  } catch (error) {
    console.error("PlaybackService Error:", error);
  }
};
