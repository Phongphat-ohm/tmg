"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const https = __importStar(require("https")); // เพิ่ม import นี้
const twApi = (a, p) => __awaiter(void 0, void 0, void 0, function* () {
    a = a.replace("https://gift.truemoney.com/campaign/?v=", "");
    // แก้ไขนี้เพื่อให้ TypeScript เข้าใจชนิดของ httpsAgent
    const httpsAgent = new https.Agent({
        maxVersion: 'TLSv1.3',
        minVersion: 'TLSv1.3',
    });
    const config = {
        method: 'post',
        url: `https://gift.truemoney.com/campaign/vouchers/${a}/redeem`,
        data: {
            "mobile": `${p}`
        },
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36 Edg/84.0.522.52",
            "Content-Type": "application/json",
        },
        httpsAgent: httpsAgent, // ใช้ตัวแปรที่เราได้ประกาศขึ้นมา
    };
    try {
        const response = yield (0, axios_1.default)(config);
        return response.data;
    }
    catch (error) {
        if (error.response) {
            return error.response.data;
        }
        else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from the server.');
        }
        else {
            console.error('Error setting up the request.');
        }
        return null;
    }
});
exports.default = twApi;
