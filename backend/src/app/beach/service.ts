// ./app/beach/service.ts
import { PrismaClient } from "@prisma/client";
import { BadRequestError } from "../../error/BadRequestError"; // Sesuaikan path jika perlu
import axios from "axios";
import {
  BeachRecommendation,
  BeachDetail,
  SelectedBeachDetailsForRecommendation,
  BeachQueryResult, // Assuming this is defined in your dto.ts based on Prisma output
  NearbyBeachDetail,
} from "./dto"; // Pastikan semua DTO di-import

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001"; // URL service ML Anda
const prisma = new PrismaClient();

// --- Helper function to calculate distance (Haversine formula) ---
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2)); // Jarak dalam kilometer dengan 2 desimal
}
// --- End Helper Function ---

const calculatePercentage = (count: number, total: number) => {
  return total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0;
};

// --- FUNGSI BARU UNTUK REKOMENDASI DARI ML SERVICE (/recommend-beach) ---
export const getBeachRecommendations = async (
  preferenceText: string,
  userId: string | null = null // Tambahkan parameter userId
): Promise<BeachRecommendation[]> => {
  let recommendations: BeachRecommendation[] = [];
  try {
    const payload: { preference_text: string; user_id?: string } = {
      preference_text: preferenceText,
    };
    if (userId) {
      payload.user_id = userId;
    }

    const response = await axios.post(
      `${ML_SERVICE_URL}/recommend-beach`,
      payload
    );

    if (!response.data || !Array.isArray(response.data.recommendations)) {
      console.error(
        "Invalid recommendations format from ML service:",
        response.data
      );
      throw new Error(
        "Invalid recommendations format from ML service. Expected an object with a 'recommendations' array."
      );
    }
    const mlRecommendations: { placeId: string; score: number }[] =
      response.data.recommendations;

    const recommendedPlaceIds = mlRecommendations.map((rec) => rec.placeId);
    if (recommendedPlaceIds.length === 0) {
      return [];
    }

    // Ambil detail tambahan dari database berdasarkan placeId
    const beachesDetails = await prisma.beach.findMany({
      where: {
        place_Id: {
          in: recommendedPlaceIds,
        },
      },
      select: {
        place_Id: true,
        place_name: true,
        rating: true,
        featured_image: true, // Tambahkan ini jika ingin ditampilkan
      },
    });

    // Gabungkan data dari ML service dengan detail dari database
    recommendations = mlRecommendations
      .map((mlRec) => {
        const beachDetail = beachesDetails.find(
          (b) => b.place_Id === mlRec.placeId
        );
        return {
          placeId: mlRec.placeId,
          score: mlRec.score,
          place_name: beachDetail?.place_name || null, // Tambahkan null default
          rating: beachDetail?.rating || null, // Tambahkan null default
          featured_image: beachDetail?.featured_image?.[0] || null, // Access the first element or null
        };
      })
      .sort((a, b) => b.score - a.score); // Urutkan berdasarkan skor dari ML service
  } catch (error: any) {
    console.error(
      "Error calling ML recommendation service or processing results:",
      error.response?.data || error.message || error
    );
    if (axios.isAxiosError(error)) {
      throw new BadRequestError(
        `Failed to get recommendations. ML service communication error: ${error.message}`
      );
    }
    throw new BadRequestError(
      `Failed to get recommendations. ML service might be down, misconfigured, or returned unexpected data. Original error: ${error.message}`
    );
  }
  return recommendations;
};

