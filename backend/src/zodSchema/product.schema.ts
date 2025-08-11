import z from 'zod';

export const createProductSchema = z.object({
    name: z
        .string()
        .min(3,"Product name must be at least 3 characters long")
        .max(100,"Product name must be at most 100 characters long"),

    description: z
        .string()
        .min(5,"Product description must be at least 5 characters long")
        .max(1000,"Product description must be at most 1000 characters long"),
    price: z.preprocess((val)=>Number(val), z
        .number()
        .positive("Product price must be a positive number")),
    stock: z.preprocess((val) => Number(val), z
        .number()
        .int()
        .nonnegative("Stock must be a non-negative number")
        .optional()),
    category: z.array(z.string()
        .min(2,"Category name must be at least 2 characters long")
        .max(100,"Category name must be at most 100 characters long")
        .nonempty("Category name cannot be empty")),
    
})

export const updateProductSchema = z.object({

    name: z
        .string()
        .min(3,"Product name must be at least 3 characters long")
        .max(100,"Product name must be at most 100 characters long").optional(),

    description: z
        .string()
        .min(5,"Product description must be at least 5 characters long")
        .max(1000,"Product description must be at most 1000 characters long").optional(),
    price: z.preprocess(
        (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
        z.number().positive("Product price must be a positive number").optional()
    ),

    stock: z.preprocess(
        (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined),
        z.number().int().nonnegative("Stock must be a non-negative number").optional()
    ),
    category: z.array(z.string()
        .min(2,"Category name must be at least 2 characters long")
        .max(100,"Category name must be at most 100 characters long")
        .nonempty("Category name cannot be empty")).optional(),
});
