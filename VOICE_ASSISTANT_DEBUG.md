# 🐛 Voice Assistant - Debugging

## Silence Detector Issue

### 🔍 What to check in console:

1. **AudioContext is created:**
   ```
   🎙️ AudioContext state: running
   🔗 Audio pipeline connected
   ```

2. **Audio test works:**
   ```
   🧪 Test audio level: [number greater than 0]
   ```

3. **Silence detector starts:**
   ```
   🎙️ Starting silence detection...
   ```

4. **Sound level is shown:**
   ```
   🎚️ Audio level: [number] hasDetectedSound: [true/false]
   ```

### 📋 Testing steps:

1. Open voice assistant
2. Check logs in console (F12)
3. If you see "🧪 Test audio level: 0.00" - microphone problem
4. If you see normal sound levels - say something
5. Should see "🗣️ Speech detected!"
6. After stopping speech should see "🔇 Silence duration: X ms"
7. After 2.5 seconds: "🔇 Silence threshold reached, stopping recording"

### 🔧 Temporary solution:

Added "Stop Recording (Test)" button for manual recording stop.

### ⚙️ Current settings:

- **Sound threshold:** 3 (very low)
- **Silence time:** 2.5 seconds
- **Grace period:** 1 second
- **Smoothing:** 0.8

### 🚨 Possible issues:

1. **Microphone blocked** - check permissions
2. **AudioContext suspended** - should automatically resume
3. **Microphone level too low** - speak louder
4. **useCallback closure** - fixed via ref 