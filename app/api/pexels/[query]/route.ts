import { Image } from "@/app/page";
import { NextResponse } from "next/server";
import { env } from "process";

const baseUrl = "https://api.pexels.com";

interface Params {
    params: {
        query: string;
    };
}

export async function GET(request: Request, { params }: Params) {
    const query = params.query;
    const url = baseUrl + `/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": env.PEXEL_KEY || "",
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        return NextResponse.json(data.photos, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Error retrieving image data"} , { status: 500 });
}
}
