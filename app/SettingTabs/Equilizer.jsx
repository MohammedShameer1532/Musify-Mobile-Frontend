import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeModules } from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { EqualizerModule } = NativeModules;

const Equilizer = () => {
  const navigation = useNavigation();
  const [bandCount, setBandCount] = useState(0);
  const [bandRange, setBandRange] = useState({ min: -1500, max: 1500 });
  const [bandLevels, setBandLevels] = useState([]);

  useEffect(() => {
    EqualizerModule.initialize(0);

    EqualizerModule.getBandCount().then(count => {
      setBandCount(count);
      setBandLevels(Array(count).fill(0));
    });

    EqualizerModule.getBandLevelRange().then(range => {
      setBandRange(range);
    });

    loadEqualizer();
  }, []);

  const saveEqualizer = async (levels) => {
    try {
      await AsyncStorage.setItem('equalizer_levels', JSON.stringify(levels));
    } catch (e) {
      console.error('Save error 👉', e);
    }
  };

  const loadEqualizer = async () => {
    try {
      const data = await AsyncStorage.getItem('equalizer_levels');
      if (data) {
        const parsed = JSON.parse(data);
        setBandLevels(parsed);
        parsed.forEach((level, index) => {
          EqualizerModule.setBandLevel(index, Math.round(level));
        });
      }
    } catch (e) {
      console.log('Load error 👉', e);
    }
  };

  const frequencies = [
    '60Hz',
    '230Hz',
    '910Hz',
    '3.6kHz',
    '14kHz',
  ];

  const resetEqualizer = async () => {
    const resetLevels = Array(bandCount).fill(0);

    setBandLevels(resetLevels);

    resetLevels.forEach((level, index) => {
      EqualizerModule.setBandLevel(index, level);
    });

    await AsyncStorage.setItem(
      'equalizer_levels',
      JSON.stringify(resetLevels),
    );
  };

  return (
    <LinearGradient colors={['#1f1f1f', '#0b0b0b']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Equalizer</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 100,
          }}
        >
          {Array.from({ length: bandCount }).map((_, index) => (
            <View key={index} style={styles.bandCard}>
              <View style={styles.bandHeader}>
                <Text style={styles.bandLabel}>
                  {frequencies[index] || `Band ${index + 1}`}
                </Text>

                <Text style={styles.valueText}>
                  {Math.round(bandLevels[index] || 0)}
                </Text>
              </View>

              <Slider
                minimumValue={bandRange.min}
                maximumValue={bandRange.max}
                value={bandLevels[index] || 0}
                minimumTrackTintColor="#10b981"
                maximumTrackTintColor="#333"
                thumbTintColor="#10b981"
                onValueChange={(value) => {
                  const updated = [...bandLevels];
                  updated[index] = value;

                  setBandLevels(updated);

                  EqualizerModule.setBandLevel(
                    index,
                    Math.round(value),
                  );

                  saveEqualizer(updated);
                }}
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetEqualizer}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#fff"
            />

            <Text style={styles.resetText}>
              Reset Equalizer
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Equilizer;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: { color: '#fff', fontSize: 20, fontFamily: 'Poppins-Bold' },
  bandCard: {
    backgroundColor: '#161616',
    borderRadius: 22,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222',
  },

  bandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  bandLabel: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },

  valueText: {
    color: '#10b981',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },

  resetButton: {
    height: 55,
    borderRadius: 18,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  resetText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    marginLeft: 10,
  },
});
