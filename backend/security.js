import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

export const applySecurity = (app) => {
    // Basic security headers
    app.use(helmet());

    // Prevent too many requests (basic DDoS protection)
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 300, // 300 requests per IP
            message: "Too many requests, please try again later."
        })
    );

    // CORS configuration
    app.use(
        cors({
            origin: process.env.CLIENT_URL || "*",
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE"]
        })
    );
};
