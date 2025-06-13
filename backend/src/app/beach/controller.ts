// ./app/beach/controller.ts
import express, { NextFunction, Response, Request } from "express";
import * as beachService from "./service";
import {
  PreferenceInputSchema,
  BeachSearchQuerySchema,
  NearbyBeachQuerySchema,
} from "./schema";
import { BadRequestError } from "../../error/BadRequestError"; // Sesuaikan path jika perlu
import { authenticateJWT } from "../../middleware/auth";

const router = express.Router();

// NO AUTHENTICATION NEEDED FOR THESE ROUTES

router.post(
  "/recommend",
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = PreferenceInputSchema.parse(req.body);
      const { preference_text } = validatedData;
      // Ambil user_id dari request jika ada (misal dari JWT/session di middleware auth)
      // Untuk contoh ini, kita asumsikan user_id bisa langsung ada di body jika tidak ada autentikasi
      // ATAU Anda bisa melewatkan user_id dari middleware autentikasi ke req.user.id
      const userId = req.body.user_id || null; // <--- TAMBAHKAN INI UNTUK USER_ID

      const recommendations = await beachService.getBeachRecommendations(
        preference_text,
        userId // <--- LEWATKAN USER_ID KE SERVICE
      );

      res.json({
        message: "Beach recommendations based on your preference",
        recommendations,
      });
    } catch (error: any) {
      if (
        error.name === "ZodError" &&
        error.issues &&
        Array.isArray(error.issues) &&
        error.issues.length > 0
      ) {
        return next(
          new BadRequestError(`Validation Error: ${error.issues[0].message}`)
        );
      }
      next(error);
    }
  }
);

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

      // Ubah dari searchBeaches ke searchBeachesFromML
      const beaches = await beachService.searchBeachesFromML(
        // <--- PERUBAHAN DI SINI
        searchQuery,
        limit
      );

      res.json({
        message: "Beaches retrieved successfully",
        count: beaches.length,
        // totalCount: totalCountForSearch, // Ini akan dihandle oleh ML Service jika dia mengirim total
        page: page, // Page dari request
        limit: limit, // Limit dari request
        data: beaches,
      });
    } catch (error) {
      next(error);
    }
  }
);

// --- Route baru untuk mencari pantai terdekat ---
router.get(
  "/nearby", // Path: /beach/nearby?lat=-6.20&lng=106.81&radius=20&limit=5&page=1
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryValidationResult = NearbyBeachQuerySchema.safeParse(req.query);
      if (!queryValidationResult.success) {
        const firstError = queryValidationResult.error.issues[0];
        // Menggabungkan semua pesan error jika ada lebih dari satu
        const errorMessages = queryValidationResult.error.issues
          .map((issue) => `${issue.path.join(".")} - ${issue.message}`)
          .join(", ");
        throw new BadRequestError(
          `Invalid query parameter(s): ${errorMessages}`
        );
      }

      const {
        lat,
        lng,
        radius, // Default dari schema akan digunakan
        limit, // Default dari schema
        page, // Default dari schema
      } = queryValidationResult.data;

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
// --- End Route Baru ---

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
