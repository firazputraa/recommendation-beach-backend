// service.ts (Sudah Bagus, tambahkan logging jika perlu)
import { Prisma, PrismaClient } from "@prisma/client";
import { BadRequestError } from "../../error/BadRequestError";
import axios from "axios";
import { SentimentResult, ReviewDetails } from "./dto";
import { UnauthorizedError } from "../../error/UnauthorizedError";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

const prisma = new PrismaClient();

export const analyzeAndSaveReview = async (
  userId: string,
  placeId: string,
  rating: number,
  review_text: string
): Promise<{ sentiment: string; confidence: number; review: any }> => {
  const existingBeach = await prisma.beach.findUnique({
    where: { place_Id: placeId },
  });

  if (!existingBeach) {
    throw new BadRequestError(`Beach with ID ${placeId} not found.`);
  }

  let sentimentResult: SentimentResult;
  try {
    console.log(`Calling ML sentiment service at: ${ML_SERVICE_URL}/analyze-sentiment`);
    const response = await axios.post(`${ML_SERVICE_URL}/analyze-sentiment`, {
      review_text,
    });
    sentimentResult = response.data;
    console.log("ML sentiment service response:", sentimentResult);
    if (
      !sentimentResult.sentiment ||
      typeof sentimentResult.confidence === "undefined"
    ) {
      throw new Error("Invalid response from ML service");
    }
  } catch (error: any) {
    // This catches errors from Axios (e.g., 500 from Flask)
    console.error(
      "Error calling ML sentiment service:",
      error.response ? error.response.data : error.message || error
    );
    throw new BadRequestError(
      `Failed to analyze sentiment. ML service response error: ${error.response ? JSON.stringify(error.response.data) : error.message}`
    );
  }

  const newReview = await prisma.reviews.create({
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
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const currentBeach = await tx.beach.findUnique({
      where: { place_Id: placeId },
      select: {
        positiveSentimentCount: true,
        negativeSentimentCount: true,
        neutralSentimentCount: true,
        reviews: true,
      },
    });

    if (!currentBeach) {
      throw new BadRequestError(
        `Beach with ID ${placeId} not found during sentiment update.`
      );
    }

    let updatedPositive = currentBeach.positiveSentimentCount;
    let updatedNegative = currentBeach.negativeSentimentCount;
    let updatedNeutral = currentBeach.neutralSentimentCount;
    let totalReviews = currentBeach.reviews;

    if (sentimentResult.sentiment.toLowerCase() === "positive") {
      updatedPositive++;
    } else if (sentimentResult.sentiment.toLowerCase() === "negative") {
      updatedNegative++;
    } else {
      updatedNeutral++;
    }
    totalReviews++;

    await tx.beach.update({
      where: { place_Id: placeId },
      data: {
        positiveSentimentCount: updatedPositive,
        negativeSentimentCount: updatedNegative,
        neutralSentimentCount: updatedNeutral,
        reviews: totalReviews,
      },
    });
    console.log("Beach sentiment counts updated.");
  });

  return {
    sentiment: sentimentResult.sentiment,
    confidence: sentimentResult.confidence,
    review: newReview,
  };
};

