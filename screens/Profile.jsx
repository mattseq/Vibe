import React, { useEffect, useState, useContext, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, ActivityIndicator, Alert } from 'react-native';
import { Text, View, SafeAreaView, StyleSheet, TextInput, Pressable, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { account, databases, storage } from "../appwrite";
import { ID } from 'react-native-appwrite';

import { ThemeContext } from '../context/ThemeContext';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/colors.js';

import * as Animatable from 'react-native-animatable';

const AnimatablePressable = Animatable.createAnimatableComponent(Pressable)

Animatable.initializeRegistryWithDefinitions({
  strongPulse: {
    0: { scale: 1 },
    0.5: { scale: 1.3 },
    1: { scale: 1 }
  },
});

export default function Profile({ route, navigation }) {
    // Profile picture state
    const [profilePicUrl, setProfilePicUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const COLORS = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
    const styles = createStyles(COLORS);

    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('')
    const [createdAt, setCreatedAt] = useState('')
    const [lastActive, setLastActive] = useState('')
    const [isEditing, setIsEditing] = useState(false);

    const { userId } = route.params || {};
    const [currentUserId, setCurrentUserId] = useState(null);
    useEffect(() => {
        account.get().then(user => setCurrentUserId(user.$id)).catch(() => setCurrentUserId(null));
    }, []);
    const isOwnProfile = !userId || userId === currentUserId;

    const fetchUserProfile = async () => {
        if (!userId) return;
        try {
            const userDoc = await databases.getDocument(
                "main",
                "users",
                userId
            );
            setDisplayName(userDoc.displayName);
            setBio(userDoc.bio);
            setEmail(userDoc.email);
            setCreatedAt(userDoc.createdAt ? new Date(userDoc.createdAt).toDateString() : 'Unknown');
            setLastActive(userDoc.lastActive ? new Date(userDoc.lastActive).toDateString() : 'Unknown');
            setProfilePicUrl(userDoc.profilePicUrl || null);
        } catch (error) {
            console.error("Error fetching user profile: ", error);
        }
    };

    // image and updloa
    const handlePickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        const imageUri = result.assets ? result.assets[0].uri : result.uri;

        if (!result.cancelled && imageUri) {
            setUploading(true);
            // Prepare FormData for REST API upload
            const fileId = ID.unique();
            const formData = new FormData();
            formData.append('fileId', fileId);
            formData.append('file', {
                uri: imageUri,
                name: 'profile.jpg',
                type: 'image/jpeg',
            });

            try {
                // Delete old profile picture if it exists
                if (profilePicUrl) {
                    // Extract file ID from previous URL
                    const match = profilePicUrl.match(/\/files\/(.*?)\//);
                    const oldFileId = match ? match[1] : null;
                    if (oldFileId) {
                        try {
                            await storage.deleteFile('pfps', oldFileId);
                            console.log('Deleted old profile picture:', oldFileId);
                        } catch (err) {
                            console.warn('Failed to delete old profile picture:', err);
                        }
                    }
                }

                const response = await fetch(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT + '/storage/buckets/pfps/files', {
                    method: 'POST',
                    headers: {
                        'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
                    },
                    body: formData,
                });
                const data = await response.json();
                console.log('Upload response:', data);
                if (data && data.$id) {
                    // Get public URL for the uploaded image
                    const fileUrl = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/pfps/files/${data.$id}/preview?project=68aa58e0000eaf3801dc`;
                    // update user doc with new profile pic url
                    await databases.updateDocument(
                        "main",
                        "users",
                        userId,
                        { profilePicUrl: fileUrl }
                    );
                    setProfilePicUrl(fileUrl);
                } else {
                    Alert.alert("Upload Error", "Could not upload image.");
                }
            } catch (error) {
                Alert.alert("Upload Error", "Could not upload image.");
                console.error("Error uploading profile picture: ", error);
            }
            setUploading(false);
        } else {
            console.log("No image selected or URI not found.");
        }
    };


    useEffect(() => {
        // set profile at the start
        fetchUserProfile();
    }, [userId]);

    const handleSaveChanges = async () => {
        if (!userId) return;
        try {
            await databases.updateDocument(
                "main",
                "users",
                userId,
                {
                    displayName: displayName,
                    bio: bio,
                    lastActive: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error("Error updating profile: ", error);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        // reset to original values
        fetchUserProfile();
        setIsEditing(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={COLORS.backgroundMain} />
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <AnimatedButton 
                        style={styles.backButton} 
                        onPressAfterAnimation={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </AnimatedButton>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.avatarSection}>
                        <Pressable onPress={isOwnProfile ? handlePickImage : null}>
                            {uploading ? (
                                <View style={styles.avatar}>
                                    <ActivityIndicator color={COLORS.textMain} />
                                </View>
                            ) : profilePicUrl ? (
                                <Image source={{ uri: profilePicUrl }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                        <Text style={styles.email}>{email}</Text>
                    </View>

                    <View style={styles.infoSection}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Display Name</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={displayName}
                                    onChangeText={setDisplayName}
                                    placeholder="Enter display name"
                                    placeholderTextColor={COLORS.textMuted}
                                    maxLength={30}
                                />
                            ) : (
                                <Text style={styles.fieldValue}>
                                    {displayName || 'No display name set'}
                                </Text>
                            )}
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Bio</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.input, styles.bioInput]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Tell us about yourself..."
                                    placeholderTextColor={COLORS.textMuted}
                                    multiline
                                    numberOfLines={4}
                                    maxLength={200}
                                />
                            ) : (
                                <Text style={styles.fieldValue}>
                                    {bio || 'No bio set'}
                                </Text>
                            )}
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Member Since</Text>
                            <Text style={styles.fieldValue}>
                                {createdAt}
                            </Text>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Last Active</Text>
                            <Text style={styles.fieldValue}>
                                {lastActive}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        { isOwnProfile && (
                            isEditing ? (
                                <>
                                    <AnimatedButton style={styles.saveButton} onPressAfterAnimation={handleSaveChanges} animationType='pulse'>
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </AnimatedButton>
                                    <AnimatedButton style={styles.cancelButton} onPressAfterAnimation={handleCancelEdit} animationType='pulse'>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </AnimatedButton>
                                </>
                            ) : (
                                <AnimatedButton style={styles.editButton} onPressAfterAnimation={() => setIsEditing(true)} animationType='pulse'>
                                    <Text style={styles.editButtonText}>Edit Profile</Text>
                                </AnimatedButton>
                            )
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function AnimatedButton({ animationType='strongPulse', onPressAfterAnimation, children, style }) {
  const ref = useRef(null);

  const handlePress = () => {
    if (ref.current) {
      ref.current.animate(animationType, 300).then(() => {
        if (onPressAfterAnimation) onPressAfterAnimation();
      });
    }
  };

  return (
    <AnimatablePressable ref={ref} style={style} onPress={handlePress}>
      {children}
    </AnimatablePressable>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundMain,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.backgroundAlt,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textMain,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 18,
        color: COLORS.textMain,
        fontWeight: 'bold',
    },
    profileCard: {
        margin: 16,
        backgroundColor: COLORS.backgroundCard,
        borderRadius: 16,
        padding: 20,
        shadowColor: COLORS.backgroundAlt,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: COLORS.glow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        resizeMode: 'cover',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.backgroundMain,
    },
    email: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    infoSection: {
        marginBottom: 24,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fieldValue: {
        fontSize: 16,
        color: COLORS.textMain,
        lineHeight: 24,
    },
    input: {
        backgroundColor: COLORS.backgroundAlt,
        color: COLORS.textMain,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    bioInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    editButton: {
        flex: 1,
        backgroundColor: COLORS.accentBlue,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButtonText: {
        color: COLORS.textOnAccentBlue,
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveButton: {
        flex: 1,
        backgroundColor: COLORS.accent,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: COLORS.textOnAccent,
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: COLORS.backgroundAlt,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelButtonText: {
        color: COLORS.textMuted,
        fontSize: 16,
        fontWeight: 'bold',
    },
});