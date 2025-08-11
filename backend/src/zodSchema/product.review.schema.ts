import { z } from "zod";

export const addReviewSchema = z.object({
    rating: z.preprocess((val) => Number(val), z.number().min(1).max(5)),
    comment: z.string().min(1, "Comment is required").optional(),
});

export const updateReviewSchema = z.object({
    rating: z.preprocess((val) => Number(val), z.number().min(1).max(5)).optional(),
    comment: z.string().optional(),
});
