import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { RNHoleView } from 'react-native-hole-view';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { SearchContext } from '../contextProvider/searchContext';

const { width, height } = Dimensions.get('window');

const Scanner = () => {
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);
  const [lastCode, setLastCode] = useState(null);
  const scanned = useRef(false);
  const { setScaneddata } = useContext(SearchContext);
  const navigation = useNavigation();

  const frameSize = width * 0.8; // 70% of screen width
  const frameX = (width - frameSize) / 2;
  const frameY = 120; // distance from top in pixels



  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'granted');
    })();
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && !scanned.current) {
        scanned.current = true;
        const value = codes[0]?.value;
        console.log("QR:", value);
        if (value && value.length > 0) {
          setScaneddata(value);
          navigation.navigate('Scansheet')
        }

        setLastCode(value);
        setTimeout(() => {
          scanned.current = false;
        }, 2000);
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>Camera permission required</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />

      {/* Dark overlay with centered hole */}
      <RNHoleView
        pointerEvents="none"
        style={styles.overlay}
        holes={[
          {
            x: frameX,
            y: frameY,
            width: frameSize,
            height: frameSize,
            borderRadius: 16,
          },
        ]}
      />

      {/* White corner frame */}
      <View
        style={[
          styles.scanFrame,
          { width: frameSize, height: frameSize, top: frameY, left: frameX },
        ]}
      >
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      {/* Instruction text above frame */}
      <Text style={[styles.scanText, { top: frameY - 50 }]}>
        Align QR code inside the frame
      </Text>
    </View>
  );
};

export default Scanner;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanFrame: {
    position: 'absolute',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanText: {
    position: 'absolute',
    alignSelf: 'center',
    color: 'white',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  resultBox: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resultText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
