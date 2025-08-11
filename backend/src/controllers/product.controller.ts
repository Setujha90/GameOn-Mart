import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import { zodValidator } from "../utils/zodValidator";
import { STATUS_CODE } from "../constant/statuscode.const";
import { createProductSchema, updateProductSchema } from "../zodSchema/product.schema";
import { Product } from "../models/product.model";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import User, { IUser } from "../models/user.model";
import mongoose, { isValidObjectId } from "mongoose";



export const createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, price, category, stock } = zodValidator(createProductSchema, req.body);

    const localPath = req.file?.path;
    if (!localPath) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Image file is required");
    }

    const images = await uploadToCloudinary(localPath);
    if (!images) {
        throw new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR, "Failed to upload images");
    }

    const sellUser = await User.findById(req.user?.userId);
    if (!sellUser) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Seller not found");
    }


    const product = await Product.create({
        name,
        description,
        price,
        images,
        category,
        stock,
        seller: req.user?.userId,
    });

    return new ApiResponse(STATUS_CODE.CREATED, "Product created successfully", {
        product
    }).send(res);
});

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    //const categoryFilter = req.query.category ? { category: { $in: [req.query.category] } } : {};
    let categoryFilter = {};
    if (req.query.category) {
        let categories: string[] = [];
        if (Array.isArray(req.query.category)) {
            categories = req.query.category as string[];
        } else {
            categories = (req.query.category as string).split(",").map(cat => cat.trim());
        }
        categoryFilter = { category: { $in: categories } };
    }

    const searchQuery = req.query.search ? { name: { $regex: req.query.search, $options: "i" } } : {};

    const total = await Product.countDocuments({ ...categoryFilter, ...searchQuery });

    const products = await Product.find({ ...categoryFilter, ...searchQuery }).populate("seller", "fullName").skip(skip).limit(limit).sort({ createdAt: -1 });

    return new ApiResponse(STATUS_CODE.OK, "Products retrieved successfully", {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        products,
        currentPage: page
    }).send(res);
});

export const getProductById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await Product.findById(req.params.id).populate("seller", "fullName");
    if (!product) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Product not found");
    }

    return new ApiResponse(STATUS_CODE.OK, "Product retrieved successfully", {
        product
    }).send(res);
});


export const getProductsBySeller = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    
    let sellerId;

    if (req.params.sellerId) {
        sellerId = req.params.sellerId;
    } else {
        sellerId = req.user?.userId;
    }
    if (!sellerId || !isValidObjectId(sellerId)) {
        throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid seller ID");
    }
    
    const products = await Product.find({ seller: sellerId }).populate("seller", "fullName");

    return new ApiResponse(STATUS_CODE.OK, "Products retrieved successfully", {
        products
    }).send(res);
});

export const getProductsByCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const products = await Product.find({ category: req.params.category }).populate("seller", "fullName");
    return new ApiResponse(STATUS_CODE.OK, "Products retrieved successfully", {
        products
    }).send(res);
});

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const searchTerm = req.query.q ? (req.query.q as string).trim() : "";
    const products = await Product.find({
        name: { $regex: searchTerm, $options: "i" }
    }).populate("seller", "fullName");
    return new ApiResponse(STATUS_CODE.OK, "Products retrieved successfully", {
        products
    }).send(res);
});

export const updateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    
    const product = await Product.findById(req.params.id);
    if (!product) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Product not found");
    }
    //console.log("seller:", product.seller.toString());
   // console.log("user:", req.user?.userId);
    if (req.user?.role === "seller" && product.seller.toString() !== req.user?.userId) {
        throw new ApiError(STATUS_CODE.FORBIDDEN, "You can only update products you created");
    }



    const { name, description, price, category, stock } = zodValidator(updateProductSchema, req.body);

    if (req.file?.path) {
        const localPath = req.file.path;
        const images = await uploadToCloudinary(localPath);
        if (!images) {
            throw new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR, "Failed to upload images");
        }
        product.images = [images];
    }

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.category = category ?? product.category;
    product.stock = stock ?? product.stock;

    await product.save({ validateBeforeSave: false });

    return new ApiResponse(STATUS_CODE.OK, "Product updated successfully", {
        product
    }).send(res);
});

export const deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Product not found");
    }

    if (req.user?.role === "seller" && product.seller.toString() !== req.user?.userId) {
        throw new ApiError(STATUS_CODE.FORBIDDEN, "You can only delete products you created");
    }

    if (product.images[0].public_id) {
        await deleteFromCloudinary(product.images[0].public_id);
    }

    await Product.findByIdAndDelete(req.params.id);


    return new ApiResponse(STATUS_CODE.OK, "Product deleted successfully", {
        product
    }).send(res);
});
