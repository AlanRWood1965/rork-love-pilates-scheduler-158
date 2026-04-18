import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Heart,
  MapPin,
  Globe,
  ExternalLink,
  Award,
  Users,
  Clock,
  Phone,
  Mail,
  Calendar,
  Home,
  Instagram,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import Colors from '@/constants/colors';

function openUrl(url: string) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    void Linking.openURL(url);
  }
}

function InfoCard({ icon, title, subtitle, onPress }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.infoCard, pressed && onPress && styles.infoCardPressed]}
    >
      <View style={styles.infoIconWrap}>{icon}</View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoSubtitle}>{subtitle}</Text>
      </View>
      {onPress && <ExternalLink size={16} color={Colors.textMuted} />}
    </Pressable>
  );
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const openWebsite = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openUrl('https://www.karenwoodpilates.com');
  }, []);

  const openBooking = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openUrl('https://bookwhen.com/karenwoodpilates');
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
        <Text style={styles.headerTitle}>About</Text>
        <Text style={styles.headerSubtitle}>Love Pilates, Milngavie</Text>
      </View>

      <View style={styles.heroSection}>
        <View style={styles.awardBadge}>
          <Award size={18} color={Colors.primary} />
          <Text style={styles.awardText}>Pilates Business of the Year 2023</Text>
        </View>
        <Text style={styles.heroTitle}>Welcome to Love Pilates</Text>
        <Text style={styles.heroBody}>
          Love Pilates is a boutique Classical Pilates studio located in the centre of Milngavie, 
          northwest of Glasgow, Scotland. We want exercise to be a joyful experience so we offer small, 
          friendly classes with a real community feel. Our enthusiastic and qualified teachers will 
          help you rapidly improve your overall fitness level, deliver great results and ensure classes 
          are always great fun.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meet Karen</Text>
        <View style={styles.karenPhotoCard}>
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/58tvvudluno4tpoawxizb.png' }}
            style={styles.karenPhoto}
            contentFit="cover"
          />
          <View style={styles.karenOverlay}>
            <Text style={styles.karenName}>Karen Wood</Text>
            <Text style={styles.karenRole}>Founder & Lead Teacher</Text>
          </View>
        </View>
        <Text style={styles.bioText}>
          After over 20 years teaching Pilates, Karen opened the Love Pilates Studio in the centre of Milngavie in 2014. Karen is a 3rd generation Pilates Instructor having trained with Kirk Smith who worked with Romana Kryzanowska, an original student of Joseph Pilates in New York.
        </Text>
        <Text style={styles.bioText}>
          Karen and her team's warm, supportive teaching style creates a welcoming environment where clients of all levels feel encouraged and challenged.
        </Text>
        <Text style={styles.bioText}>
          The amazing and proven health benefits of Classical Pilates is at the core of the Love Pilates fitness philosophy. Whether you're a complete beginner or an experienced practitioner, Karen and her team will guide you through a programme that suits your individual needs.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Studio Details</Text>
        <InfoCard
          icon={<MapPin size={20} color={Colors.primary} />}
          title="Location"
          subtitle="18A Crossveggate, Milngavie, G62 6RA"
        />
        <InfoCard
          icon={<Users size={20} color={Colors.primary} />}
          title="Small Classes"
          subtitle="Personalised attention in every session"
        />
        <InfoCard
          icon={<Clock size={20} color={Colors.primary} />}
          title="Class Duration"
          subtitle="Morning and evening classes available"
        />
        <InfoCard
          icon={<Globe size={20} color={Colors.primary} />}
          title="Visit Our Website"
          subtitle="www.karenwoodpilates.com"
          onPress={openWebsite}
        />
        <InfoCard
          icon={<Phone size={20} color={Colors.primary} />}
          title="Phone"
          subtitle="07764 359760"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openUrl('tel:07764359760');
          }}
        />
        <InfoCard
          icon={<Mail size={20} color={Colors.primary} />}
          title="Email"
          subtitle="support@karenwoodpilates.co.uk"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openUrl('mailto:support@karenwoodpilates.co.uk');
          }}
        />
        <InfoCard
          icon={<Instagram size={20} color={Colors.primary} />}
          title="Instagram"
          subtitle="@lovepilatesglasgow"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openUrl('https://www.instagram.com/lovepilatesglasgow');
          }}
        />
        <InfoCard
          icon={<Calendar size={20} color={Colors.primary} />}
          title="Book Online"
          subtitle="bookwhen.com/karenwoodpilates"
          onPress={openBooking}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What Our Members Say</Text>
        {[
          { quote: "From the first time I stepped into Karen's Pilates Studio almost a year ago, I've been so impressed with the quality of the tuition, the friendliness of the instructors and the variety of classes.", author: "Claire" },
          { quote: "I've been going to Love Pilates classes for many years and I still enjoy each class as much as the first one. It is not only a great way to build and keep core strength and flexibility but the class is also great fun and very friendly.", author: "Pauline" },
          { quote: "I can honestly say they are the friendliest fitness classes I have ever been to! First class tuition.", author: "Lesley" },
          { quote: "I usually arrive at Love Pilates feeling harassed, stiff and inflexible and leave feeling like a new woman!", author: "Mandy" },
          { quote: "Pilates has changed my life! It has made me more flexible and aware of my body. Strengthening my back and core I now have better posture and don't suffer from lower back pain anymore.", author: "Heather" },
        ].map((t, i) => (
          <View key={i} style={styles.testimonialCard}>
            <Text style={styles.quoteText}>"{t.quote}"</Text>
            <Text style={styles.quoteAuthor}>— {t.author}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={openBooking}
        style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaText}>Book a Class</Text>
      </Pressable>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Heart size={16} color={Colors.primary} fill={Colors.primary} />
        <Text style={styles.footerText}>Love Pilates — Classical Pilates in Milngavie</Text>
      </View>
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
  heroSection: {
    padding: 20,
    paddingTop: 24,
  },
  awardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '12',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 16,
  },
  awardText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  heroBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  karenPhotoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  karenPhoto: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },
  karenOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  karenName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  karenRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500' as const,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bioText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    gap: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  infoCardPressed: {
    opacity: 0.7,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  testimonialCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryLight,
  },
  quoteText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textLight,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
