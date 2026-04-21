import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronRight, Home } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import Colors from '@/constants/colors';
import { classTypeInfos } from '@/mocks/classes';
import { ClassTypeInfo, ClassType } from '@/types';

const typeColors: Record<ClassType, string> = {
  Mat: Colors.mat,
  Reformer: Colors.reformer,
  Tower: Colors.tower,
  'Wunda Chair': Colors.wundaChair,
};

function ClassTypeCard({ info }: { info: ClassTypeInfo }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [expanded, setExpanded] = React.useState(false);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => !prev);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    });
  }, [scaleAnim]);

  const color = typeColors[info.type];

  return (
    <Animated.View style={[styles.classCard, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={handlePress}>
        <Image
          source={{ uri: info.imageUrl }}
          style={styles.classImage}
          contentFit="cover"
        />
        <View style={styles.imageOverlay} />
        <View style={styles.classImageLabel}>
          <View style={[styles.classTypeDot, { backgroundColor: color }]} />
          <Text style={styles.classImageTitle}>{info.title}</Text>
        </View>
        <View style={styles.classCardBody}>
          <Text style={styles.classSubtitle}>{info.subtitle}</Text>
          <Text style={styles.classDescription} numberOfLines={expanded ? undefined : 3}>
            {info.description}
          </Text>
          {expanded && (
            <View style={styles.benefitsList}>
              {info.benefits.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={[styles.benefitDot, { backgroundColor: color }]} />
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.expandRow}>
            <Text style={[styles.expandText, { color }]}>
              {expanded ? 'Show less' : 'Learn more'}
            </Text>
            <ChevronRight
              size={14}
              color={color}
              style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ClassesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.navigate('/(tabs)/schedule')}
          style={({ pressed }) => [styles.homeButton, { top: insets.top + 16 }, pressed && styles.homeButtonPressed]}
          testID="home-button"
        >
          <Home size={20} color={Colors.primary} />
        </Pressable>
        <Image
          source={{ uri: 'https://images.squarespace-cdn.com/content/v1/57e3fa8a8419c27908c50029/1591362699002-6V9CEY6UUQ3WDF8TDH6S/LP+Heart+Design+Jan+18.png?format=500w' }}
          style={styles.headerLogo}
          contentFit="contain"
        />
        <Text style={styles.headerTitle}>Our Classes</Text>
        <Text style={styles.headerSubtitle}>
          Classical Pilates for every body
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Class Level</Text>
        <Text style={styles.sectionSubtitle}>
          Tap a level to see all upcoming classes at that level
        </Text>
        <View style={styles.levelGrid}>
          {[
            { level: 'Beginners', color: Colors.beginnerTag, desc: 'New to Pilates? Start here to learn the fundamentals safely.' },
            { level: 'Transition', color: Colors.transitionTag, desc: 'Ready to progress? Bridge the gap between beginner and intermediate.' },
            { level: 'Intermediate', color: Colors.intermediateTag, desc: 'Progress with more challenging exercises.' },
            { level: 'Advanced', color: Colors.advancedTag, desc: 'For experienced practitioners seeking the full classical repertoire.' },
          ].map((l) => (
            <Pressable
              key={l.level}
              onPress={() => {
                void Haptics.selectionAsync();
                router.push({ pathname: '/level-classes', params: { level: l.level } });
              }}
              style={({ pressed }) => [styles.levelCard, pressed && styles.levelCardPressed]}
              testID={`level-card-${l.level}`}
            >
              <View style={styles.levelCardHeader}>
                <View style={[styles.levelDot, { backgroundColor: l.color }]} />
                <Text style={styles.levelName}>{l.level}</Text>
                <View style={styles.levelSpacer} />
                <ChevronRight size={16} color={Colors.textMuted} />
              </View>
              <Text style={styles.levelDesc}>{l.desc}</Text>
              <Text style={[styles.levelCta, { color: l.color }]}>View classes →</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Class Types</Text>
        <Text style={styles.sectionSubtitle}>
          We offer four types of apparatus and mat classes at Love Pilates
        </Text>
        {classTypeInfos.map((info) => (
          <ClassTypeCard key={info.type} info={info} />
        ))}
      </View>

      <View style={{ paddingBottom: insets.bottom + 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  homeButton: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  homeButtonPressed: {
    opacity: 0.6,
  },
  headerLogo: {
    width: 120,
    height: 60,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  section: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  classCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  classImage: {
    width: '100%',
    height: 180,
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 100,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  classImageLabel: {
    position: 'absolute',
    top: 145,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classTypeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  classImageTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textLight,
  },
  classCardBody: {
    padding: 16,
    paddingTop: 12,
  },
  classSubtitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  classDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  benefitsList: {
    marginTop: 12,
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  levelGrid: {
    gap: 12,
    marginTop: 8,
  },
  levelCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    overflow: 'visible',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  levelCardPressed: {
    opacity: 0.7,
  },
  levelCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
  },
  levelSpacer: {
    flex: 1,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  levelCta: {
    fontSize: 12,
    fontWeight: '700' as const,
    marginTop: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  levelDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    width: '100%',
  },
  pricingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pricingCardHighlighted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bestValueBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.textLight,
    letterSpacing: 1,
  },
  bestValueTextAlt: {
    color: Colors.primary,
  },
  tapHint: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tapHintAlt: {
    backgroundColor: Colors.primary + '14',
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textLight,
  },
  tapHintTextAlt: {
    color: Colors.primary,
  },
  longerTermNote: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
  },
  longerTermText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  pricingName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  pricingNameHL: {
    color: Colors.textLight,
  },
  pricingPrice: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginBottom: 6,
  },
  pricingPriceHL: {
    color: Colors.textLight,
  },
  pricingDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  pricingDescHL: {
    color: 'rgba(255,255,255,0.8)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  featureDotHL: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  featureText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  featureTextHL: {
    color: 'rgba(255,255,255,0.9)',
  },
  dropInGrid: {
    gap: 8,
  },
  dropInCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  dropInName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dropInPrice: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  privateSection: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  privateSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  privateSectionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
});
