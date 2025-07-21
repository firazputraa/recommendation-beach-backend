"use strict";
// ./app/beach/service.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNearbyBeaches = exports.getBeachDetails = exports.searchBeachesFromML = exports.getBeachRecommendations = exports.getBeachesByIds = void 0;
const client_1 = require("@prisma/client");
const BadRequestError_1 = require("../../error/BadRequestError");
const axios_1 = __importDefault(require("axios"));
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://recommendation-beach-machine-learning-production.up.railway.app";
const prisma = new client_1.PrismaClient();
// --- Helper Functions (Tetap sama) ---
const calculatePercentage = (count, total) => {
    return total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0;
};
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
// =================================================================================
// --- BAGIAN INTI YANG DIREFAKTORISASI ---
// =================================================================================
/**
 * [BARU] Fungsi terpusat untuk mengambil detail lengkap pantai berdasarkan array ID.
 * Ini adalah solusi untuk masalah "N+1" di sisi frontend.
 */
const getBeachesByIds = (placeIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (placeIds.length === 0) {
        return [];
    }
    const beaches = yield prisma.beach.findMany({
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
        const totalSentimentCount = beach.positiveSentimentCount +
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
});
exports.getBeachesByIds = getBeachesByIds;
/**
 * [DIPERBAIKI] Mendapatkan rekomendasi pantai.
 * Alur: Panggil ML untuk ID & skor -> Panggil DB untuk detail lengkap.
 */
const getBeachRecommendations = (preferenceText_1, ...args_1) => __awaiter(void 0, [preferenceText_1, ...args_1], void 0, function* (preferenceText, userId = null) {
    var _a;
    try {
        // 1. Panggil ML Service untuk mendapatkan daftar ID dan skor
        const payload = {
            preference_text: preferenceText,
        };
        if (userId)
            payload.user_id = userId;
        const response = yield axios_1.default.post(`${ML_SERVICE_URL}/recommend-beach`, payload);
        const mlRecommendations = response.data.recommendations;
        if (!mlRecommendations || mlRecommendations.length === 0)
            return [];
        // Buat map skor untuk digabungkan nanti
        const scoreMap = new Map(mlRecommendations.map(rec => [rec.placeId, rec.score]));
        const recommendedPlaceIds = mlRecommendations.map((rec) => rec.placeId);
        // 2. Gunakan fungsi terpusat untuk mengambil detail lengkap dari DB
        const beachesDetails = yield (0, exports.getBeachesByIds)(recommendedPlaceIds);
        // 3. Gabungkan detail dengan skor dan urutkan
        const finalRecommendations = beachesDetails
            .map((detail) => (Object.assign(Object.assign({}, detail), { score: scoreMap.get(detail.placeId) || 0 })))
            .sort((a, b) => b.score - a.score);
        return finalRecommendations;
    }
    catch (error) {
        console.error("Error in getBeachRecommendations:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new BadRequestError_1.BadRequestError(`Failed to get recommendations. ML service might be down or returned unexpected data.`);
    }
});
exports.getBeachRecommendations = getBeachRecommendations;
/**
 * [DIPERBAIKI] Mencari pantai berdasarkan keyword.
 * Alur: Panggil ML untuk ID & skor -> Panggil DB untuk detail lengkap.
 * Menggunakan GET dan mendukung pagination.
 */
const searchBeachesFromML = (keyword, limit, page) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 1. Panggil ML Service menggunakan GET dan parameter pagination
        const response = yield axios_1.default.get(`${ML_SERVICE_URL}/search-point`, {
            params: { query: keyword, top_n: limit, page: page }, // Mengirim limit dan page
        });
        // Service ML harusnya mengembalikan { recommendations: [...], totalCount: X }
        const mlSearchResults = response.data.recommendations;
        const totalCount = response.data.totalCount || 0;
        if (!mlSearchResults || mlSearchResults.length === 0)
            return { data: [], totalCount: 0 };
        const scoreMap = new Map(mlSearchResults.map(rec => [rec.placeId, rec.similarity_score]));
        const placeIdsToFetch = mlSearchResults.map((rec) => rec.placeId);
        // 2. Gunakan fungsi terpusat untuk mengambil detail lengkap dari DB
        const beachesDetails = yield (0, exports.getBeachesByIds)(placeIdsToFetch);
        // 3. Gabungkan detail dengan skor dan urutkan
        const finalResults = beachesDetails
            .map((detail) => (Object.assign(Object.assign({}, detail), { score: scoreMap.get(detail.placeId) || 0 })))
            .sort((a, b) => b.score - a.score);
        return { data: finalResults, totalCount: totalCount };
    }
    catch (error) {
        console.error("Error in searchBeachesFromML:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new BadRequestError_1.BadRequestError(`Failed to get search results. ML service might be down or returned unexpected data.`);
    }
});
exports.searchBeachesFromML = searchBeachesFromML;
/**
 * [TETAP] Mendapatkan detail satu pantai. Tidak ada perubahan signifikan.
 */
const getBeachDetails = (placeId) => __awaiter(void 0, void 0, void 0, function* () {
    const [beachDetail] = yield (0, exports.getBeachesByIds)([placeId]); // Manfaatkan fungsi yang sudah ada
    return beachDetail || null;
});
exports.getBeachDetails = getBeachDetails;
/**
 * [PERFORMA KRITIS DIPERBAIKI] Mencari pantai terdekat menggunakan Raw SQL Query.
 * Jauh lebih cepat dan skalabel daripada memproses di JavaScript.
 */
const findNearbyBeaches = (userLat, userLng, radiusKm, limit, page) => __awaiter(void 0, void 0, void 0, function* () {
    const offset = (page - 1) * limit;
    const radiusMeters = radiusKm * 1000;
    // CATATAN: Query ini spesifik untuk PostgreSQL dengan PostGIS.
    // Sesuaikan jika Anda menggunakan database lain (misal: MySQL dengan fungsi geospasialnya).
    const nearbyBeachesRaw = yield prisma.$queryRaw `
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
    const totalCountResult = yield prisma.$queryRaw `
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
        const totalSentimentCount = beach.positiveSentimentCount +
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
        };
    });
    return { data, totalCount, currentPage: page, totalPages };
});
exports.findNearbyBeaches = findNearbyBeaches;
//# sourceMappingURL=service.js.map