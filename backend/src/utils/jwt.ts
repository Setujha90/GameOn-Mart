import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

interface JwtPayload {
    userId: string;
    role: string;
}

export const generateTokens = (payload: JwtPayload) => {
    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    return { accessToken, refreshToken };
};
