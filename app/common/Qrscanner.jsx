import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Scanner from './Scanner';

const Qrscanner = ({ navigation }) => {


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scannerContainer}>
        <Scanner />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={25} color="#fff" />
          <Text style={styles.backText}> Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Qrscanner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 0,
    alignItems: "flex-end",
  },

  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 40,
  },

  qrBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
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
    bottom: 200,
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
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },
});