// --- FUNGSI BARU UNTUK SEARCH DARI ML SERVICE (/search-point) ---
export const searchBeachesFromML = async (
  keyword: string | undefined,
  top_n: number
): Promise<BeachDetail[]> => {
  if (!keyword || keyword.trim() === "") {
    return []; // Jika keyword kosong, kembalikan array kosong
  }

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/search-point`, {
      query: keyword,
      top_n: top_n,
    });

    if (!response.data || !Array.isArray(response.data.recommendations)) {
      console.error(
        "Invalid search results format from ML service:",
        response.data
      );
      throw new Error(
        "Invalid search results format from ML service. Expected an object with a 'recommendations' array."
      );
    }

    const mlSearchResults: {
      placeId: string;
      similarity_score: number;
      place_name: string; // ML service sudah mengembalikan ini
      description: string; // ML service sudah mengembalikan ini
      rating: number; // ML service sudah mengembalikan ini
      featured_image: string; // ML service sudah mengembalikan ini
    }[] = response.data.recommendations;

    // Filter out recommendations that might not have a placeId
    const validMlResults = mlSearchResults.filter((item) => item.placeId);

    if (validMlResults.length === 0) {
      return []; // Tidak ada hasil yang valid dari ML
    }

    // Ambil detail tambahan (misal: sentiment summary, address, review_keywords, link, coordinates) dari database
    const placeIdsToFetch = validMlResults.map((rec) => rec.placeId);
    const beachesDetailsFromDB = await prisma.beach.findMany({
      where: {
        place_Id: {
          in: placeIdsToFetch,
        },
      },
      select: {
        place_Id: true,
        address: true,
        reviews: true,
        review_keywords: true,
        link: true,
        coordinates: true,
        positiveSentimentCount: true,
        negativeSentimentCount: true,
        neutralSentimentCount: true,
        featured_image: true, // Include featured_image from DB to match BeachQueryResult
      },
    });

    const detailedBeaches: BeachDetail[] = validMlResults
      .map((mlRec) => {
        const dbDetail = beachesDetailsFromDB.find(
          (db) => db.place_Id === mlRec.placeId
        );

        const totalSentimentCount =
          (dbDetail?.positiveSentimentCount || 0) +
          (dbDetail?.negativeSentimentCount || 0) +
          (dbDetail?.neutralSentimentCount || 0);

        const sentimentSummary = {
          positive: calculatePercentage(
            dbDetail?.positiveSentimentCount || 0,
            totalSentimentCount
          ),
          negative: calculatePercentage(
            dbDetail?.negativeSentimentCount || 0,
            totalSentimentCount
          ),
          neutral: calculatePercentage(
            dbDetail?.neutralSentimentCount || 0,
            totalSentimentCount
          ),
        };

        return {
          placeId: mlRec.placeId,
          place_name: mlRec.place_name,
          description: mlRec.description,
          rating: mlRec.rating,
          featured_image: mlRec.featured_image || null, // ML service sends a single string
          reviews: dbDetail?.reviews || 0, // Ambil dari DB
          sentimentSummary: sentimentSummary,
          address: dbDetail?.address || null,
          review_keywords: dbDetail?.review_keywords || null,
          link: dbDetail?.link || null,
          coordinates: dbDetail?.coordinates || null,
        };
      })
      .sort(
        (a, b) =>
          (mlSearchResults.find((item) => item.placeId === a.placeId)
            ?.similarity_score || 0) -
          (mlSearchResults.find((item) => item.placeId === b.placeId)
            ?.similarity_score || 0)
      ); // Sort back by similarity score

    return detailedBeaches;
  } catch (error: any) {
    console.error(
      "Error calling ML search service or processing results:",
      error.response?.data || error.message || error
    );
    if (axios.isAxiosError(error)) {
      throw new BadRequestError(
        `Failed to get search results. ML service communication error: ${error.message}`
      );
    }
    throw new BadRequestError(
      `Failed to get search results. ML service might be down, misconfigured, or returned unexpected data. Original error: ${error.message}`
    );
  }
};

// --- FUNGSI UNTUK MENDAPATKAN DETAIL SATU PANTAI (tetap dari DB) ---
export const getBeachDetails = async (
  placeId: string
): Promise<BeachDetail | null> => {
  // Directly use the BeachQueryResult type from Prisma's output structure
  const beach: BeachQueryResult | null = await prisma.beach.findUnique({
    where: { place_Id: placeId },
    select: {
      place_Id: true,
      place_name: true,
      description: true,
      reviews: true,
      rating: true,
      featured_image: true,
      address: true,
      review_keywords: true,
      link: true,
      coordinates: true,
      positiveSentimentCount: true,
      negativeSentimentCount: true,
      neutralSentimentCount: true,
    },
  });

  if (!beach) {
    return null;
  }

  const totalSentimentCount =
    beach.positiveSentimentCount +
    beach.negativeSentimentCount +
    beach.neutralSentimentCount;
  const sentimentSummary = {
    positive: calculatePercentage(
      beach.positiveSentimentCount,
      totalSentimentCount
    ),
    negative: calculatePercentage(
      beach.negativeSentimentCount,
      totalSentimentCount
    ),
    neutral: calculatePercentage(
      beach.neutralSentimentCount,
      totalSentimentCount
    ),
  };
  return {
    placeId: beach.place_Id,
    place_name: beach.place_name,
    description: beach.description,
    rating: beach.rating,
    reviews: beach.reviews,
    sentimentSummary: sentimentSummary,
    featured_image: beach.featured_image[0] || null, // Take the first image if it's an array
    address: beach.address,
    review_keywords: beach.review_keywords,
    link: beach.link,
    coordinates: beach.coordinates,
  };
};

// --- Fungsi baru untuk mencari pantai terdekat (tetap dari DB) ---
export const findNearbyBeaches = async (
  userLat: number,
  userLng: number,
  radiusKm: number,
  limit: number,
  page: number
): Promise<{
  data: NearbyBeachDetail[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}> => {
  const allBeaches: BeachQueryResult[] = await prisma.beach.findMany({
    select: {
      place_Id: true,
      place_name: true,
      description: true,
      reviews: true,
      rating: true,
      featured_image: true,
      address: true,
      review_keywords: true,
      link: true,
      coordinates: true,
      positiveSentimentCount: true,
      negativeSentimentCount: true,
      neutralSentimentCount: true,
    },
  });

  if (!allBeaches || allBeaches.length === 0) {
    return { data: [], totalCount: 0, currentPage: page, totalPages: 0 };
  }

  const nearbyBeachesWithDistance: NearbyBeachDetail[] = [];

  for (const beach of allBeaches) {
    if (beach.coordinates) {
      try {
        const [beachLatStr, beachLngStr] = beach.coordinates.split(",");
        const beachLat = parseFloat(beachLatStr);
        const beachLng = parseFloat(beachLngStr);

        if (isNaN(beachLat) || isNaN(beachLng)) {
          console.warn(
            `Invalid coordinates for beach ${beach.place_name} (${beach.place_Id}): ${beach.coordinates}. Skipping.`
          );
          continue;
        }

        const distance = calculateDistance(
          userLat,
          userLng,
          beachLat,
          beachLng
        );

        if (distance <= radiusKm) {
          const totalSentimentCount =
            beach.positiveSentimentCount +
            beach.negativeSentimentCount +
            beach.neutralSentimentCount;

          const sentimentSummary = {
            positive: calculatePercentage(
              beach.positiveSentimentCount,
              totalSentimentCount
            ),
            negative: calculatePercentage(
              beach.negativeSentimentCount,
              totalSentimentCount
            ),
            neutral: calculatePercentage(
              beach.neutralSentimentCount,
              totalSentimentCount
            ),
          };

          nearbyBeachesWithDistance.push({
            placeId: beach.place_Id,
            place_name: beach.place_name,
            description: beach.description,
            rating: beach.rating,
            reviews: beach.reviews,
            sentimentSummary: sentimentSummary,
            featured_image: beach.featured_image[0] || null, // Take the first image if it's an array
            address: beach.address,
            review_keywords: beach.review_keywords,
            link: beach.link,
            coordinates: beach.coordinates,
            distance: distance, // Jarak sudah di-parseFloat(toFixed(2)) di calculateDistance
          });
        }
      } catch (error) {
        console.error(
          `Error processing coordinates for beach ${beach.place_name} (${beach.place_Id}): ${beach.coordinates}. Error: ${error}. Skipping.`
        );
        continue;
      }
    } else {
      console.warn(
        `Beach ${beach.place_name} (${beach.place_Id}) has no coordinates. Skipping.`
      );
    }
  }

  nearbyBeachesWithDistance.sort((a, b) => a.distance - b.distance);

  const totalCount = nearbyBeachesWithDistance.length;
  const totalPages = Math.ceil(totalCount / limit);
  const skip = (page - 1) * limit;
  const paginatedBeaches = nearbyBeachesWithDistance.slice(skip, skip + limit);

  return {
    data: paginatedBeaches,
    totalCount,
    currentPage: page,
    totalPages,
  };
};