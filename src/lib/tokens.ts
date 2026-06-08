import { customAlphabet } from "nanoid";

// URL-safe token for rate pages + proposals — 12 chars, ~71 bits entropy
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const generateToken = customAlphabet(alphabet, 12);
