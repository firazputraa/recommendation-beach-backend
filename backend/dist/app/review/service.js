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
exports.getBeachReviews = exports.deleteReview = exports.updateReview = exports.analyzeAndSaveReview = void 0;
// service.ts (Sudah Bagus, tambahkan logging jika perlu)
const client_1 = require("@prisma/client");
const BadRequestError_1 = require("../../error/BadRequestError");
const axios_1 = __importDefault(require("axios"));
const UnauthorizedError_1 = require("../../error/UnauthorizedError");
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";
const prisma = new client_1.PrismaClient();
const analyzeAndSaveReview = (userId, placeId, rating, review_text) => __awaiter(void 0, void 0, void 0, function* () {
    const existingBeach = yield prisma.beach.findUnique({
        where: { place_Id: placeId },
    });
    if (!existingBeach) {
        throw new BadRequestError_1.BadRequestError(`Beach with ID ${placeId} not found.`);
    }
    let sentimentResult;
    try {
        console.log(`Calling ML sentiment service at: ${ML_SERVICE_URL}/analyze-sentiment`);
        const response = yield axios_1.default.post(`${ML_SERVICE_URL}/analyze-sentiment`, {
            review_text,
        });
        sentimentResult = response.data;
        console.log("ML sentiment service response:", sentimentResult);
        if (!sentimentResult.sentiment ||
            typeof sentimentResult.confidence === "undefined") {
            throw new Error("Invalid response from ML service");
        }
    }
    catch (error) {
        // This catches errors from Axios (e.g., 500 from Flask)
        console.error("Error calling ML sentiment service:", error.response ? error.response.data : error.message || error);
        throw new BadRequestError_1.BadRequestError(`Failed to analyze sentiment. ML service response error: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
    const newReview = yield prisma.reviews.create({
        data: {
            userId: userId,
            placeId: placeId,
            rating: rating,
            review_text: review_text,
            average_sentiment: sentimentResult.sentiment,
        },
    });
    console.log("Review saved to database:", newReview);
    // Transaction to update beach sentiment counts
    yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const currentBeach = yield tx.beach.findUnique({
            where: { place_Id: placeId },
            select: {
                positiveSentimentCount: true,
                negativeSentimentCount: true,
                neutralSentimentCount: true,
                reviews: true,
            },
        });
        if (!currentBeach) {
            throw new BadRequestError_1.BadRequestError(`Beach with ID ${placeId} not found during sentiment update.`);
        }
        let updatedPositive = currentBeach.positiveSentimentCount;
        let updatedNegative = currentBeach.negativeSentimentCount;
        let updatedNeutral = currentBeach.neutralSentimentCount;
        let totalReviews = currentBeach.reviews;
        if (sentimentResult.sentiment.toLowerCase() === "positive") {
            updatedPositive++;
        }
        else if (sentimentResult.sentiment.toLowerCase() === "negative") {
            updatedNegative++;
        }
        else {
            updatedNeutral++;
        }
        totalReviews++;
        yield tx.beach.update({
            where: { place_Id: placeId },
            data: {
                positiveSentimentCount: updatedPositive,
                negativeSentimentCount: updatedNegative,
                neutralSentimentCount: updatedNeutral,
                reviews: totalReviews,
            },
        });
        console.log("Beach sentiment counts updated.");
    }));
    return {
        sentiment: sentimentResult.sentiment,
        confidence: sentimentResult.confidence,
        review: newReview,
    };
});
exports.analyzeAndSaveReview = analyzeAndSaveReview;
const updateReview = (userId, reviewId, rating, review_text) => __awaiter(void 0, void 0, void 0, function* () {
    const existingReview = yield prisma.reviews.findUnique({
        where: { id: reviewId },
        select: { userId: true, placeId: true, average_sentiment: true },
    });
    if (!existingReview) {
        throw new BadRequestError_1.BadRequestError(`Review with ID ${reviewId} not found.`);
    }
    if (existingReview.userId !== userId) {
        throw new UnauthorizedError_1.UnauthorizedError("You are not authorized to update this review.");
    }
    if (rating === undefined && review_text === undefined) {
        throw new BadRequestError_1.BadRequestError("You must provide either a new rating or review text to update.");
    }
    let updatedReviewData = {};
    if (rating !== undefined) {
        updatedReviewData.rating = rating;
    }
    let sentimentResult;
    let updatedSentiment = existingReview.average_sentiment;
    let confidence = 0;
    if (review_text !== undefined) {
        updatedReviewData.review_text = review_text;
        try {
            console.log(`Calling ML sentiment service for update at: ${ML_SERVICE_URL}/analyze-sentiment`);
            const response = yield axios_1.default.post(`${ML_SERVICE_URL}/analyze-sentiment`, {
                review_text,
            });
            sentimentResult = response.data;
            console.log("ML sentiment service response for update:", sentimentResult);
            if (!sentimentResult.sentiment ||
                typeof sentimentResult.confidence === "undefined") {
                throw new Error("Invalid response from ML service for updated review.");
            }
            updatedSentiment = sentimentResult.sentiment;
            confidence = sentimentResult.confidence;
            updatedReviewData.average_sentiment = updatedSentiment;
        }
        catch (error) {
            console.error("Error calling ML sentiment service for updated review:", error.response ? error.response.data : error.message || error);
            throw new BadRequestError_1.BadRequestError(`Failed to analyze sentiment for updated review. ML service response error: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
        }
    }
    const updatedReview = yield prisma.reviews.update({
        where: { id: reviewId },
        data: updatedReviewData,
    });
    console.log("Review updated in database:", updatedReview);
    yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const newSentiment = (_a = sentimentResult === null || sentimentResult === void 0 ? void 0 : sentimentResult.sentiment) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        const oldSentiment = existingReview.average_sentiment.toLowerCase();
        if (newSentiment && newSentiment !== oldSentiment) {
            const currentBeach = yield tx.beach.findUnique({
                where: { place_Id: existingReview.placeId },
                select: {
                    positiveSentimentCount: true,
                    negativeSentimentCount: true,
                    neutralSentimentCount: true,
                },
            });
            if (!currentBeach) {
                throw new BadRequestError_1.BadRequestError(`Beach with ID ${existingReview.placeId} not found during sentiment update after review update.`);
            }
            let updatedPositive = currentBeach.positiveSentimentCount;
            let updatedNegative = currentBeach.negativeSentimentCount;
            let updatedNeutral = currentBeach.neutralSentimentCount;
            if (oldSentiment === "positive")
                updatedPositive--;
            else if (oldSentiment === "negative")
                updatedNegative--;
            else
                updatedNeutral--;
            if (newSentiment === "positive")
                updatedPositive++;
            else if (newSentiment === "negative")
                updatedNegative++;
            else
                updatedNeutral++;
            yield tx.beach.update({
                where: { place_Id: existingReview.placeId },
                data: {
                    positiveSentimentCount: updatedPositive,
                    negativeSentimentCount: updatedNegative,
                    neutralSentimentCount: updatedNeutral,
                },
            });
            console.log("Beach sentiment counts updated after review update.");
        }
    }));
    return {
        sentiment: updatedSentiment,
        confidence: confidence,
        review: updatedReview,
    };
});
exports.updateReview = updateReview;
const deleteReview = (userId, reviewId) => __awaiter(void 0, void 0, void 0, function* () {
    const reviewToDelete = yield prisma.reviews.findUnique({
        where: { id: reviewId },
        select: { userId: true, placeId: true, average_sentiment: true },
    });
    if (!reviewToDelete) {
        throw new BadRequestError_1.BadRequestError(`Review with ID ${reviewId} not found.`);
    }
    if (reviewToDelete.userId !== userId) {
        throw new UnauthorizedError_1.UnauthorizedError("You are not authorized to delete this review.");
    }
    yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.reviews.delete({
            where: { id: reviewId },
        });
        console.log("Review deleted from database.");
        const currentBeach = yield tx.beach.findUnique({
            where: { place_Id: reviewToDelete.placeId },
            select: {
                positiveSentimentCount: true,
                negativeSentimentCount: true,
                neutralSentimentCount: true,
                reviews: true,
            },
        });
        if (!currentBeach) {
            throw new BadRequestError_1.BadRequestError(`Beach with ID ${reviewToDelete.placeId} not found during sentiment update after deletion.`);
        }
        let updatedPositive = currentBeach.positiveSentimentCount;
        let updatedNegative = currentBeach.negativeSentimentCount;
        let updatedNeutral = currentBeach.neutralSentimentCount;
        let totalReviews = currentBeach.reviews;
        if (reviewToDelete.average_sentiment.toLowerCase() === "positive") {
            updatedPositive--;
        }
        else if (reviewToDelete.average_sentiment.toLowerCase() === "negative") {
            updatedNegative--;
        }
        else {
            updatedNeutral--;
        }
        totalReviews--;
        yield tx.beach.update({
            where: { place_Id: reviewToDelete.placeId },
            data: {
                positiveSentimentCount: updatedPositive,
                negativeSentimentCount: updatedNegative,
                neutralSentimentCount: updatedNeutral,
                reviews: totalReviews,
            },
        });
        console.log("Beach sentiment counts updated after review deletion.");
    }));
});
exports.deleteReview = deleteReview;
const getBeachReviews = (placeId) => __awaiter(void 0, void 0, void 0, function* () {
    const reviews = yield prisma.reviews.findMany({
        where: { placeId: placeId },
        select: {
            id: true,
            userId: true,
            review_text: true,
            rating: true,
            average_sentiment: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    if (!reviews) {
        return [];
    }
    return reviews;
});
exports.getBeachReviews = getBeachReviews;
//# sourceMappingURL=service.js.map