import redis from "../../../../lib/redis";

export default async function POST(req: Request): Promise<boolean> {
    const body = await req.json();
    const { email, otp } = body;
    const storedOtp = await redis.get(`otp${email}`);
    if (storedOtp === otp) {
        await redis.set(`isVerified${email}`, 'true');
        return true;
    } else return false;
}