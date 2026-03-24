import { Anthropic } from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
    try {
        const response = await anthropic.models.list();
        console.log("Anthropic Models:", response.data.map((m: any) => m.id).filter((id: string) => id.includes('claude')));
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}
main();
