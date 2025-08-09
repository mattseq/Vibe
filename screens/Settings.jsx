import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, Text, View, StatusBar, SafeAreaView, Pressable, ScrollView, Switch, Modal, TouchableOpacity } from 'react-native';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, orderBy, addDoc, limit, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

import { ThemeContext } from '../context/ThemeContext';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/colors.js';

export default function Settings({ navigation }) {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const COLORS = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
    const styles = createStyles(COLORS);

    const [isDarkMode, setIsDarkMode] = useState(true);
    const [contentFilter, setContentFilter] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);

    const contentFilterOptions = [
        { value: 'off', label: 'Off', description: 'All content allowed' },
        { value: 'low', label: 'Light', description: 'Minimal content filtering' },
        { value: 'medium', label: 'Moderate', description: 'Moderate content filtering' },
        { value: 'high', label: 'Strict', description: 'Strict family-friendly content only' }
    ];

    const handleThemeToggle = async () => {
        const newValue = !isDarkMode;
        setIsDarkMode(newValue);

        toggleTheme()

        console.log('Theme changed to:', newValue ? 'dark' : 'light');
    };

    const handleFilterChange = async (filter) => {
        setContentFilter(filter);
        setShowFilterModal(false);
        
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = doc(db, "users", user.uid);
        
        try {
            await updateDoc(userDoc, {
                contentFilter: filter
            });
        } catch (error) {
            console.error("Error changing content filter: ", error);
        }

        console.log('Content filter changed to:', filter);
    };

    const getFilterLabel = () => {
        const option = contentFilterOptions.find(opt => opt.value === contentFilter);
        return option ? option.label : 'Medium';
    };

    const fetchSettings = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = doc(db, "users", user.uid);

        try {
            const docSnap = await getDoc(userDoc);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setContentFilter(data.contentFilter || 'medium');
            }
        } catch (error) {
            console.error("Error fetching settings from Firebase: ", error);
        }

        setIsDarkMode(theme == 'dark')
    }

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={COLORS.backgroundMain} />
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <Pressable 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </Pressable>
                </View>

                <View style={styles.settingsContainer}>
                    {/* Theme Settings */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Appearance</Text>
                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>Dark Mode</Text>
                                <Text style={styles.settingDescription}>
                                    Switch between dark and light themes
                                </Text>
                            </View>
                            <Switch
                                value={isDarkMode}
                                onValueChange={handleThemeToggle}
                                trackColor={{ false: COLORS.border, true: COLORS.accent }}
                                thumbColor={isDarkMode ? COLORS.backgroundMain : COLORS.textMuted}
                                ios_backgroundColor={COLORS.border}
                            />
                        </View>
                    </View>

                    {/* Content Filter Settings */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Content</Text>
                        <Pressable 
                            style={styles.settingItem}
                            onPress={() => setShowFilterModal(true)}
                        >
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>GIF Content Filter</Text>
                                <Text style={styles.settingDescription}>
                                    Control the type of GIFs shown in search
                                </Text>
                            </View>
                            <View style={styles.settingValue}>
                                <Text style={styles.settingValueText}>{getFilterLabel()}</Text>
                                <Text style={styles.settingValueArrow}>›</Text>
                            </View>
                        </Pressable>
                    </View>


                </View>
            </ScrollView>

            {/* Content Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Content Filter</Text>
                            <Pressable 
                                style={styles.modalCloseButton}
                                onPress={() => setShowFilterModal(false)}
                            >
                                <Text style={styles.modalCloseText}>✕</Text>
                            </Pressable>
                        </View>
                        
                        {contentFilterOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.filterOption,
                                    contentFilter === option.value && styles.filterOptionSelected
                                ]}
                                onPress={() => handleFilterChange(option.value)}
                            >
                                <View style={styles.filterOptionContent}>
                                    <Text style={[
                                        styles.filterOptionLabel,
                                        contentFilter === option.value && styles.filterOptionLabelSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                    <Text style={[
                                        styles.filterOptionDescription,
                                        contentFilter === option.value && styles.filterOptionDescriptionSelected
                                    ]}>
                                        {option.description}
                                    </Text>
                                </View>
                                {contentFilter === option.value && (
                                    <Text style={styles.filterOptionCheck}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
    settingsContainer: {
        padding: 16,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.accent,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundCard,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textMain,
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: COLORS.textMuted,
        lineHeight: 20,
    },
    settingValue: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValueText: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginRight: 8,
    },
    settingValueArrow: {
        fontSize: 16,
        color: COLORS.textMuted,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.backgroundCard,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textMain,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseText: {
        fontSize: 16,
        color: COLORS.textMain,
        fontWeight: 'bold',
    },
    filterOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    filterOptionSelected: {
        backgroundColor: COLORS.accent + '20',
    },
    filterOptionContent: {
        flex: 1,
    },
    filterOptionLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textMain,
        marginBottom: 4,
    },
    filterOptionLabelSelected: {
        color: COLORS.accent,
    },
    filterOptionDescription: {
        fontSize: 14,
        color: COLORS.textMuted,
        lineHeight: 20,
    },
    filterOptionDescriptionSelected: {
        color: COLORS.textLight,
    },
    filterOptionCheck: {
        fontSize: 18,
        color: COLORS.accent,
        fontWeight: 'bold',
    },
});