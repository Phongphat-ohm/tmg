import axios, { AxiosRequestConfig } from 'axios';
import * as https from 'https';  // เพิ่ม import นี้

const twApi = async (a: string, p: string): Promise<any> => {
    a = a.replace("https://gift.truemoney.com/campaign/?v=", "");

    // แก้ไขนี้เพื่อให้ TypeScript เข้าใจชนิดของ httpsAgent
    const httpsAgent = new https.Agent({
        maxVersion: 'TLSv1.3',
        minVersion: 'TLSv1.3',
    });

    const config: AxiosRequestConfig = {
        method: 'post',
        url: `https://gift.truemoney.com/campaign/vouchers/${a}/redeem`,
        data: {
            "mobile": `${p}`
        },
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36 Edg/84.0.522.52",
            "Content-Type": "application/json",
        },
        httpsAgent: httpsAgent,  // ใช้ตัวแปรที่เราได้ประกาศขึ้นมา
    };

    try {
        const response = await axios(config);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from the server.');
        } else {
            console.error('Error setting up the request.');
        }
        return null;
    }
};

export default twApi;
