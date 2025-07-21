import express, { NextFunction, Response, Request } from "express";
import * as beachService from "./service";
import {
  PreferenceInputSchema,
  BeachSearchQuerySchema,
  NearbyBeachQuerySchema,
} from "./schema";
import { BadRequestError } from "../../error/BadRequestError";
import { authenticateJWT } from "../../middleware/auth";

const router = express.Router();

// Rute yang membutuhkan otentikasi
router.post(
  "/recommend",
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Pastikan req.user ada setelah authenticateJWT
      if (!req.user) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      const validatedData = PreferenceInputSchema.parse(req.body);
      const { preference_text } = validatedData;
      const userId = req.user.id; // Ambil user ID dari token JWT

      const recommendations = await beachService.getBeachRecommendations(
        preference_text,
        userId
      );

      res.json({
        message: "Beach recommendations based on your preference",
        recommendations,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return next(
          new BadRequestError(`Validation Error: ${error.issues[0].message}`)
        );
      }
      next(error);
    }
  }
);

// --- BARU: Endpoint untuk mengambil detail beberapa pantai sekaligus ---
router.post(
  "/batch-details",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { placeIds } = req.body; // Mengharapkan body: { placeIds: ["id1", "id2", ...] }

      if (!Array.isArray(placeIds) || placeIds.length === 0) {
        throw new BadRequestError("placeIds must be a non-empty array.");
      }

      // Anda perlu membuat fungsi ini di service dan repository Anda
      const beachDetails = await beachService.getBeachesByIds(placeIds);

      res.json(beachDetails);
    } catch (error) {
      next(error);
    }
  }
);


// Rute yang tidak membutuhkan otentikasi
router.get(
  "/search",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryValidationResult = BeachSearchQuerySchema.safeParse(req.query);
      if (!queryValidationResult.success) {
        const firstError = queryValidationResult.error.issues[0];
        throw new BadRequestError(
          `Invalid query parameter: ${firstError.path.join(".")} - ${
            firstError.message
          }`
        );
      }
      const {
        search: searchQuery,
        limit = 10,
        page = 1,
      } = queryValidationResult.data;

      // --- Perbaikan Terakhir ---
      if(!searchQuery){
        res.json({
          message: "Search query is empty, returning no results.",
          count: 0,
          totalCount: 0,
          page: page,
          limit: limit,
          data: [],
        });
        return; 
      }

      const beachesResult = await beachService.searchBeachesFromML(
        searchQuery,
        limit,
        page 
      );

      // Asumsi service ML mengembalikan struktur { data: [...], totalCount: X }
      res.json({
        message: "Beaches retrieved successfully",
        count: beachesResult.data.length,
        totalCount: beachesResult.totalCount, 
        page: page,
        limit: limit,
        data: beachesResult.data,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/nearby",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryValidationResult = NearbyBeachQuerySchema.safeParse(req.query);
      if (!queryValidationResult.success) {
        const errorMessages = queryValidationResult.error.issues
          .map((issue) => `${issue.path.join(".")} - ${issue.message}`)
          .join(", ");
        throw new BadRequestError(
          `Invalid query parameter(s): ${errorMessages}`
        );
      }

      const { lat, lng, radius, limit, page } = queryValidationResult.data;

      const result = await beachService.findNearbyBeaches(
        lat,
        lng,
        radius,
        limit,
        page
      );

      res.json({
        message: `Nearby beaches within ${radius}km radius`,
        countOnPage: result.data.length,
        totalCount: result.totalCount,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PENTING: Route dengan parameter dinamis seperti /:placeId harus diletakkan di akhir
router.get(
  "/:placeId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { placeId } = req.params;
      if (!placeId) {
        throw new BadRequestError("Place ID is required.");
      }
      const beachDetails = await beachService.getBeachDetails(placeId);

      if (!beachDetails) {
        res.status(404).json({ message: "Beach not found" });
        return;
      }

      res.json(beachDetails);
    } catch (error) {
      next(error);
    }
  }
);

export default router;