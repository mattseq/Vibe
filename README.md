# V!be

Welcome to **V!be**, the chat app where every conversation is a GIF—and only a GIF.  

It’s not just messaging; it’s a whole new language where your skill at picking the perfect animation makes all the difference.  
Will your friend get your vibe, or will your GIF miss the mark and spark confusion? That’s part of the fun.

V!be turns chatting into an art form — where wit, timing, and a little creativity are your best tools.  
Every reaction, every joke, every moment depends on your GIF game.  
Misunderstandings? Absolutely. But they only add to the laughter and spontaneity.

If you think you can master the flow, if you love humor, surprises, and making conversations come alive, then V!be is your new playground.  
Say goodbye to boring text and hello to a world that’s all about skill, creativity, and vibe.

---

## Tech Stack

- **React Native** + **Expo** — Cross-platform mobile development
- **Appwrite** — Backend for authentication, database, storage, and real-time
- **React Native Reanimated** — Advanced animations and gestures
- **react-native-animatable** — Easy declarative animations
- **@react-native-async-storage/async-storage** — Persistent local storage
- **KLIPY** — GIF API provider for all chat content

_Other libraries and tools may have been used for UI, navigation, and API integration._

---

## Features

- **GIF-only Chat:** Every message is a GIF—no text allowed.
- **Real-time Messaging:** Chat rooms update instantly using Appwrite Realtime.
- **Chat Rooms:** Create, join, and manage multiple chat rooms.
- **User Profiles:** View and edit user profiles.
- **Login & Authentication:** Secure login and session management via Appwrite.
- **Theme Switching:** Toggle between dark and light modes, with persistent storage.
- **GIF Search & Trending:** Search for GIFs or browse trending GIFs using KLIPY.
- **Content Filtering:** Control the type of GIFs shown in search (safe/off).
- **Animated UI:** Smooth transitions and effects using React Native Reanimated and react-native-animatable.
- **Persistent Settings:** User preferences (theme, content filter, etc.) are saved locally or on the cloud.

## Environment Variables & Setup

1. **Clone the repository and install dependencies:**
	```sh
	git clone https://github.com/mattseq/vibe-react-native
	cd vibe-react-native
	npm install
	```

2. **Configure environment variables:**
	- Copy `.env.example` to `.env.local` and fill in your Appwrite project details:
	  ```
	  EXPO_PUBLIC_APPWRITE_PROJECT_NAME=YOUR_PROJECT_NAME
	  EXPO_PUBLIC_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID
	  EXPO_PUBLIC_APPWRITE_ENDPOINT=YOUR_APPWRITE_ENDPOINT
	  EXPO_PUBLIC_APPWRITE_DEV_KEY=YOUR_DEV_KEY
	  ```

3. **Appwrite Setup:**
	- Create an Appwrite project.
	- Set up collections for users, messages, and chatrooms.
	- Add your KLIPY API key as an environment variable in your Appwrite function settings.
	- Deploy the KLIPY API proxy function.

4. **Run the app:**
	```sh
	npm run start
	# or
	expo start
	```

## Acknowledgements

- **KLIPY:**  
    Special thanks to KLIPY for their free and unlimited GIF API, powering all chat content.

- **Appwrite & GitHub Education:**  
    Grateful to Appwrite and GitHub Education for providing free backend resources to students and making this project possible.

- **Google Firebase:**  
	Thanks to Google Firebase for providing the initial backend infrastructure and helping this project get started.