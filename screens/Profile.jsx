import React, { useEffect, useState, useContext, useRef } from 'react';
import { Text, View, SafeAreaView, StyleSheet, TextInput, Pressable, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, orderBy, addDoc, limit, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

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
    const isOwnProfile = !userId || userId == auth.currentUser.uid;

    const fetchUserProfile = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const userDocRef = doc(db, "users", userId);
    
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setDisplayName(userData.displayName);
                setBio(userData.bio);
                setEmail(userData.email);
                setCreatedAt(userData.createdAt?.toDate().toDateString() || 'Unknown')
                setLastActive(userData.lastActive?.toDate().toDateString() || 'Unknown')
            }
        } catch (error) {
            console.error("Error fetching user profile: ", error)
        }
    }

    useEffect(() => {
        // set profile at the start
        fetchUserProfile();
    }, [userId]);

    const handleSaveChanges = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const userDocRef = doc(db, "users", userId);

        try {
            await updateDoc(userDocRef, {
                displayName: displayName,
                bio: bio,
                lastActive: serverTimestamp()
            });
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
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
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