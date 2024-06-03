// backend/security.js
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import cors from "cors";
import cookieParser from "cookie-parser";

export default function applySecurity(app) {
  app.use(helmet());
  app.use(cookieParser());
  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }));

  // body size limit - increase only if you need big uploads
  app.use(express.json({ limit: "50kb" }));
  app.use(express.urlencoded({ extended: true, limit: "50kb" }));

  app.use(mongoSanitize());
  app.use(xss());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // hide express fingerprint
  app.disable("x-powered-by");
}
