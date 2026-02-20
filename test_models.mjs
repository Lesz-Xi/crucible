import { Anthropic } from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

async function main() {
    try {
        const response = await anthropic.models.list();
        console.log("Anthropic Models:", response.data.map((m) => m.id).filter(id => id.includes('claude')));
    } catch (e) {
        console.log("Error:", e.message);
    }
}
main();
