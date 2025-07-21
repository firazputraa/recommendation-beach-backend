// ./app/beach/service.ts

import { Prisma, PrismaClient } from "@prisma/client";
import { BadRequestError } from "../../error/BadRequestError";
import axios from "axios";
import {
  BeachRecommendation,
  BeachDetail,
  NearbyBeachDetail,
  BeachQueryResult, // Pastikan tipe ini sesuai dengan hasil select Prisma Anda
} from "./dto";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://recommendation-beach-machine-learning-production.up.railway.app";
const prisma = new PrismaClient();

// --- Helper Functions (Tetap sama) ---
const calculatePercentage = (count: number, total: number) => {
  return total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0;
};
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// =================================================================================
// --- BAGIAN INTI YANG DIREFAKTORISASI ---
// =================================================================================

/**
 * [BARU] Fungsi terpusat untuk mengambil detail lengkap pantai berdasarkan array ID.
 * Ini adalah solusi untuk masalah "N+1" di sisi frontend.
 */
export const getBeachesByIds = async (
  placeIds: string[]
): Promise<BeachDetail[]> => {
  if (placeIds.length === 0) {
    return [];
  }

  const beaches = await prisma.beach.findMany({
    where: { place_Id: { in: placeIds } },
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

  // Ubah hasil query menjadi format BeachDetail yang konsisten
  return beaches.map((beach) => {
    const totalSentimentCount =
      beach.positiveSentimentCount +
      beach.negativeSentimentCount +
      beach.neutralSentimentCount;

    return {
      placeId: beach.place_Id,
      place_name: beach.place_name,
      description: beach.description,
      rating: beach.rating,
      reviews: beach.reviews,
      sentimentSummary: {
        positive: calculatePercentage(beach.positiveSentimentCount, totalSentimentCount),
        negative: calculatePercentage(beach.negativeSentimentCount, totalSentimentCount),
        neutral: calculatePercentage(beach.neutralSentimentCount, totalSentimentCount),
      },
      featured_image: beach.featured_image[0] || null,
      address: beach.address,
      review_keywords: beach.review_keywords,
      link: beach.link,
      coordinates: beach.coordinates,
    };
  });
};

/**
 * [DIPERBAIKI] Mendapatkan rekomendasi pantai.
 * Alur: Panggil ML untuk ID & skor -> Panggil DB untuk detail lengkap.
 */
export const getBeachRecommendations = async (
  preferenceText: string,
  userId: string | null = null
): Promise<BeachDetail[]> => {
  try {
    // 1. Panggil ML Service untuk mendapatkan daftar ID dan skor
    const payload: { preference_text: string; user_id?: string } = {
      preference_text: preferenceText,
    };
    if (userId) payload.user_id = userId;

    const response = await axios.post(`${ML_SERVICE_URL}/recommend-beach`, payload);
    const mlRecommendations: { placeId: string; score: number }[] = response.data.recommendations;

    if (!mlRecommendations || mlRecommendations.length === 0) return [];
    
    // Buat map skor untuk digabungkan nanti
    const scoreMap = new Map(mlRecommendations.map(rec => [rec.placeId, rec.score]));
    const recommendedPlaceIds = mlRecommendations.map((rec) => rec.placeId);

    // 2. Gunakan fungsi terpusat untuk mengambil detail lengkap dari DB
    const beachesDetails = await getBeachesByIds(recommendedPlaceIds);

    // 3. Gabungkan detail dengan skor dan urutkan
    const finalRecommendations = beachesDetails
      .map((detail) => ({
        ...detail,
        score: scoreMap.get(detail.placeId) || 0, // Tambahkan skor kembali
      }))
      .sort((a, b) => b.score - a.score);

    return finalRecommendations;

  } catch (error: any) {
    console.error("Error in getBeachRecommendations:", error.response?.data || error.message);
    throw new BadRequestError(`Failed to get recommendations. ML service might be down or returned unexpected data.`);
  }
};

/**
 * [DIPERBAIKI] Mencari pantai berdasarkan keyword.
 * Alur: Panggil ML untuk ID & skor -> Panggil DB untuk detail lengkap.
 * Menggunakan GET dan mendukung pagination.
 */
export const searchBeachesFromML = async (
  keyword: string,
  limit: number,
  page: number
): Promise<{ data: BeachDetail[]; totalCount: number }> => {
  try {
    // 1. Panggil ML Service menggunakan GET dan parameter pagination
    const response = await axios.get(`${ML_SERVICE_URL}/search-point`, {
      params: { query: keyword, top_n: limit, page: page }, // Mengirim limit dan page
    });
    
    // Service ML harusnya mengembalikan { recommendations: [...], totalCount: X }
    const mlSearchResults: { placeId: string; similarity_score: number }[] = response.data.recommendations;
    const totalCount = response.data.totalCount || 0;

    if (!mlSearchResults || mlSearchResults.length === 0) return { data: [], totalCount: 0 };
    
    const scoreMap = new Map(mlSearchResults.map(rec => [rec.placeId, rec.similarity_score]));
    const placeIdsToFetch = mlSearchResults.map((rec) => rec.placeId);

    // 2. Gunakan fungsi terpusat untuk mengambil detail lengkap dari DB
    const beachesDetails = await getBeachesByIds(placeIdsToFetch);

    // 3. Gabungkan detail dengan skor dan urutkan
    const finalResults = beachesDetails
        .map((detail) => ({
            ...detail,
            score: scoreMap.get(detail.placeId) || 0,
        }))
        .sort((a, b) => b.score - a.score);

    return { data: finalResults, totalCount: totalCount };

  } catch (error: any) {
    console.error("Error in searchBeachesFromML:", error.response?.data || error.message);
    throw new BadRequestError(`Failed to get search results. ML service might be down or returned unexpected data.`);
  }
};


/**
 * [TETAP] Mendapatkan detail satu pantai. Tidak ada perubahan signifikan.
 */
export const getBeachDetails = async (
  placeId: string
): Promise<BeachDetail | null> => {
  const [beachDetail] = await getBeachesByIds([placeId]); // Manfaatkan fungsi yang sudah ada
  return beachDetail || null;
};

/**
 * [PERFORMA KRITIS DIPERBAIKI] Mencari pantai terdekat menggunakan Raw SQL Query.
 * Jauh lebih cepat dan skalabel daripada memproses di JavaScript.
 */
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
  const offset = (page - 1) * limit;
  const radiusMeters = radiusKm * 1000;

  // CATATAN: Query ini spesifik untuk PostgreSQL dengan PostGIS.
  // Sesuaikan jika Anda menggunakan database lain (misal: MySQL dengan fungsi geospasialnya).
  const nearbyBeachesRaw: (BeachQueryResult & { distance: number })[] =
    await prisma.$queryRaw`
      SELECT 
        "place_Id", "place_name", "description", "reviews", "rating", "featured_image", 
        "address", "review_keywords", "link", "coordinates", "positiveSentimentCount", 
        "negativeSentimentCount", "neutralSentimentCount",
        ST_Distance(
          ST_MakePoint(longitude, latitude),
          ST_MakePoint(${userLng}, ${userLat})::geography
        ) / 1000 AS distance
      FROM "Beach"
      WHERE ST_DWithin(
        ST_MakePoint(longitude, latitude)::geography,
        ST_MakePoint(${userLng}, ${userLat})::geography,
        ${radiusMeters}
      )
      ORDER BY distance ASC
      LIMIT ${limit}
      OFFSET ${offset};
    `;
    
  // Query untuk menghitung total data yang cocok untuk pagination
  const totalCountResult: { count: bigint }[] = await prisma.$queryRaw`
      SELECT COUNT(*)
      FROM "Beach"
      WHERE ST_DWithin(
        ST_MakePoint(longitude, latitude)::geography,
        ST_MakePoint(${userLng}, ${userLat})::geography,
        ${radiusMeters}
      );
    `;

  const totalCount = Number(totalCountResult[0].count);
  const totalPages = Math.ceil(totalCount / limit);
  
  // Ubah hasil query mentah menjadi format DTO yang diinginkan
  const data = nearbyBeachesRaw.map(beach => {
     const totalSentimentCount =
      beach.positiveSentimentCount +
      beach.negativeSentimentCount +
      beach.neutralSentimentCount;
    return {
        placeId: beach.place_Id,
        place_name: beach.place_name,
        description: beach.description,
        rating: beach.rating,
        reviews: beach.reviews,
        sentimentSummary: {
          positive: calculatePercentage(beach.positiveSentimentCount, totalSentimentCount),
          negative: calculatePercentage(beach.negativeSentimentCount, totalSentimentCount),
          neutral: calculatePercentage(beach.neutralSentimentCount, totalSentimentCount),
        },
        featured_image: beach.featured_image[0] || null,
        address: beach.address,
        review_keywords: beach.review_keywords,
        link: beach.link,
        coordinates: beach.coordinates,
        distance: parseFloat(beach.distance.toFixed(2)),
    }
  });

  return { data, totalCount, currentPage: page, totalPages };
};