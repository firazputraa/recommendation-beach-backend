"use strict";
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
exports.findNearbyBeaches = exports.getBeachDetails = exports.searchBeachesFromML = exports.getBeachRecommendations = void 0;
// ./app/beach/service.ts
const client_1 = require("@prisma/client");
const BadRequestError_1 = require("../../error/BadRequestError"); // Sesuaikan path jika perlu
const axios_1 = __importDefault(require("axios"));
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001"; // URL service ML Anda
const prisma = new client_1.PrismaClient();
// --- Helper function to calculate distance (Haversine formula) ---
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return parseFloat(distance.toFixed(2)); // Jarak dalam kilometer dengan 2 desimal
}
// --- End Helper Function ---
const calculatePercentage = (count, total) => {
    return total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0;
};
// --- FUNGSI BARU UNTUK REKOMENDASI DARI ML SERVICE (/recommend-beach) ---
const getBeachRecommendations = (preferenceText_1, ...args_1) => __awaiter(void 0, [preferenceText_1, ...args_1], void 0, function* (preferenceText, userId = null // Tambahkan parameter userId
) {
    var _a;
    let recommendations = [];
    try {
        const payload = {
            preference_text: preferenceText,
        };
        if (userId) {
            payload.user_id = userId;
        }
        const response = yield axios_1.default.post(`${ML_SERVICE_URL}/recommend-beach`, payload);
        if (!response.data || !Array.isArray(response.data.recommendations)) {
            console.error("Invalid recommendations format from ML service:", response.data);
            throw new Error("Invalid recommendations format from ML service. Expected an object with a 'recommendations' array.");
        }
        const mlRecommendations = response.data.recommendations;
        const recommendedPlaceIds = mlRecommendations.map((rec) => rec.placeId);
        if (recommendedPlaceIds.length === 0) {
            return [];
        }
        // Ambil detail tambahan dari database berdasarkan placeId
        const beachesDetails = yield prisma.beach.findMany({
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
            var _a;
            const beachDetail = beachesDetails.find((b) => b.place_Id === mlRec.placeId);
            return {
                placeId: mlRec.placeId,
                score: mlRec.score,
                place_name: (beachDetail === null || beachDetail === void 0 ? void 0 : beachDetail.place_name) || null, // Tambahkan null default
                rating: (beachDetail === null || beachDetail === void 0 ? void 0 : beachDetail.rating) || null, // Tambahkan null default
                featured_image: ((_a = beachDetail === null || beachDetail === void 0 ? void 0 : beachDetail.featured_image) === null || _a === void 0 ? void 0 : _a[0]) || null, // Access the first element or null
            };
        })
            .sort((a, b) => b.score - a.score); // Urutkan berdasarkan skor dari ML service
    }
    catch (error) {
        console.error("Error calling ML recommendation service or processing results:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || error);
        if (axios_1.default.isAxiosError(error)) {
            throw new BadRequestError_1.BadRequestError(`Failed to get recommendations. ML service communication error: ${error.message}`);
        }
        throw new BadRequestError_1.BadRequestError(`Failed to get recommendations. ML service might be down, misconfigured, or returned unexpected data. Original error: ${error.message}`);
    }
    return recommendations;
});
exports.getBeachRecommendations = getBeachRecommendations;
// --- FUNGSI BARU UNTUK SEARCH DARI ML SERVICE (/search-point) ---
const searchBeachesFromML = (keyword, top_n) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!keyword || keyword.trim() === "") {
        return []; // Jika keyword kosong, kembalikan array kosong
    }
    try {
        const response = yield axios_1.default.post(`${ML_SERVICE_URL}/search-point`, {
            query: keyword,
            top_n: top_n,
        });
        if (!response.data || !Array.isArray(response.data.recommendations)) {
            console.error("Invalid search results format from ML service:", response.data);
            throw new Error("Invalid search results format from ML service. Expected an object with a 'recommendations' array.");
        }
        const mlSearchResults = response.data.recommendations;
        // Filter out recommendations that might not have a placeId
        const validMlResults = mlSearchResults.filter((item) => item.placeId);
        if (validMlResults.length === 0) {
            return []; // Tidak ada hasil yang valid dari ML
        }
        // Ambil detail tambahan (misal: sentiment summary, address, review_keywords, link, coordinates) dari database
        const placeIdsToFetch = validMlResults.map((rec) => rec.placeId);
        const beachesDetailsFromDB = yield prisma.beach.findMany({
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
        const detailedBeaches = validMlResults
            .map((mlRec) => {
            const dbDetail = beachesDetailsFromDB.find((db) => db.place_Id === mlRec.placeId);
            const totalSentimentCount = ((dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.positiveSentimentCount) || 0) +
                ((dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.negativeSentimentCount) || 0) +
                ((dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.neutralSentimentCount) || 0);
            const sentimentSummary = {
                positive: calculatePercentage((dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.positiveSentimentCount) || 0, totalSentimentCount),
                negative: calculatePercentage((dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.negativeSentimentCount) || 0, totalSentimentCount),
                neutral: calculatePercentage((dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.neutralSentimentCount) || 0, totalSentimentCount),
            };
            return {
                placeId: mlRec.placeId,
                place_name: mlRec.place_name,
                description: mlRec.description,
                rating: mlRec.rating,
                featured_image: mlRec.featured_image || null, // ML service sends a single string
                reviews: (dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.reviews) || 0, // Ambil dari DB
                sentimentSummary: sentimentSummary,
                address: (dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.address) || null,
                review_keywords: (dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.review_keywords) || null,
                link: (dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.link) || null,
                coordinates: (dbDetail === null || dbDetail === void 0 ? void 0 : dbDetail.coordinates) || null,
            };
        })
            .sort((a, b) => {
            var _a, _b;
            return (((_a = mlSearchResults.find((item) => item.placeId === a.placeId)) === null || _a === void 0 ? void 0 : _a.similarity_score) || 0) -
                (((_b = mlSearchResults.find((item) => item.placeId === b.placeId)) === null || _b === void 0 ? void 0 : _b.similarity_score) || 0);
        }); // Sort back by similarity score
        return detailedBeaches;
    }
    catch (error) {
        console.error("Error calling ML search service or processing results:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message || error);
        if (axios_1.default.isAxiosError(error)) {
            throw new BadRequestError_1.BadRequestError(`Failed to get search results. ML service communication error: ${error.message}`);
        }
        throw new BadRequestError_1.BadRequestError(`Failed to get search results. ML service might be down, misconfigured, or returned unexpected data. Original error: ${error.message}`);
    }
});
exports.searchBeachesFromML = searchBeachesFromML;
// --- FUNGSI UNTUK MENDAPATKAN DETAIL SATU PANTAI (tetap dari DB) ---
const getBeachDetails = (placeId) => __awaiter(void 0, void 0, void 0, function* () {
    // Directly use the BeachQueryResult type from Prisma's output structure
    const beach = yield prisma.beach.findUnique({
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
    const totalSentimentCount = beach.positiveSentimentCount +
        beach.negativeSentimentCount +
        beach.neutralSentimentCount;
    const sentimentSummary = {
        positive: calculatePercentage(beach.positiveSentimentCount, totalSentimentCount),
        negative: calculatePercentage(beach.negativeSentimentCount, totalSentimentCount),
        neutral: calculatePercentage(beach.neutralSentimentCount, totalSentimentCount),
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
});
exports.getBeachDetails = getBeachDetails;
// --- Fungsi baru untuk mencari pantai terdekat (tetap dari DB) ---
const findNearbyBeaches = (userLat, userLng, radiusKm, limit, page) => __awaiter(void 0, void 0, void 0, function* () {
    const allBeaches = yield prisma.beach.findMany({
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
    const nearbyBeachesWithDistance = [];
    for (const beach of allBeaches) {
        if (beach.coordinates) {
            try {
                const [beachLatStr, beachLngStr] = beach.coordinates.split(",");
                const beachLat = parseFloat(beachLatStr);
                const beachLng = parseFloat(beachLngStr);
                if (isNaN(beachLat) || isNaN(beachLng)) {
                    console.warn(`Invalid coordinates for beach ${beach.place_name} (${beach.place_Id}): ${beach.coordinates}. Skipping.`);
                    continue;
                }
                const distance = calculateDistance(userLat, userLng, beachLat, beachLng);
                if (distance <= radiusKm) {
                    const totalSentimentCount = beach.positiveSentimentCount +
                        beach.negativeSentimentCount +
                        beach.neutralSentimentCount;
                    const sentimentSummary = {
                        positive: calculatePercentage(beach.positiveSentimentCount, totalSentimentCount),
                        negative: calculatePercentage(beach.negativeSentimentCount, totalSentimentCount),
                        neutral: calculatePercentage(beach.neutralSentimentCount, totalSentimentCount),
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
            }
            catch (error) {
                console.error(`Error processing coordinates for beach ${beach.place_name} (${beach.place_Id}): ${beach.coordinates}. Error: ${error}. Skipping.`);
                continue;
            }
        }
        else {
            console.warn(`Beach ${beach.place_name} (${beach.place_Id}) has no coordinates. Skipping.`);
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
});
exports.findNearbyBeaches = findNearbyBeaches;
//# sourceMappingURL=service.js.map