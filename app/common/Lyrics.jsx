import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useMemo, useRef, useState } from 'react'
import Clipboard from '@react-native-clipboard/clipboard';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';



const Lyrics = () => {
  const sheetRef = useRef(null);
  const sheet = useRef(null);
  const [lyrics, setLyrics] = useState();
  const [copied, setCopied] = useState(false);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);


  const fetchLyrics = async () => {
    try {
      const res = await axios.get(`https://jiosaavn-api.vercel.app/lyrics?id=${songId}`);
      const cleanLyrics = res?.data?.lyrics.replace(/<br\s*\/?>/gi, "\n"); // convert <br> to \n
      setLyrics(cleanLyrics);
      sheet.current?.snapToIndex(0);
      console.log("lyriii", cleanLyrics);

    } catch (error) {
      console.log(error);
      sheet.current?.snapToIndex(0);
      setLyrics("Failed to load lyrics");

    }
  };


  const handleCopy = () => {
    Clipboard.setString(lyrics || "");
    setCopied(true);

    // Reset back to copy icon after 2 sec
    setTimeout(() => setCopied(false), 1000);
  };



  return (
    <View>
      <BottomSheet
        ref={sheet}
        index={-1}
        snapPoints={lyricsSnapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={true} F
        handleIndicatorStyle={{
          backgroundColor: 'grey',
          width: 45,
          height: 5,
          borderRadius: 2,
        }}
        backgroundStyle={{ backgroundColor: '#000' }}
      >
        <Text
          style={{
            fontSize: 18,
            marginLeft: 10,
            marginTop: 5.5,
            marginBottom: 20,
            fontWeight: "bold",
            color: "grey",
          }}
        >
          Lyrics 🎶
        </Text>
        <TouchableOpacity style={styles.clearIcon} onPress={() => sheet.current?.close()}>
          <Ionicons name="close-circle" size={25} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ position: "absolute", right: 50, top: "2%" }}
          onPress={handleCopy}
        >
          {copied ? (
            <Ionicons name="checkbox-outline" size={25} color="grey" />
          ) : (
            <MaterialDesignIcons name="clipboard-text-multiple" size={25} color="grey" />
          )}
        </TouchableOpacity>
        <BottomSheetScrollView
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              color: "white",
              fontSize: 14,
              textAlign: "center",   // centers text horizontally
              lineHeight: 22,
              marginBottom: 80,     // better readability
            }}
          >
            {lyrics}
            -----
          </Text>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  )
}

export default Lyrics

const styles = StyleSheet.create({})