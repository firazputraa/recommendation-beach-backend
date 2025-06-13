// ./app/beach/dto.ts (Example - adjust based on your actual DTOs)

export interface BeachRecommendation {
  placeId: string;
  score: number;
  place_name: string | null;
  rating: number | null;
  featured_image: string | null; // Changed from string[] | null to string | null
}

export interface BeachDetail {
  placeId: string;
  place_name: string;
  description: string | null;
  rating: number;
  reviews: number;
  sentimentSummary: {
    positive: number;
    negative: number;
    neutral: number;
  };
  featured_image: string | null; // Changed from string[] | null to string | null
  address: string | null;
  review_keywords: string | null;
  link: string | null;
  coordinates: string | null;
}

export interface SelectedBeachDetailsForRecommendation {
  place_Id: string;
  place_name: string;
  rating: number;
  featured_image: string[]; // This should match Prisma's output
}

export interface BeachQueryResult {
  place_Id: string;
  place_name: string;
  description: string | null;
  reviews: number;
  rating: number;
  featured_image: string[]; // This must be string[] as per Prisma model
  address: string | null;
  review_keywords: string | null;
  link: string | null;
  coordinates: string | null;
  positiveSentimentCount: number;
  negativeSentimentCount: number;
  neutralSentimentCount: number;
}

export interface NearbyBeachDetail {
  placeId: string;
  place_name: string;
  description: string | null;
  rating: number;
  reviews: number;
  sentimentSummary: {
    positive: number;
    negative: number;
    neutral: number;
  };
  featured_image: string | null; // Changed from string[] | null to string | null
  address: string | null;
  review_keywords: string | null;
  link: string | null;
  coordinates: string | null;
  distance: number;
}

export interface NearbyBeachDetail extends BeachDetail {
  distance: number; // Jarak dalam kilometer
}
export interface PreferenceInput {
  preference_text: string;
}