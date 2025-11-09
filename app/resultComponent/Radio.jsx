import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';



const LANGUAGES = [
  { name: 'All', code: '' },
  { name: 'Tamil', code: 'tamil' },
  { name: 'Hindi', code: 'hindi' },
  { name: 'Telugu', code: 'telugu' },
  { name: 'English', code: 'english' },
  { name: 'Punjabi', code: 'punjabi' },
  { name: 'Kannada', code: 'kannada' },
];


const Radio = () => {
  const [trend, setTrend] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const navigation = useNavigation();
  const { globalSearch, setDataSearch } = useContext(SearchContext);

  const trendingData = async () => {
    try {
      const langParam = selectedLanguage ? `&languages=${selectedLanguage}` : '';
      const url = `https://www.jiosaavn.com/api.php?__call=webradio.getFeaturedStations&api_version=4&_format=json&_marker=0&ctx=wap6dot0${langParam}`;

      const response = await axios.get(url);
      setTrend(response?.data);


    } catch (error) {
      console.error("Error fetching trending data:", error);
    }
  };
  console.log('radio', trend);

  useEffect(() => {
    trendingData();
  }, [selectedLanguage]);


  const getHighResImage = (url) => {
    if (!url) return null;
    let fixedUrl = url.replace(/\\/g, "");
    if (!fixedUrl.startsWith("http")) {
      fixedUrl = "https:" + fixedUrl;
    }
    // Replace either "-150x150" or "_150x150" with "_500x500"
    fixedUrl = fixedUrl.replace(/[_-]\d+x\d+/, "_500x500");
    return fixedUrl;
  };


  console.log('getHighResImage', getHighResImage);

  const handlePress = (songId, moreInfo) => {
    setDataSearch({
      id: songId,
      moreInfo,
    });
    navigation.navigate('Rresult', {
      id: songId,
      language: moreInfo?.language,
      moreInfo, // pass full object too if needed
    });
  };



  return (
    <View>
      <View>
        <Text className='text-2xl font-bold text-white ml-5 mt-5'>Radio Stations</Text>
        <FlatList
          data={LANGUAGES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.code || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedLanguage(item.code)}
              style={{
                backgroundColor: selectedLanguage === item.code ? '#10b981' : '#1f2937',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                marginHorizontal: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 14 }}>{item.name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 10, marginTop: 10 }}
        />
      </View>
      <FlatList
        contentContainerStyle={{ paddingBottom: 20, marginLeft: 20, padding: 5 }}
        horizontal
        data={trend}
        keyExtractor={(song, index) => `${song.id}-${index}`}
        renderItem={({ item: song }) => (
          <View style={styles.songContainer}>
            <TouchableOpacity onPress={() => handlePress(song.id, song.more_info)}>
              <Image
                source={{ uri: getHighResImage(song?.image) }}
                className="rounded-xl w-48 h-48 p-4"
                resizeMode="cover"
              />
              <Text
                style={{ color: 'white', fontSize: 14, width: 192, marginTop: 8 }}
                numberOfLines={2}
                ellipsizeMode="tail">
                {song?.title.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

export default Radio;

const styles = StyleSheet.create({
  songContainer: {
    marginRight: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  songImage: {
    width: 290,
    height: 290,
    borderRadius: 16,
  },
  songTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
})