import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// 🚀 Prevenir que el splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync().catch(() => { });

interface Props {
    onAnimationComplete?: () => void;
}

const AnimatedSplashScreen: React.FC<Props> = ({ onAnimationComplete }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // 🎭 Iniciar animación
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();

        // 🕒 Tiempo de espera para ocultar
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                setIsVisible(false);
                SplashScreen.hideAsync().catch(() => { });
                if (onAnimationComplete) onAnimationComplete();
            });
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Image
                    source={require('../../assets/IMG_1459.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
};

const { width } = Dimensions.get('window');
const logoSize = width * 0.5 > 250 ? 250 : width * 0.5;

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000', // Fondo negro premium
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    logoContainer: {
        width: logoSize,
        height: logoSize,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
});

export default AnimatedSplashScreen;
