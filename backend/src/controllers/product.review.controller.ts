import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { Product } from "../models/product.model";
import { addReviewSchema, updateReviewSchema } from "../zodSchema/product.review.schema";
import ApiResponse from "../utils/ApiResponse";
import { STATUS_CODE } from "../constant/statuscode.const";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import ApiError from "../utils/ApiError";
import { zodValidator } from "../utils/zodValidator";
import { isValidObjectId } from "mongoose";
import User from "../models/user.model";

//* Add or Update Review
export const addOrUpdateReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    const productId = req.params.id;
    if (!userId) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
    }

    const user = await User.findById(userId);
    const name = user?.fullName;
    // console.log("User ID:", userId, "Name:", name);

    if (!productId) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Product ID is required");
    }

    if (!isValidObjectId(productId)) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid Product ID");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Product not found");
    }

    const existingReviewIndex = product.reviews.findIndex((rev: any) => rev.user.toString() === userId);


    if (existingReviewIndex !== -1) {

        const { rating, comment } = zodValidator(updateReviewSchema, req.body);
        product.reviews[existingReviewIndex].rating = rating ?? product.reviews[existingReviewIndex].rating;
        product.reviews[existingReviewIndex].comment = comment ?? product.reviews[existingReviewIndex].comment;
    } else {

        const { rating, comment } = zodValidator(addReviewSchema, req.body);
        product.reviews.push({
            user: new (require("mongoose").Types.ObjectId)(userId),
            name: name ?? "Anonymous",
            rating,
            comment: comment ?? "",
        });
    }

    product.numOfReviews = product.reviews.length;
    product.ratings = product.reviews.reduce((acc: number, rev: any) => acc + rev.rating, 0) / product.numOfReviews;


    await product.save({ validateBeforeSave: false });

    return new ApiResponse(
        STATUS_CODE.OK,
        existingReviewIndex !== -1 ? "Review updated successfully" : "Review added successfully",
        product
    ).send(res);
})

//* Delete Review
export const deleteReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const productId = req.params.id;

    if (!userId) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
    }

    if (!productId || !isValidObjectId(productId)) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid Product ID");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Product not found");
    }

    const existingReviewIndex = product.reviews.findIndex((rev: any) => rev.user.toString() === userId);
    if (existingReviewIndex === -1) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Review not found");
    }

    const review = product.reviews[existingReviewIndex];
    if (role !== "admin" && review.user.toString() !== userId) {
        throw new ApiError(STATUS_CODE.FORBIDDEN, "You are not allowed to delete this review");
    }

    product.reviews.splice(existingReviewIndex, 1);
    product.numOfReviews = product.reviews.length;
    if (product.numOfReviews > 0) {
        product.ratings = product.reviews.reduce((acc: number, rev: any) => acc + rev.rating, 0) / product.numOfReviews;
    }
    else {
        product.ratings = 0;
    }


    await product.save({ validateBeforeSave: false });

    return new ApiResponse(
        STATUS_CODE.OK,
        "Review deleted successfully",
        product
    ).send(res);
})

//* Get All Reviews Of A Product
export const getProductReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const productId = req.params.id;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!productId || !isValidObjectId(productId)) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid Product ID");
    }

    const product = await Product.findById(productId).select("reviews").populate("reviews.user", "fullName");
    if (!product) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Product not found");
    }

    const totalReviews = product.reviews.length;
    const paginatedReviews = product.reviews.slice(skip, skip + limit);

    return new ApiResponse(
        STATUS_CODE.OK,
        "Product reviews fetched successfully",
        {
            reviews: paginatedReviews,
            totalReviews: {
                totalReviews,
                currentPage: page,
                totalPages: Math.ceil(totalReviews / limit),
                limit
            }
        }
    ).send(res);
})

