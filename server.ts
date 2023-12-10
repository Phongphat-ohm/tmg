console.clear();
import { Prisma, PrismaClient } from "@prisma/client";
import { log } from "console";
import crypto from 'crypto';
const fastify: FastifyInstance = require('fastify')({});
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();
import { FastifyInstance, FastifyRequest, FastifyReply, FastifyBodyParser } from 'fastify';
import { format, add } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import twApi from "./topup";

async function getWallet(code: string, phone_number: string) {
    const tw = await twApi(code, phone_number)
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
            }
        case "CANNOT_GET_OWN_VOUCHER":
            return {
                status: 400,
                code: "cannot_get_own_voucher",
                message: "ไม่สามารถรับซองของขวัญของตัวเองได้"
            }
        case "TARGET_USER_NOT_FOUND":
            return {
                status: 400,
                code: "target_user_not_found",
                message: "ไม่พบเบอร์นี้ในระบบ"
            }
        case "INTERNAL_ERROR":
            return {
                status: 400,
                code: "internal_error",
                message: "ไม่ซองนี้ในระบบ หรือ URL ผิด"
            }
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
            }
        case "VOUCHER_NOT_FOUND":
            return {
                status: 400,
                code: "voucher_not_found",
                message: "ไม่พบซองในระบบ"
            }
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
            }
        default:
            break;
    }
}


interface RequestBody {
    phone_number: string;
    username: string;
    password: string;
}

interface Responce {
    status: number;
    code: string;
    message: string;
    data: object;
}

interface UserData {
    userId: number;
    username: string;
}

function generateToken(data: User_detail, expiresIn: string = '2h'): string {
    const token = jwt.sign(data, '331040', { expiresIn });

    return token;
}

function hash256(data: any): string {
    return crypto.createHash("sha256").update(data).digest("hex");
}

