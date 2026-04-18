import { PilatesClass, ClassTypeInfo, PricingOption } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function getNextDays(count: number): { date: string; dayOfWeek: string }[] {
  const days: { date: string; dayOfWeek: string }[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push({
      date: `${year}-${month}-${day}`,
      dayOfWeek: dayNames[d.getDay()],
    });
  }
  return days;
}

const classTemplates: Omit<PilatesClass, 'id' | 'date' | 'dayOfWeek'>[] = [
  { title: 'Wunda Chair Intermediate', time: '09:15', classType: 'Wunda Chair', level: 'Intermediate', duration: 45, spotsLeft: 3, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Reformer Intermediate', time: '09:30', classType: 'Reformer', level: 'Intermediate', duration: 45, spotsLeft: 2, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Reformer Intermediate', time: '09:45', classType: 'Reformer', level: 'Intermediate', duration: 45, spotsLeft: 1, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Reformer Transition', time: '10:15', classType: 'Reformer', level: 'Transition', duration: 45, spotsLeft: 4, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Mat Intermediate', time: '10:30', classType: 'Mat', level: 'Intermediate', duration: 45, spotsLeft: 6, totalSpots: 8, instructor: 'Karen', membersOnly: false },
  { title: 'Tower Intermediate', time: '17:30', classType: 'Tower', level: 'Intermediate', duration: 45, spotsLeft: 2, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Mat Beginners', time: '18:00', classType: 'Mat', level: 'Beginners', duration: 45, spotsLeft: 5, totalSpots: 8, instructor: 'Karen', membersOnly: false },
  { title: 'Reformer Beginners', time: '18:00', classType: 'Reformer', level: 'Beginners', duration: 45, spotsLeft: 3, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Reformer Intermediate', time: '18:15', classType: 'Reformer', level: 'Intermediate', duration: 45, spotsLeft: 1, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Tower Transition', time: '18:15', classType: 'Tower', level: 'Transition', duration: 45, spotsLeft: 3, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Mat Intermediate', time: '18:45', classType: 'Mat', level: 'Intermediate', duration: 45, spotsLeft: 4, totalSpots: 8, instructor: 'Karen', membersOnly: false },
  { title: 'Reformer Intermediate', time: '18:45', classType: 'Reformer', level: 'Intermediate', duration: 45, spotsLeft: 0, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Tower Beginners', time: '19:00', classType: 'Tower', level: 'Beginners', duration: 45, spotsLeft: 4, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Reformer Advanced', time: '19:30', classType: 'Reformer', level: 'Advanced', duration: 45, spotsLeft: 2, totalSpots: 4, instructor: 'Karen', membersOnly: false },
  { title: 'Mat Advanced', time: '09:30', classType: 'Mat', level: 'Advanced', duration: 45, spotsLeft: 3, totalSpots: 8, instructor: 'Karen', membersOnly: false },
  { title: 'Tower Advanced', time: '10:15', classType: 'Tower', level: 'Advanced', duration: 45, spotsLeft: 2, totalSpots: 4, instructor: 'Karen', membersOnly: false },
];

const dayScheduleMap: Record<string, number[]> = {
  Monday: [6, 7, 10, 11, 13],
  Tuesday: [6, 7, 10, 11, 4, 14],
  Wednesday: [1, 3, 5, 8, 9, 12, 15],
  Thursday: [0, 2, 4, 6, 7, 10, 13],
  Friday: [1, 3, 4, 6],
  Saturday: [1, 4, 6, 12, 14],
  Sunday: [],
};

export function generateSchedule(): PilatesClass[] {
  const days = getNextDays(30);
  const classes: PilatesClass[] = [];

  for (const day of days) {
    const templateIndices = dayScheduleMap[day.dayOfWeek] ?? [];
    for (const idx of templateIndices) {
      const template = classTemplates[idx];
      if (template) {
        const spotsVariation = Math.max(0, template.spotsLeft + Math.floor(Math.random() * 3) - 1);
        classes.push({
          ...template,
          id: generateId(),
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          spotsLeft: Math.min(spotsVariation, template.totalSpots),
        });
      }
    }
  }

  return classes;
}

export const classTypeInfos: ClassTypeInfo[] = [
  {
    type: 'Mat',
    title: 'Mat Pilates',
    subtitle: 'The foundation of Pilates',
    description: 'Mat Pilates is performed on the floor using a mat. It focuses on core strength, flexibility, and body awareness using your own body weight as resistance. This is where Joseph Pilates began, and it remains the heart of the Pilates method.',
    benefits: [
      'Build core strength and stability',
      'Improve flexibility and posture',
      'No equipment needed — just you and a mat',
      'Perfect starting point for beginners',
      'Develop body awareness and control',
    ],
    imageUrl: 'https://images.squarespace-cdn.com/content/v1/57e3fa8a8419c27908c50029/1624709603650-RPM78JP6ZHNDFJMA8KXB/Amy+Laughing.jpg',
  },
  {
    type: 'Reformer',
    title: 'Reformer Pilates',
    subtitle: 'Dynamic resistance training',
    description: 'The Reformer is a versatile piece of apparatus that uses springs for resistance. It allows for a wide variety of exercises that challenge the body in multiple planes of movement. The adjustable resistance makes it suitable for all levels.',
    benefits: [
      'Variable spring resistance for all levels',
      'Full-body workout with targeted muscle focus',
      'Improved alignment and joint mobility',
      'Excellent for rehabilitation',
      'Smooth, flowing movements',
    ],
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/v6b0q99tbvjxjvtvf94lz.png',
  },
  {
    type: 'Tower',
    title: 'Tower Pilates',
    subtitle: 'Vertical spring work',
    description: 'The Tower (or Wall Unit) combines elements of the Cadillac and Reformer. It uses vertical springs and a push-through bar to create unique exercises that challenge balance, strength, and flexibility in standing and lying positions.',
    benefits: [
      'Unique vertical spring resistance',
      'Excellent for spinal articulation',
      'Combines standing and floor exercises',
      'Great for stretching and strengthening',
      'Deepens your Pilates practice',
    ],
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/nddwiloo12588jvs60a4g.png',
  },
  {
    type: 'Wunda Chair',
    title: 'Wunda Chair Pilates',
    subtitle: 'Compact powerhouse',
    description: 'The Wunda Chair is a compact but incredibly challenging piece of apparatus. Its spring-loaded pedal creates resistance that demands precise control and deep stabiliser activation. It\'s excellent for building functional strength.',
    benefits: [
      'Intense core challenge',
      'Builds functional strength and balance',
      'Engages deep stabiliser muscles',
      'Compact format, powerful results',
      'Advanced progression from Mat and Reformer',
    ],
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/atqosgkbqfuax3bxmxdjq.png',
  },
];

export const dropInPricing = [
  { id: 'dropin-reformer', name: 'Reformer Pilates', price: '£25' },
  { id: 'dropin-wunda', name: 'Wunda Chair', price: '£25' },
  { id: 'dropin-tower', name: 'Tower Pilates', price: '£25' },
  { id: 'dropin-mat', name: 'Mat Pilates', price: '£12' },
];

export const pricingOptions: PricingOption[] = [
  {
    id: '1',
    name: 'Monthly Membership',
    price: '£120/mo',
    description: 'Unlimited access to every class on our timetable',
    features: [
      'Unlimited classes each month',
      'All Reformer, Tower & Chair classes included',
      'Full timetable access',
      'Subject to one month notice of cancellation',
    ],
    highlighted: true,
  },
  {
    id: '2',
    name: '3 Month Membership',
    price: '£351',
    description: 'Commit to 3 months of unlimited classes and save',
    features: [
      'Unlimited classes for 3 months',
      'Works out at £117/month',
      'All class types included',
      'Full timetable access',
    ],
    highlighted: true,
  },
];
