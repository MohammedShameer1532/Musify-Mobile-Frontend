import React, { useContext, useRef, useMemo, useState, useEffect } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Text } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePlaylistSheetStore } from '../store/playlistSheetStore';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';
import ViewShot from "react-native-view-shot";
import { SearchContext } from '../contextProvider/searchContext';
import { decode } from 'html-entities';


const Qrsheet = () => {
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['100%'], []);
  const [mode, setMode] = useState("qr"); // qr | scan
  const setOpen = usePlaylistSheetStore((state) => state.setOpen);
  const viewShotRef = useRef();
  const { qrdata } = useContext(SearchContext);

  const qrimage = qrdata?.image?.[2]?.url || qrdata?.artwork || qrdata?.image || null;
  const songId = qrdata?.id ?? "";
  const title = qrdata?.name ?? qrdata?.title ?? "Unknown";



  useEffect(() => {
    // Register the open function globally
    setOpen(() => bottomSheetRef.current?.present());
  }, [setOpen]);


  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current.capture();

      const shareOptions = {
        title: "Share QR",
        message: "Scan this QR",
        url: uri,
        type: "image/png",
      };

      await Share.open(shareOptions);
    } catch (err) {
      console.error(err);
    }
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


  return (
    <View>
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{
          backgroundColor: '#121212',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
        handleIndicatorStyle={{
          backgroundColor: 'grey',
          width: 45,
          height: 5,
          borderRadius: 2,
        }}

      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => bottomSheetRef.current?.dismiss()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* QR MODE */}
        {mode === "qr" && (
          <View style={styles.centerContent}>
            <Text style={styles.title}>Share QR Code</Text>

            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
              <View style={styles.qrBox}>
                {qrimage && (
                  <>
                    <Image
                      source={{ uri: qrimage }}
                      style={styles.songImage}
                    />

                    <Text
                      style={styles.songName}
                      numberOfLines={1}
                    >
                      {formatSongTitle(title)}
                    </Text>
                  </>
                )}

                <QRCode
                  value={songId}
                  size={220}
                  backgroundColor="white"
                  logo={require('../assets/LysernFy.png')}
                  logoBorderRadius={20}
                />
              </View>
            </ViewShot>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color="white" />
                <Text style={styles.shareText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
        }
      </BottomSheetModal >
    </View >
  );
}

export default Qrsheet;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  songName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
    marginBottom: 18,
    textAlign: "center",
    maxWidth: 200,
    letterSpacing: 0.5,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 0,
    alignItems: "flex-end",
  },

  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  songImage: {
    width: 80,
    height: 80,
    marginBottom: 20,
    borderRadius: 12,
  },
  qrBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "white",
    padding: 22,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    backgroundColor: "#1DB954",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
  },

  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },

  scannerContainer: {
    flex: 1,
  },

  backButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DB954",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 30,
  },

  backText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 35,
    gap: 15,
  },

  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DB954",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#262626",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },

  shareText: {
    color: "white",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 18,
  },
});