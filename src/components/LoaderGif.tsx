import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector } from '../hook';

const LoaderGif = () => {
    const isVisible = useAppSelector((state) => state.auth.isGlobalLoading);
    const spinValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isVisible) {
            // 🎡 Animación de rotación
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();

            // 💓 Animación de pulso
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseValue, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseValue, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            spinValue.stopAnimation();
            pulseValue.stopAnimation();
        }
    }, [isVisible]);

    if (!isVisible) return null;

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.overlay}>
            <Animated.View
                style={[
                    styles.loaderContainer,
                    { transform: [{ scale: pulseValue }] },
                ]}
            >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <LinearGradient
                        colors={['#aa00ff', '#ff00aa']}
                        style={styles.spinner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </Animated.View>
                <View style={styles.innerCircle} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
    },
    loaderContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    innerCircle: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#000',
    },
});

export default LoaderGif;
