"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const express_1 = __importDefault(require("express"));
const beachService = __importStar(require("./service"));
const schema_1 = require("./schema");
const BadRequestError_1 = require("../../error/BadRequestError");
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
// Rute yang membutuhkan otentikasi
router.post("/recommend", auth_1.authenticateJWT, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Pastikan req.user ada setelah authenticateJWT
        if (!req.user) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }
        const validatedData = schema_1.PreferenceInputSchema.parse(req.body);
        const { preference_text } = validatedData;
        const userId = req.user.id; // Ambil user ID dari token JWT
        const recommendations = yield beachService.getBeachRecommendations(preference_text, userId);
        res.json({
            message: "Beach recommendations based on your preference",
            recommendations,
        });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return next(new BadRequestError_1.BadRequestError(`Validation Error: ${error.issues[0].message}`));
        }
        next(error);
    }
}));
// --- BARU: Endpoint untuk mengambil detail beberapa pantai sekaligus ---
router.post("/batch-details", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { placeIds } = req.body; // Mengharapkan body: { placeIds: ["id1", "id2", ...] }
        if (!Array.isArray(placeIds) || placeIds.length === 0) {
            throw new BadRequestError_1.BadRequestError("placeIds must be a non-empty array.");
        }
        // Anda perlu membuat fungsi ini di service dan repository Anda
        const beachDetails = yield beachService.getBeachesByIds(placeIds);
        res.json(beachDetails);
    }
    catch (error) {
        next(error);
    }
}));
// Rute yang tidak membutuhkan otentikasi
router.get("/search", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queryValidationResult = schema_1.BeachSearchQuerySchema.safeParse(req.query);
        if (!queryValidationResult.success) {
            const firstError = queryValidationResult.error.issues[0];
            throw new BadRequestError_1.BadRequestError(`Invalid query parameter: ${firstError.path.join(".")} - ${firstError.message}`);
        }
        const { search: searchQuery, limit = 10, page = 1, } = queryValidationResult.data;
        // --- Perbaikan Terakhir ---
        if (!searchQuery) {
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
        const beachesResult = yield beachService.searchBeachesFromML(searchQuery, limit, page);
        // Asumsi service ML mengembalikan struktur { data: [...], totalCount: X }
        res.json({
            message: "Beaches retrieved successfully",
            count: beachesResult.data.length,
            totalCount: beachesResult.totalCount,
            page: page,
            limit: limit,
            data: beachesResult.data,
        });
    }
    catch (error) {
        next(error);
    }
}));
router.get("/nearby", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queryValidationResult = schema_1.NearbyBeachQuerySchema.safeParse(req.query);
        if (!queryValidationResult.success) {
            const errorMessages = queryValidationResult.error.issues
                .map((issue) => `${issue.path.join(".")} - ${issue.message}`)
                .join(", ");
            throw new BadRequestError_1.BadRequestError(`Invalid query parameter(s): ${errorMessages}`);
        }
        const { lat, lng, radius, limit, page } = queryValidationResult.data;
        const result = yield beachService.findNearbyBeaches(lat, lng, radius, limit, page);
        res.json({
            message: `Nearby beaches within ${radius}km radius`,
            countOnPage: result.data.length,
            totalCount: result.totalCount,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            data: result.data,
        });
    }
    catch (error) {
        next(error);
    }
}));
// PENTING: Route dengan parameter dinamis seperti /:placeId harus diletakkan di akhir
router.get("/:placeId", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { placeId } = req.params;
        if (!placeId) {
            throw new BadRequestError_1.BadRequestError("Place ID is required.");
        }
        const beachDetails = yield beachService.getBeachDetails(placeId);
        if (!beachDetails) {
            res.status(404).json({ message: "Beach not found" });
            return;
        }
        res.json(beachDetails);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
//# sourceMappingURL=controller.js.map