fastify.post("/user/signup", async (req: FastifyRequest<{ Body: RequestBody }>, reply) => {
    const body: RequestBody = req.body;
    let responce: object = {};
    const phone_number: string = body.phone_number;
    const username: string = body.username;
    const password: string = body.password;
    const encrypt: string = hash256(password);

    if (phone_number == "") {
        responce = {
            status: 404,
            code: "phone_number_is_empty",
            message: "หมายเลขโทรศัพท์เป็นค่าว่าง"
        }
    } else if (username == "") {
        responce = {
            status: 404,
            code: "username_is_empty",
            message: "ชื่อผู้ใช้เป็นค่าว่าง"
        }
    } else if (password == "") {
        responce = {
            status: 404,
            code: "password_is_empty",
            message: "รหัสผ่านชื่อผู้ใช้เป็นค่าว่าง"
        }
    } else {
        const user: object | null = await prisma.users.findFirst({
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
            const create_user: object = await prisma.users.create({
                data: {
                    Phonenumber: phone_number,
                    Username: username,
                    Password: encrypt
                }
            })

            responce = {
                status: 200,
                code: "success",
                message: "สำเร็จ",
                data: create_user
            }
        } else {
            responce = {
                status: 400,
                code: "username_or_phonenumber_have",
                message: "มีชื่อผู้ใช้หรือหมายเลขโทรศัพท์แล้วแล้ว"
            }
        }
    }

    reply.send(responce);
});

interface Login_body {
    username: string;
    password: string;
}

interface User_detail {
    ID: number;
    Username: string;
    Password: string;
}

fastify.post("/user/login", async (req: FastifyRequest<{ Body: Login_body }>, reply) => {
    const body: Login_body = req.body;
    let responce: object | null = {};
    const username: string = body.username;
    const password: string = body.password;
    const encrypt: string = hash256(password);

    if (username == "") {
        responce = {
            status: 404,
            code: "username_is_empty",
            message: "ชื่อผู้ใช้เป็นค่าว่าง"
        }
    } else if (password == "") {
        responce = {
            status: 404,
            code: "password_is_empty",
            message: "รหัสผ่านเป็นค่าว่าง"
        }
    } else {
        const user: User_detail | null = await prisma.users.findFirst({
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
        })

        if (user == null) {
            responce = {
                status: 404,
                code: "not_found_user",
                message: "ไม่พบผู้ใช้"
            }
        } else {
            responce = {
                status: 200,
                code: "success",
                message: "สำเร็จ",
                data: {
                    ID: user.ID,
                    Username: user.Username
                }
            }
        }
    }

    reply.send(responce);
})

fastify.post("/api/auth/new", async (req: FastifyRequest<{ Body: Login_body }>, reply) => {
    const body: Login_body = req.body;
    let responce: Responce | object = {};
    const username: string = body.username;
    const password: string = body.password;

    if (username == "") {
        responce = {
            status: 404,
            code: "username_is_empty",
            message: "ชื่อผู้ใช้เป็นค้าว่าง"
        }
    } else if (password == "") {
        responce = {
            status: 404,
            code: "password_is_empty",
            message: "รหัสผ่านเป็นค้าว่าง"
        }
    } else {
        const user_data: User_detail | null = await prisma.users.findFirst({
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
        })


        if (user_data == null) {
            responce = {
                status: 404,
                code: "authentication_fail",
                message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
            }
        } else {
            const token: string = await generateToken(user_data, "2h");
            const add_token: any = await prisma.tokens.create({
                data: {
                    ID_customer: user_data.ID,
                    Token: token,
                    Create_At: new Date(),
                    Status: 0,
                    Expire: new Date()
                }
            })

            if (add_token) {
                responce = {
                    status: 200,
                    code: "authentication_success",
                    message: "สำเร็จ",
                    data: {
                        token: token
                    }
                }
            } else {
                responce = {
                    status: 500,
                    code: "internal_server_error",
                    message: "มีข้อผิดพลาดที่ server"
                }
            }
        }
    }

    reply.send(responce);
})

interface headers {
    tokens: string;
    code: string
}

interface vertify {
    ID: number
    ID_customer: number
    Token: string
    Status: number
    Create_At: any
    Expire: any
}

fastify.post("/api/auth", async (req: FastifyRequest<{ Headers: headers }>, reply) => {
    const headers: headers = req.headers;
    const token = headers.tokens;
    const code = headers.code;
    let responce: Responce | object = {};

    const auth = await jwt.verify(token, "331040");

    if (auth) {
        const selected_token: vertify | null = await prisma.tokens.findFirst({
            where: {
                Token: token
            }
        })

        if (selected_token == null) {
            responce = {
                status: 404,
                code: "not_foun_token",
                message: "ไม่พบโทเคน"
            }
        } else {
            const { Status, ID_customer } = selected_token;
            const get_user = await prisma.users.findFirst({
                where: {
                    ID: ID_customer
                }
            });

            if (get_user == null) {
                responce = {
                    status: 500,
                    code: "internal_server_error",
                    message: "มีข้อผิดพลาดที่ server"
                }
            } else {
                if (Status == 0) {
                    const get = await getWallet(code, get_user.Phonenumber);

                    if (get?.status == 200) {
                        responce = {
                            status: 200,
                            code: "succcess",
                            message: "สำเร็จ",
                            data: get
                        }

                        const update = await prisma.tokens.updateMany({
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
                            }
                        } else {
                            responce = {
                                status: 500,
                                code: "internal_server_error",
                                message: "มีข้อผิดพลาดที่ server"
                            }
                        }
                    } else if (get?.status == 401) {
                        responce = {
                            status: 400,
                            code: "error",
                            message: "มีข้อผิดพลาด",
                            data: get
                        }
                    } else {
                        responce = {
                            status: 400,
                            code: "error",
                            message: "มีข้อผิดพลาด",
                            data: get
                        }
                    }
                } else {
                    responce = {
                        status: 400,
                        code: "token_expire",
                        message: "มีการใช้ token นี้แล้ว"
                    }
                }
            }
        }
    }

    reply.send(responce);
})

fastify.listen({
    port: 4567
}, (err, address) => {
    if (err) throw err;
    console.log(`Server listening on ${address}`);
});

module.exports = fastify;