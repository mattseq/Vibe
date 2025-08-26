import { Client, Account, Databases, Storage, Functions } from "appwrite";
import Constants from 'expo-constants';

const client = new Client();

const appwriteEnv = Constants.expoConfig.extra.appwrite

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) // Your Appwrite API endpoint
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID) // Your project ID from Appwrite console
  .setDevKey(process.env.EXPO_PUBLIC_APPWRITE_DEV_KEY); // Your secret API key from Appwrite console
  // Services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

export { client, account, databases, storage, functions };