import React, { useMemo, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePlaylistSheetStore } from '../store/playlistSheetStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Testing = () => {
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['100%'], []);

  const setOpen = usePlaylistSheetStore((state) => state.setOpen);

  useEffect(() => {
    setOpen(() => {
      bottomSheetRef.current?.present();
    });

    return () => setOpen(null);
  }, [setOpen]);

  return (
    // <GestureHandlerRootView >
    <View>
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={true}
        backgroundStyle={{ backgroundColor: '#121212' }}
      >
        <TouchableOpacity
          onPress={() => bottomSheetRef.current?.dismiss()}
        >
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>

        <Text style={{ color: 'white' }}>Shameer</Text>
      </BottomSheetModal>
      </View>
    // </GestureHandlerRootView>
  );
};

export default Testing;


  // const openSheet = usePlaylistSheetStore((state) => state.openSheet);
  // <TouchableOpacity onPress={openSheet}>
  //                       <Text>Open Playlist</Text>
  //                     </TouchableOpacity>