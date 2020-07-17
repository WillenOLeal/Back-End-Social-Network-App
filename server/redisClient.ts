import * as Redis from "ioredis";

export const redis = new Redis(6379, '127.0.0.1'); 
