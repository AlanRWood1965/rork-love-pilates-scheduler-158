import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Mail,
  User as UserIcon,
  Phone,
  MessageSquare,
  ChevronDown,
  Send,
  Check,
  X,
  Heart,
  Home,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as MailComposer from 'expo-mail-composer';
import { router } from 'expo-router';

import Colors from '@/constants/colors';

const STUDIO_EMAIL = 'support@karenwoodpilates.co.uk';

type EnquiryType =
  | 'General Enquiry'
  | 'Class Information'
  | 'Membership'
  | 'Private Sessions';

const ENQUIRY_TYPES: EnquiryType[] = [
  'General Enquiry',
  'Class Information',
  'Membership',
  'Private Sessions',
];

type FieldErrors = {
  name?: string;
  email?: string;
  message?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ContactScreen() {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [enquiryType, setEnquiryType] = useState<EnquiryType>('General Enquiry');
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const successAnim = useRef(new Animated.Value(0)).current;

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setEnquiryType('General Enquiry');
    setErrors({});
  }, []);

  const showSuccess = useCallback(() => {
    setSent(true);
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSent(false);
    });
  }, [successAnim]);

  const validate = useCallback((): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Please enter your name';
    if (!email.trim()) next.email = 'Please enter your email';
    else if (!isValidEmail(email)) next.email = 'Please enter a valid email';
    if (!message.trim()) next.message = 'Please enter a message';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, email, message]);

  const buildBody = useCallback(() => {
    return (
      `Enquiry Type: ${enquiryType}\n\n` +
      `Name: ${name.trim()}\n` +
      `Email: ${email.trim()}\n` +
      `Phone: ${phone.trim() || 'Not provided'}\n\n` +
      `Message:\n${message.trim()}\n`
    );
  }, [enquiryType, name, email, phone, message]);

  const handleSend = useCallback(async () => {
    if (!validate()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSending(true);
    const subject = `Love Pilates — ${enquiryType}`;
    const body = buildBody();

    try {
      if (Platform.OS === 'web') {
        const mailto = `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        if (typeof window !== 'undefined') {
          window.location.href = mailto;
        } else {
          await Linking.openURL(mailto);
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        resetForm();
        showSuccess();
        return;
      }

      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        const mailto = `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        const canOpen = await Linking.canOpenURL(mailto);
        if (canOpen) {
          await Linking.openURL(mailto);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          resetForm();
          showSuccess();
        } else {
          Alert.alert(
            'No Email App Found',
            `Please email us directly at ${STUDIO_EMAIL}`,
          );
        }
        return;
      }

      const result = await MailComposer.composeAsync({
        recipients: [STUDIO_EMAIL],
        subject,
        body,
      });

      console.log('[Contact] MailComposer result:', result.status);

      if (result.status === MailComposer.MailComposerStatus.SENT) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        resetForm();
        showSuccess();
      } else if (result.status === MailComposer.MailComposerStatus.SAVED) {
        Alert.alert('Draft Saved', 'Your enquiry has been saved as a draft.');
      } else if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
        console.log('[Contact] User cancelled');
      }
    } catch (err) {
      console.error('[Contact] Failed to send:', err);
      Alert.alert(
        'Could Not Send',
        `Please try again, or email us directly at ${STUDIO_EMAIL}`,
      );
    } finally {
      setIsSending(false);
    }
  }, [validate, enquiryType, buildBody, resetForm, showSuccess]);

  const successStyle = useMemo(() => {
    return {
      opacity: successAnim,
      transform: [
        {
          translateY: successAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-12, 0],
          }),
        },
      ],
    };
  }, [successAnim]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              router.push('/(tabs)/schedule');
            }}
            style={({ pressed }) => [
              styles.homeButton,
              { top: insets.top + 12 },
              pressed && styles.homeButtonPressed,
            ]}
            hitSlop={10}
            testID="contact-home-button"
            accessibilityLabel="Go to home"
          >
            <Home size={20} color={Colors.primary} />
          </Pressable>
          <Image
            source={{
              uri: 'https://images.squarespace-cdn.com/content/v1/57e3fa8a8419c27908c50029/1591362699002-6V9CEY6UUQ3WDF8TDH6S/LP+Heart+Design+Jan+18.png?format=500w',
            }}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <Text style={styles.headerTitle}>Contact</Text>
          <Text style={styles.headerSubtitle}>
            Send us an enquiry — we&apos;d love to hear from you
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Your Name</Text>
            <View
              style={[
                styles.inputWrap,
                errors.name && styles.inputWrapError,
              ]}
            >
              <UserIcon size={18} color={Colors.primary} />
              <TextInput
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                }}
                placeholder="Jane Smith"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
                testID="contact-name-input"
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[
                styles.inputWrap,
                errors.email && styles.inputWrapError,
              ]}
            >
              <Mail size={18} color={Colors.primary} />
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                }}
                placeholder="jane@example.com"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                testID="contact-email-input"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Phone <Text style={styles.optional}>(optional)</Text>
            </Text>
            <View style={styles.inputWrap}>
              <Phone size={18} color={Colors.primary} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="07123 456789"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                keyboardType="phone-pad"
                returnKeyType="next"
                testID="contact-phone-input"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Enquiry Type</Text>
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setPickerOpen((o) => !o);
              }}
              style={({ pressed }) => [
                styles.pickerButton,
                pressed && styles.pickerButtonPressed,
                pickerOpen && styles.pickerButtonActive,
              ]}
              testID="contact-enquiry-picker"
            >
              <Text style={styles.pickerValue}>{enquiryType}</Text>
              <ChevronDown
                size={18}
                color={Colors.textSecondary}
                style={pickerOpen ? styles.chevronOpen : undefined}
              />
            </Pressable>
            {pickerOpen && (
              <View style={styles.pickerList}>
                {ENQUIRY_TYPES.map((option, idx) => {
                  const selected = option === enquiryType;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setEnquiryType(option);
                        setPickerOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.pickerOption,
                        idx < ENQUIRY_TYPES.length - 1 && styles.pickerOptionDivider,
                        pressed && styles.pickerOptionPressed,
                        selected && styles.pickerOptionSelected,
                      ]}
                      testID={`contact-enquiry-option-${idx}`}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          selected && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                      {selected && <Check size={16} color={Colors.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Message</Text>
            <View
              style={[
                styles.inputWrap,
                styles.textAreaWrap,
                errors.message && styles.inputWrapError,
              ]}
            >
              <MessageSquare size={18} color={Colors.primary} style={styles.textAreaIcon} />
              <TextInput
                value={message}
                onChangeText={(t) => {
                  setMessage(t);
                  if (errors.message) setErrors((e) => ({ ...e, message: undefined }));
                }}
                placeholder="Tell us how we can help..."
                placeholderTextColor={Colors.textMuted}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                testID="contact-message-input"
              />
            </View>
            {errors.message && (
              <Text style={styles.errorText}>{errors.message}</Text>
            )}
          </View>

          <Pressable
            onPress={handleSend}
            disabled={isSending}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitPressed,
              isSending && styles.submitDisabled,
            ]}
            testID="contact-send-button"
          >
            <Send size={18} color={Colors.textLight} />
            <Text style={styles.submitText}>
              {isSending ? 'Opening Email…' : 'Send Enquiry'}
            </Text>
          </Pressable>

          <Text style={styles.hintText}>
            Tapping send will open your email app with the details pre-filled.
          </Text>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Heart size={14} color={Colors.primary} fill={Colors.primary} />
          <Text style={styles.footerText}>
            Love Pilates — We reply within 1–2 working days
          </Text>
        </View>
      </ScrollView>

      {sent && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { top: insets.top + 16 },
            successStyle,
          ]}
        >
          <View style={styles.toastIcon}>
            <Check size={16} color={Colors.textLight} />
          </View>
          <View style={styles.toastTextWrap}>
            <Text style={styles.toastTitle}>Enquiry ready to send</Text>
            <Text style={styles.toastBody}>
              Finish sending it from your email app.
            </Text>
          </View>
          <Pressable
            onPress={() => setSent(false)}
            hitSlop={8}
            style={styles.toastClose}
          >
            <X size={14} color={Colors.textMuted} />
          </Pressable>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  homeButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    zIndex: 2,
  },
  homeButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
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
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  optional: {
    color: Colors.textMuted,
    fontWeight: '400' as const,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: Platform.OS === 'android' ? 6 : 0,
  },
  textAreaWrap: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 0,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerButtonPressed: {
    opacity: 0.8,
  },
  pickerButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0D',
  },
  pickerValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  pickerList: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pickerOptionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerOptionPressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primary + '0F',
  },
  pickerOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  pickerOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitPressed: {
    opacity: 0.88,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textLight,
    letterSpacing: 0.3,
  },
  hintText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 18,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toastIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTextWrap: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  toastBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  toastClose: {
    padding: 4,
  },
});
