export type ClassType = 'Mat' | 'Reformer' | 'Tower' | 'Wunda Chair';

export type ClassLevel = 'Beginners' | 'Intermediate' | 'Transition' | 'Advanced';

export interface PilatesClass {
  id: string;
  title: string;
  date: string;
  dayOfWeek: string;
  time: string;
  classType: ClassType;
  level: ClassLevel;
  duration: number;
  spotsLeft: number;
  totalSpots: number;
  instructor: string;
  membersOnly: boolean;
  bookwhenEventId?: string;
  bookingUrl?: string;
  cancelled?: boolean;
  cancellationMessage?: string;
}

export interface ClassTypeInfo {
  type: ClassType;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  imageUrl: string;
}

export interface PricingOption {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted: boolean;
}