export const updateReview = async (
  userId: string,
  reviewId: string,
  rating?: number,
  review_text?: string
): Promise<{ sentiment: string; confidence: number; review: any }> => {
  const existingReview = await prisma.reviews.findUnique({
    where: { id: reviewId },
    select: { userId: true, placeId: true, average_sentiment: true },
  });

  if (!existingReview) {
    throw new BadRequestError(`Review with ID ${reviewId} not found.`);
  }

  if (existingReview.userId !== userId) {
    throw new UnauthorizedError(
      "You are not authorized to update this review."
    );
  }

  if (rating === undefined && review_text === undefined) {
    throw new BadRequestError(
      "You must provide either a new rating or review text to update."
    );
  }

  let updatedReviewData: Prisma.ReviewsUpdateInput = {};
  if (rating !== undefined) {
    updatedReviewData.rating = rating;
  }
  let sentimentResult: SentimentResult;
  let updatedSentiment: string = existingReview.average_sentiment;
  let confidence: number = 0;

  if (review_text !== undefined) {
    updatedReviewData.review_text = review_text;
    try {
      console.log(`Calling ML sentiment service for update at: ${ML_SERVICE_URL}/analyze-sentiment`);
      const response = await axios.post(`${ML_SERVICE_URL}/analyze-sentiment`, {
        review_text,
      });
      sentimentResult = response.data;
      console.log("ML sentiment service response for update:", sentimentResult);
      if (
        !sentimentResult.sentiment ||
        typeof sentimentResult.confidence === "undefined"
      ) {
        throw new Error("Invalid response from ML service for updated review.");
      }
      updatedSentiment = sentimentResult.sentiment;
      confidence = sentimentResult.confidence;
      updatedReviewData.average_sentiment = updatedSentiment;
    } catch (error: any) {
      console.error(
        "Error calling ML sentiment service for updated review:",
        error.response ? error.response.data : error.message || error
      );
      throw new BadRequestError(
        `Failed to analyze sentiment for updated review. ML service response error: ${error.response ? JSON.stringify(error.response.data) : error.message}`
      );
    }
  }

  const updatedReview = await prisma.reviews.update({
    where: { id: reviewId },
    data: updatedReviewData,
  });
  console.log("Review updated in database:", updatedReview);


  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newSentiment = sentimentResult?.sentiment?.toLowerCase();
    const oldSentiment = existingReview.average_sentiment.toLowerCase();

    if (newSentiment && newSentiment !== oldSentiment) {
      const currentBeach = await tx.beach.findUnique({
        where: { place_Id: existingReview.placeId },
        select: {
          positiveSentimentCount: true,
          negativeSentimentCount: true,
          neutralSentimentCount: true,
        },
      });

      if (!currentBeach) {
        throw new BadRequestError(
          `Beach with ID ${existingReview.placeId} not found during sentiment update after review update.`
        );
      }

      let updatedPositive = currentBeach.positiveSentimentCount;
      let updatedNegative = currentBeach.negativeSentimentCount;
      let updatedNeutral = currentBeach.neutralSentimentCount;

      if (oldSentiment === "positive") updatedPositive--;
      else if (oldSentiment === "negative") updatedNegative--;
      else updatedNeutral--;

      if (newSentiment === "positive") updatedPositive++;
      else if (newSentiment === "negative") updatedNegative++;
      else updatedNeutral++;

      await tx.beach.update({
        where: { place_Id: existingReview.placeId },
        data: {
          positiveSentimentCount: updatedPositive,
          negativeSentimentCount: updatedNegative,
          neutralSentimentCount: updatedNeutral,
        },
      });
      console.log("Beach sentiment counts updated after review update.");
    }
  });

  return {
    sentiment: updatedSentiment,
    confidence: confidence,
    review: updatedReview,
  };
};

export const deleteReview = async (
  userId: string,
  reviewId: string
): Promise<void> => {
  const reviewToDelete = await prisma.reviews.findUnique({
    where: { id: reviewId },
    select: { userId: true, placeId: true, average_sentiment: true },
  });

  if (!reviewToDelete) {
    throw new BadRequestError(`Review with ID ${reviewId} not found.`);
  }

  if (reviewToDelete.userId !== userId) {
    throw new UnauthorizedError(
      "You are not authorized to delete this review."
    );
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.reviews.delete({
      where: { id: reviewId },
    });
    console.log("Review deleted from database.");

    const currentBeach = await tx.beach.findUnique({
      where: { place_Id: reviewToDelete.placeId },
      select: {
        positiveSentimentCount: true,
        negativeSentimentCount: true,
        neutralSentimentCount: true,
        reviews: true,
      },
    });

    if (!currentBeach) {
      throw new BadRequestError(
        `Beach with ID ${reviewToDelete.placeId} not found during sentiment update after deletion.`
      );
    }

    let updatedPositive = currentBeach.positiveSentimentCount;
    let updatedNegative = currentBeach.negativeSentimentCount;
    let updatedNeutral = currentBeach.neutralSentimentCount;
    let totalReviews = currentBeach.reviews;

    if (reviewToDelete.average_sentiment.toLowerCase() === "positive") {
      updatedPositive--;
    } else if (reviewToDelete.average_sentiment.toLowerCase() === "negative") {
      updatedNegative--;
    } else {
      updatedNeutral--;
    }
    totalReviews--;

    await tx.beach.update({
      where: { place_Id: reviewToDelete.placeId },
      data: {
        positiveSentimentCount: updatedPositive,
        negativeSentimentCount: updatedNegative,
        neutralSentimentCount: updatedNeutral,
        reviews: totalReviews,
      },
    });
    console.log("Beach sentiment counts updated after review deletion.");
  });
};

export const getBeachReviews = async (
  placeId: string
): Promise<ReviewDetails[]> => {
  const reviews = await prisma.reviews.findMany({
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

  return reviews as ReviewDetails[];
};