//* Get All My Reviews On Products
export const getMyReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "User not authenticated");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ "reviews.user": userId })
        .select("name reviews")
        .populate("reviews.user", "fullName");

    let allMyReviews: any[] = [];
    products.forEach(product => {
        product.reviews.forEach((review: any) => {
            if (review.user && review.user._id.toString() === userId) {
                allMyReviews.push({
                    productId: product._id,
                    productName: product.name,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt
                });
            }
        });
    });

    const totalReviews = allMyReviews.length;
    const paginatedReviews = allMyReviews.slice(skip, skip + limit);

    return new ApiResponse(
        STATUS_CODE.OK,
        "My reviews fetched successfully",
        {
            reviews: paginatedReviews,
            pagination: {
                totalReviews,
                currentPage: page,
                totalPages: Math.ceil(totalReviews / limit),
                limit
            }
        }
    ).send(res);
})

//* Admin Get All Reviews
export const adminGetAllReviews = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    const { search, minRating, maxRating } = req.query;

    const productQuery: any = {};
    if (search) {
        productQuery.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(productQuery)
        .select("name reviews")
        .populate("reviews.user", "name email");

    let allReviews = products.flatMap(product =>
        product.reviews.map(review => ({
            productId: product._id,
            productName: product.name,
            user: review.user,
            rating: review.rating,
            comment: review.comment,
        }))
    );

    if (minRating || maxRating) {
        const min = minRating ? Number(minRating) : 0;
        const max = maxRating ? Number(maxRating) : 5;
        allReviews = allReviews.filter(r => typeof r.rating === "number" && r.rating >= min && r.rating <= max);
    }


    const paginatedReviews = allReviews.slice(skip, skip + limit);

    return new ApiResponse(
        STATUS_CODE.OK,
        "All product reviews fetched successfully",
        {
            totalReviews: allReviews.length,
            currentPage: page,
            totalPages: Math.ceil(allReviews.length / limit),
            reviews: paginatedReviews
        }
    ).send(res);
});

//* Get Product Rating Info
export const getProductRatingInfo = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;

    const product = await Product.findById(productId).select("reviews");

    if (!product) {
        throw new Error("Product not found");
    }

    const totalReviews = product.reviews.length;
    const averageRating = totalReviews > 0
        ? product.reviews.reduce((sum:number, review:any) => sum + review.rating, 0) / totalReviews
        : 0;

    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    product.reviews.forEach(review => {
        const rating = Number(review.rating);
        if (rating >= 1 && rating <= 5) {
            ratingBreakdown[rating] = (ratingBreakdown[rating] || 0) + 1;
        }
    });

    return new ApiResponse(
        STATUS_CODE.OK,
        "Product rating info fetched successfully",
        {
            totalReviews,
            averageRating: Number(averageRating.toFixed(2)),
            ratingBreakdown
        }
    ).send(res);
});



//* Admin Get All Reviews (Use MongoDB aggregation pipeline)
// export const adminGetAllReviews = asyncHandler(async (req: Request, res: Response) => {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const pipeline: import("mongoose").PipelineStage[] = [
//         { $unwind: { path: "$reviews" } },
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "reviews.user",
//                 foreignField: "_id",
//                 as: "userDetails"
//             }
//         },
//         { $unwind: { path: "$userDetails" } },
//         {
//             $project: { // select fields
//                 productId: "$_id",
//                 productName: "$name",
//                 reviewId: "$reviews._id",
//                 rating: "$reviews.rating",
//                 comment: "$reviews.comment",
//                 createdAt: "$reviews.createdAt",
//                 user: {
//                     _id: "$userDetails._id",
//                     name: "$userDetails.name",
//                     email: "$userDetails.email"
//                 }
//             }
//         },
//         { $sort: { createdAt: -1 } },
//         { $skip: skip },
//         { $limit: limit }
//     ];

//     const reviews = await Product.aggregate(pipeline);

//     const totalCountPipeline = [
//         { $unwind: "$reviews" },
//         { $count: "total" }
//     ];
//     const totalCountResult = await Product.aggregate(totalCountPipeline);
//     const totalReviews = totalCountResult[0]?.total || 0;

//     return new ApiResponse(
//         STATUS_CODE.OK,
//         "All product reviews fetched successfully",
//         {
//             totalReviews,
//             currentPage: page,
//             totalPages: Math.ceil(totalReviews / limit),
//             reviews
//         }
//     ).send(res);
// });
