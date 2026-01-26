import React, { useContext, useState } from 'react';
import { View, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AverageColorExtractor from '../common/AverageColorExtractor';
import { SearchContext } from '../contextProvider/searchContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Music from '../common/Music';

const Outersong = () => {
  const [backgroundColor, setBackgroundColor] = useState('rgb(30, 30, 30)');
  const { outerdata } = useContext(SearchContext);
  const navigation = useNavigation();
  console.log("siiii", outerdata);



  return (
    <LinearGradient colors={[backgroundColor, '#000']} style={styles.background}>
      {console.log('Applying Background Color:', backgroundColor)}
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity onPress={() => navigation.goBack()} className='w-10 mt-5'>
          <Ionicons name="arrow-back" size={30} color="white" style={styles.backIcon} />
        </TouchableOpacity>
        {!outerdata ? (
          <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
        ) : (
          <FlatList
            data={Array.isArray(outerdata) ? outerdata : [outerdata]}
            keyExtractor={(item, index) =>
              item?.id?.toString() ?? `${item?.title}-${index}`
            }
            renderItem={({ item }) => (
              <View style={styles.songContainer}>
                {item?.artist === 'Unknown Artist' ? (
                  <Image
                    source={require("../assets/musicphoto.jpg")}
                    className="rounded-xl "
                    resizeMode="cover"
                    style={[styles.songImage]}
                  />
                ) : (
                  <Image
                    source={{ uri: item?.artwork }}
                    className="rounded-xl"
                    resizeMode="cover"
                    style={[styles.songImage]}
                  />
                )}
                <View
                  style={{
                    marginTop: 35,
                    paddingVertical: 15,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 20,
                    marginHorizontal: 16,
                    alignSelf: 'stretch',
                  }}
                >
                  <View style={styles.textContainer}>
                    <TouchableOpacity className="w-[100%]">
                      <Text style={styles.songTitle}>{item?.title?.replace(/\s*\(.*?\)\s*/g, '')}</Text>
                      <Text style={styles.album}>{item?.album?.replace(/\s*\(.*?\)\s*/g, '')}</Text>
                      <Text style={styles.artist}>{item?.artist}</Text>
                    </TouchableOpacity>
                  </View>

                  <Music />
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  )
}

export default Outersong;


const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backIcon: {
    marginLeft: 10,
    marginTop: 10,
  },
  songContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  textContainer: {
    alignSelf: 'flex-start',
    paddingLeft: 30,
    marginTop: 35,
    width: '100%',
  },
  songImage: {
    width: 300,
    height: 300,
  },
  songTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: 'white',
    marginTop: 10,
  },
  album: {
    fontSize: 16,
    color: 'grey',
    marginTop: 5,
  },
  artist: {
    fontSize: 14,
    color: 'grey',
    marginTop: 5,
  },
  icons: {
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    letterSpacing: 10,
    width: 100,
    position: 'absolute',
    marginLeft: 320,
  },
  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '2%',
  },
});
