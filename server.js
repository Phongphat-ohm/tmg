"use strict";
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
console.clear();
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const fastify = require('fastify')({});
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const topup_1 = __importDefault(require("./topup"));
function getWallet(code, phone_number) {
    return __awaiter(this, void 0, void 0, function* () {
        const tw = yield (0, topup_1.default)(code, phone_number);
        switch (tw.status.code) {
            case "SUCCESS":
                return {
                    status: 200,
                    code: "success",
                    message: "สำเร็จ",
                    data: {
                        link: tw.data.voucher.link,
                        amount: tw.data.voucher.amount_baht,
                        owner: tw.data.owner_profile.full_name
                    }
                };
            case "CANNOT_GET_OWN_VOUCHER":
                return {
                    status: 400,
                    code: "cannot_get_own_voucher",
                    message: "ไม่สามารถรับซองของขวัญของตัวเองได้"
                };
            case "TARGET_USER_NOT_FOUND":
                return {
                    status: 400,
                    code: "target_user_not_found",
                    message: "ไม่พบเบอร์นี้ในระบบ"
                };
            case "INTERNAL_ERROR":
                return {
                    status: 400,
                    code: "internal_error",
                    message: "ไม่ซองนี้ในระบบ หรือ URL ผิด"
                };
            case "VOUCHER_OUT_OF_STOCK":
                return {
                    status: 401,
                    code: "voucher_out_of_stock",
                    message: "มีคนรับไปแล้ว",
                    data: {
                        link: tw.data.voucher.link,
                        amount: tw.data.voucher.amount_baht,
                        owner: tw.data.owner_profile.full_name
                    }
                };
            case "VOUCHER_NOT_FOUND":
                return {
                    status: 400,
                    code: "voucher_not_found",
                    message: "ไม่พบซองในระบบ"
                };
            case "VOUCHER_EXPIRED":
                return {
                    status: 401,
                    code: "voucher_expired",
                    message: "ซองวอเลทนี้หมดอายุแล้ว",
                    data: {
                        link: tw.data.voucher.link,
                        amount: tw.data.voucher.amount_baht,
                        owner: tw.data.owner_profile.full_name
                    }
                };
            default:
                break;
        }
    });
}
function generateToken(data, expiresIn = '2h') {
    const token = jsonwebtoken_1.default.sign(data, '331040', { expiresIn });
    return token;
}
function hash256(data) {
    return crypto_1.default.createHash("sha256").update(data).digest("hex");
}
fastify.post("/user/signup", (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    let responce = {};
    const phone_number = body.phone_number;
    const username = body.username;
    const password = body.password;
    const encrypt = hash256(password);
    if (phone_number == "") {
        responce = {
            status: 404,
            code: "phone_number_is_empty",
            message: "หมายเลขโทรศัพท์เป็นค่าว่าง"
        };
    }
    else if (username == "") {
        responce = {
            status: 404,
            code: "username_is_empty",
            message: "ชื่อผู้ใช้เป็นค่าว่าง"
        };
    }
    else if (password == "") {
        responce = {
            status: 404,
            code: "password_is_empty",
            message: "รหัสผ่านชื่อผู้ใช้เป็นค่าว่าง"
        };
    }
    else {
        const user = yield prisma.users.findFirst({
            where: {
                OR: [
                    {
                        Phonenumber: phone_number
                    },
                    {
                        Username: username
                    }
                ]
            }
        });
        if (user == null) {
            const create_user = yield prisma.users.create({
                data: {
                    Phonenumber: phone_number,
                    Username: username,
                    Password: encrypt
                }
            });
            responce = {
                status: 200,
                code: "success",
                message: "สำเร็จ",
                data: create_user
            };
        }
        else {
            responce = {
                status: 400,
                code: "username_or_phonenumber_have",
                message: "มีชื่อผู้ใช้หรือหมายเลขโทรศัพท์แล้วแล้ว"
            };
        }
    }
    reply.send(responce);
}));
fastify.post("/user/login", (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    let responce = {};
    const username = body.username;
    const password = body.password;
    const encrypt = hash256(password);
    if (username == "") {
        responce = {
            status: 404,
            code: "username_is_empty",
            message: "ชื่อผู้ใช้เป็นค่าว่าง"
        };
    }
    else if (password == "") {
        responce = {
            status: 404,
            code: "password_is_empty",
            message: "รหัสผ่านเป็นค่าว่าง"
        };
    }
    else {
        const user = yield prisma.users.findFirst({
            where: {
                AND: [
                    {
                        Username: username
                    },
                    {
                        Password: encrypt
                    }
                ]
            }
        });
        if (user == null) {
            responce = {
                status: 404,
                code: "not_found_user",
                message: "ไม่พบผู้ใช้"
            };
        }
        else {
            responce = {
                status: 200,
                code: "success",
                message: "สำเร็จ",
                data: {
                    ID: user.ID,
                    Username: user.Username
                }
            };
        }
    }
    reply.send(responce);
}));
fastify.post("/api/auth/new", (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    let responce = {};
    const username = body.username;
    const password = body.password;
    if (username == "") {
        responce = {
            status: 404,
            code: "username_is_empty",
            message: "ชื่อผู้ใช้เป็นค้าว่าง"
        };
    }
    else if (password == "") {
        responce = {
            status: 404,
            code: "password_is_empty",
            message: "รหัสผ่านเป็นค้าว่าง"
        };
    }
    else {
        const user_data = yield prisma.users.findFirst({
            where: {
                AND: [
                    {
                        Username: username
                    },
                    {
                        Password: password
                    }
                ]
            }
        });
        if (user_data == null) {
            responce = {
                status: 404,
                code: "authentication_fail",
                message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
            };
        }
        else {
            const token = yield generateToken(user_data, "2h");
            const add_token = yield prisma.tokens.create({
                data: {
                    ID_customer: user_data.ID,
                    Token: token,
                    Create_At: new Date(),
                    Status: 0,
                    Expire: new Date()
                }
            });
            if (add_token) {
                responce = {
                    status: 200,
                    code: "authentication_success",
                    message: "สำเร็จ",
                    data: {
                        token: token
                    }
                };
            }
            else {
                responce = {
                    status: 500,
                    code: "internal_server_error",
                    message: "มีข้อผิดพลาดที่ server"
                };
            }
        }
    }
    reply.send(responce);
}));
fastify.post("/api/auth", (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const headers = req.headers;
    const token = headers.tokens;
    const code = headers.code;
    let responce = {};
    const auth = yield jsonwebtoken_1.default.verify(token, "331040");
    if (auth) {
        const selected_token = yield prisma.tokens.findFirst({
            where: {
                Token: token
            }
        });
        if (selected_token == null) {
            responce = {
                status: 404,
                code: "not_foun_token",
                message: "ไม่พบโทเคน"
            };
        }
        else {
            const { Status, ID_customer } = selected_token;
            const get_user = yield prisma.users.findFirst({
                where: {
                    ID: ID_customer
                }
            });
            if (get_user == null) {
                responce = {
                    status: 500,
                    code: "internal_server_error",
                    message: "มีข้อผิดพลาดที่ server"
                };
            }
            else {
                if (Status == 0) {
                    const get = yield getWallet(code, get_user.Phonenumber);
                    if ((get === null || get === void 0 ? void 0 : get.status) == 200) {
                        responce = {
                            status: 200,
                            code: "succcess",
                            message: "สำเร็จ",
                            data: get
                        };
                        const update = yield prisma.tokens.updateMany({
                            where: {
                                Token: token,
                            },
                            data: {
                                Status: 1,
                            },
                        });
                        if (update) {
                            responce = {
                                status: 200,
                                code: "succcess",
                                message: "สำเร็จ"
                            };
                        }
                        else {
                            responce = {
                                status: 500,
                                code: "internal_server_error",
                                message: "มีข้อผิดพลาดที่ server"
                            };
                        }
                    }
                    else if ((get === null || get === void 0 ? void 0 : get.status) == 401) {
                        responce = {
                            status: 400,
                            code: "error",
                            message: "มีข้อผิดพลาด",
                            data: get
                        };
                    }
                    else {
                        responce = {
                            status: 400,
                            code: "error",
                            message: "มีข้อผิดพลาด",
                            data: get
                        };
                    }
                }
                else {
                    responce = {
                        status: 400,
                        code: "token_expire",
                        message: "มีการใช้ token นี้แล้ว"
                    };
                }
            }
        }
    }
    reply.send(responce);
}));

fastify.get("/", (req, reply) => {
    reply.send("Hello this is a my api");
})

fastify.listen({
    port: 4567
}, (err, address) => {
    if (err)
        throw err;
    console.log(`Server listening on ${address}`);
});
module.exports = fastify;
