import { Client, Account, Databases, Storage, Functions } from "react-native-appwrite";
import Constants from 'expo-constants';

const client = new Client();

// Get config from expo config or environment variables
const config = Constants.expoConfig?.extra?.appwrite || {};

client
  .setEndpoint(config.endpoint || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) // Your Appwrite API endpoint
  .setProject(config.projectId || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID); // Your project ID from Appwrite console
// Services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

export { client, account, databases, storage, functions };