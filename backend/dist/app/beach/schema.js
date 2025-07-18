"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NearbyBeachQuerySchema = exports.BeachSearchQuerySchema = exports.PreferenceInputSchema = void 0;
// ./app/beach/schema.ts
const zod_1 = require("zod");
exports.PreferenceInputSchema = zod_1.z.object({
    preference_text: zod_1.z
        .string()
        .min(10, "Preference text should be descriptive (min 10 characters)"),
});
exports.BeachSearchQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    limit: zod_1.z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), zod_1.z.number().int().min(1).optional()),
    page: zod_1.z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), zod_1.z.number().int().min(1).optional()),
});
// Schema baru untuk query parameter nearby
exports.NearbyBeachQuerySchema = zod_1.z.object({
    lat: zod_1.z.preprocess((val) => (typeof val === "string" ? parseFloat(val) : val), zod_1.z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude")),
    lng: zod_1.z.preprocess((val) => (typeof val === "string" ? parseFloat(val) : val), zod_1.z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude")),
    radius: zod_1.z.preprocess(
    // Radius dalam kilometer
    (val) => (typeof val === "string" ? parseInt(val, 10) : val), zod_1.z
        .number()
        .int()
        .min(1, "Radius must be at least 1km")
        .optional()
        .default(10) // Default radius 10 km
    ),
    limit: zod_1.z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), zod_1.z.number().int().min(1).optional().default(10)),
    page: zod_1.z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), zod_1.z.number().int().min(1).optional().default(1)),
});
//# sourceMappingURL=schema.js.map