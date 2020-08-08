import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const corsWrapper = (handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>): (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> => {
    return async (event: APIGatewayProxyEvent) => {
        if (event.httpMethod === "OPTIONS") {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: ""
            }
        }
        const res = await handler(event);
        res.headers = {
            ...(res.headers || {}),
            "Access-Control-Allow-Origin": "*",
        }
        return res;
    }
}