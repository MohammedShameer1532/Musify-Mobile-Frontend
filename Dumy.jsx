import TrackPlayer, { Event } from 'react-native-track-player';

export const PlaybackService = async () => {
  const subscriptions = [
    // … other handlers …

    TrackPlayer.addEventListener(Event.RemoteLike, async () => {
      // ✅ This fires when user taps the heart in notification
      const track = await TrackPlayer.getCurrentTrack();
      if (track != null) {
        const metadata = await TrackPlayer.getTrack(track);
        console.log('❤️ User liked track:', metadata?.title);

        // Do your custom logic here: save to favorites, update Firestore, etc.
        // e.g. saveToFavorites(metadata);
      }
    }),
  ];

  return () => subscriptions.forEach(sub => sub.remove());
};
