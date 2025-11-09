import React, { useState, useRef, useEffect } from "react";
import { View, Image, Text, Platform } from "react-native";
import { WebView } from "react-native-webview";

const AverageColorExtractor = ({ imageUrl, onColorExtracted }) => {
  const [averageColor, setAverageColor] = useState("#000000");
  const webViewRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      extractColorForWeb();
    }
  }, [imageUrl]);

  const extractColorForWeb = () => {
    const img = new window.Image(); // Ensure it uses the browser's native Image object
    img.crossOrigin = "Anonymous"; // Enable CORS
    img.src = imageUrl;
  
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
  
        for (let i = 0; i < pixels.length; i += 4) {
          r += pixels[i];     // Red
          g += pixels[i + 1]; // Green
          b += pixels[i + 2]; // Blue
          count++;
        }
  
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
  
        const avgColor = `rgb(${r}, ${g}, ${b})`;
        setAverageColor(avgColor);
        onColorExtracted(avgColor);
      } catch (error) {
        console.error("Error processing image:", error);
      }
    };
  
    img.onerror = (error) => {
      console.error("Failed to load image:", error);
    };
  };
  
  const jsCode = `
    (function() {
      var img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = '${imageUrl}';
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        var imageData = ctx.getImageData(0, 0, img.width, img.height);
        var pixels = imageData.data;
        var r = 0, g = 0, b = 0, count = 0;

        for (var i = 0; i < pixels.length; i += 4) {
          r += pixels[i];     // Red
          g += pixels[i + 1]; // Green
          b += pixels[i + 2]; // Blue
          count++;
        }
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        var avgColor = "rgb(" + r + "," + g + "," + b + ")";
        window.ReactNativeWebView.postMessage(avgColor);
      };
    })();
  `;

  const handleColorExtracted = (event) => {
    const color = event.nativeEvent.data;
    setAverageColor(color);
    onColorExtracted(color);
  };

  return (
    <View style={{ alignItems: "center" }}>
      {Platform.OS !== "web" && (
        <WebView
          ref={webViewRef}
          source={{ html: "<html><body></body></html>" }}
          injectedJavaScript={jsCode}
          onMessage={handleColorExtracted}
          style={{ width: 1, height: 1, opacity: 0 }}
        />
      )}
    </View>
  );  
};

export default AverageColorExtractor;
