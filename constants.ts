import { TopicOption } from "./types";

export const TOPICS: TopicOption[] = [
  { 
    id: 'daily', 
    label: 'Daily Life', 
    icon: '☕', 
    promptContext: 'common daily life objects, actions, and greetings in Taiwan/Traditional Chinese context' 
  },
  { 
    id: 'business', 
    label: 'Business', 
    icon: '💼', 
    promptContext: 'professional business terminology, office interactions, and corporate emails' 
  },
  { 
    id: 'travel', 
    label: 'Travel', 
    icon: '✈️', 
    promptContext: 'airport, hotel, asking for directions, and tourism related vocabulary' 
  },
  { 
    id: 'tech', 
    label: 'Technology', 
    icon: '💻', 
    promptContext: 'computer, internet, programming, and modern gadget terminology' 
  },
  { 
    id: 'food', 
    label: 'Food & Dining', 
    icon: '🍜', 
    promptContext: 'ingredients, ordering food, taste descriptions, and popular dishes' 
  },
  { 
    id: 'idioms', 
    label: 'Idioms (Advanced)', 
    icon: '🐉', 
    promptContext: 'common four-character Chinese idioms (Cheng-yu) translated to English equivalents' 
  }
];

export const SAMPLE_DATA = [
  { chinese: "你好", english: "hello" },
  { chinese: "世界", english: "world" },
  { chinese: "電腦", english: "computer" },
  { chinese: "學習", english: "learn" },
  { chinese: "遊戲", english: "game" },
];
