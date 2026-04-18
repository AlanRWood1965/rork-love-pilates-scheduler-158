import AsyncStorage from '@react-native-async-storage/async-storage';
import { PilatesClass, ClassType, ClassLevel } from '@/types';

const CACHE_KEY = 'bookwhen_events_cache';

const API_BASE = 'https://api.bookwhen.com/v2';
const API_KEY = process.env.EXPO_PUBLIC_BOOKWHEN_API_KEY ?? '';
const CALENDAR_SLUG = 'karenwoodpilates';

interface BookwhenEventAttributes {
  title: string;
  start_at: string;
  end_at: string;
  attendee_limit: number | null;
  attendee_count: number;
  waiting_list: boolean;
  details: string;
  all_day: boolean;
  max_tickets_per_booking: number | null;
  cancelled_at: string | null;
  cancellation_message: string | null;
}

interface BookwhenTicketAttributes {
  number_available: number | null;
  number_taken: number;
  title: string;
  group_ticket: boolean;
  available_from: string | null;
  available_to: string | null;
}

interface BookwhenEvent {
  id: string;
  type: string;
  attributes: BookwhenEventAttributes;
  relationships?: {
    tickets?: {
      data: Array<{ id: string; type: string }>;
    };
  };
}

interface BookwhenIncluded {
  id: string;
  type: string;
  attributes: BookwhenTicketAttributes;
}

interface BookwhenResponse {
  data: BookwhenEvent[];
  included?: BookwhenIncluded[];
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function parseClassType(title: string): ClassType {
  const lower = title.toLowerCase();
  if (lower.includes('reformer')) return 'Reformer';
  if (lower.includes('tower')) return 'Tower';
  if (lower.includes('wunda') || lower.includes('chair')) return 'Wunda Chair';
  return 'Mat';
}

function parseClassLevel(title: string): ClassLevel {
  const lower = title.toLowerCase();
  if (lower.includes('beginner')) return 'Beginners';
  if (lower.includes('advanced')) return 'Advanced';
  if (lower.includes('transition')) return 'Transition';
  return 'Intermediate';
}

function getBookingUrl(eventId: string): string {
  return `https://bookwhen.com/${CALENDAR_SLUG}/e/${eventId}`;
}

async function fetchAllPages(baseUrl: string, authHeader: string): Promise<{ allEvents: BookwhenEvent[]; allIncluded: BookwhenIncluded[] }> {
  const allEvents: BookwhenEvent[] = [];
  const allIncluded: BookwhenIncluded[] = [];
  let url: string | null = baseUrl;
  let pageCount = 0;
  const MAX_PAGES = 2;

  while (url && pageCount < MAX_PAGES) {
    pageCount++;
    console.log(`[BookWhen] Fetching page ${pageCount}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[BookWhen] API error:', response.status, errorText);
      throw new Error(`BookWhen API error: ${response.status}`);
    }

    const json: BookwhenResponse = await response.json();

    allEvents.push(...json.data);
    if (json.included) {
      allIncluded.push(...json.included);
    }

    url = json.links?.next ?? null;
  }

  console.log(`[BookWhen] Total: ${allEvents.length} events, ${pageCount} pages`);
  return { allEvents, allIncluded };
}

async function setCachedEvents(data: PilatesClass[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    console.log('[BookWhen] Cached', data.length, 'events');
  } catch (e) {
    console.log('[BookWhen] Cache write error:', e);
  }
}

export async function getCachedEventsForInitialData(): Promise<PilatesClass[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data } = JSON.parse(raw) as { data: PilatesClass[]; timestamp: number };
    return data;
  } catch {
    return null;
  }
}

export async function fetchBookwhenEvents(daysAhead: number = 30): Promise<PilatesClass[]> {
  const now = new Date();
  const fromDate = formatDate(now);
  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() + daysAhead);
  const toStr = formatDate(toDate);

  const authHeader = 'Basic ' + btoa(API_KEY + ':');
  const baseUrl = `${API_BASE}/events?filter[from]=${fromDate}&filter[to]=${toStr}&include=tickets&page[size]=100`;

  console.log('[BookWhen] Fetching events:', fromDate, '->', toStr);

  const { allEvents, allIncluded } = await fetchAllPages(baseUrl, authHeader);

  const ticketMap = new Map<string, BookwhenIncluded>();
  for (const item of allIncluded) {
    if (item.type === 'ticket') {
      ticketMap.set(item.id, item);
    }
  }


  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const classes: PilatesClass[] = allEvents.map((event) => {
    const startDate = new Date(event.attributes.start_at);
    const endDate = new Date(event.attributes.end_at);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMins = Math.round(durationMs / 60000);

    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const hours = String(startDate.getHours()).padStart(2, '0');
    const minutes = String(startDate.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const title = event.attributes.title ?? '';
    const attendeeLimit = event.attributes.attendee_limit;
    const attendeeCount = event.attributes.attendee_count ?? 0;

    let totalSpots = attendeeLimit ?? 0;
    let spotsLeft = Math.max(0, totalSpots - attendeeCount);

    const ticketRefs = event.relationships?.tickets?.data ?? [];
    if (ticketRefs.length > 0) {
      let ticketTotal = 0;
      let ticketTaken = 0;
      let hasTicketData = false;

      for (const ref of ticketRefs) {
        const ticket = ticketMap.get(ref.id);
        if (ticket) {
          hasTicketData = true;
          const available = ticket.attributes.number_available;
          const taken = ticket.attributes.number_taken ?? 0;
          ticketTaken += taken;
          if (available !== null) {
            ticketTotal += available;
          }

        }
      }

      if (hasTicketData && ticketTotal > 0) {
        totalSpots = ticketTotal;
        spotsLeft = Math.max(0, ticketTotal - ticketTaken);
      }
    }

    if (totalSpots === 0) {
      totalSpots = attendeeLimit ?? 4;
      spotsLeft = Math.max(0, totalSpots - attendeeCount);
    }

    const isCancelled = event.attributes.cancelled_at !== null;
    const cancellationMessage = event.attributes.cancellation_message ?? undefined;

    return {
      id: event.id,
      title,
      date: dateStr,
      dayOfWeek: dayNames[startDate.getDay()],
      time: timeStr,
      classType: parseClassType(title),
      level: parseClassLevel(title),
      duration: durationMins || 45,
      spotsLeft,
      totalSpots,
      instructor: 'Karen',
      membersOnly: false,
      bookwhenEventId: event.id,
      bookingUrl: getBookingUrl(event.id),
      cancelled: isCancelled,
      cancellationMessage,
    };
  });

  classes.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.time.localeCompare(b.time);
  });

  void setCachedEvents(classes);

  return classes;
}

export function getDirectBookingUrl(pilatesClass: PilatesClass): string {
  if (pilatesClass.bookingUrl) {
    return pilatesClass.bookingUrl;
  }
  if (pilatesClass.bookwhenEventId) {
    return getBookingUrl(pilatesClass.bookwhenEventId);
  }
  return `https://bookwhen.com/${CALENDAR_SLUG}`;
}
