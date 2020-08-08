import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ICreateSchedule } from "../interfaces/ICreateSchedule";
import { IScheduleDefinition } from "../interfaces/IScheduleDefinition";
import { randomBytes } from "crypto";
import * as base62 from "base62";
import { corsWrapper } from "../corsWrapper/corsWrapper";

const dynamoDB = new DynamoDB();

const createSchedule = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) return response400;

    const body: ICreateSchedule = JSON.parse(event.body);
    if (!body.title || !body.nickname) return response400;

    try {
        const createResult = await createNewSchedule(body);
        return {
            statusCode: 200,
            body: JSON.stringify(createResult)
        }
    } catch (error) {
        console.error("ERROR IN createSchedule", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorCode: "CREATE_SCHEDULE.SERVICE_ERROR"
            })
        }
    }
}

async function createNewSchedule(createDefinition: ICreateSchedule, retries = 0): Promise<IScheduleDefinition> {
    if (retries < 3) {
        const generatedBytes = randomBytes(10);
        const numberBE = generatedBytes.readUIntBE(0, 5);
        const numberLE = generatedBytes.readUIntLE(0, 5);
        const encoded = base62.encode(numberBE + numberLE);
        try {
            const createdTime = String(new Date().getTime());
            const item: DynamoDB.PutItemInputAttributeMap = {
                "schedule-code": {
                    "S": encoded
                },
                "createdAt": {
                    "N": createdTime
                },
                "state": {
                    "S": "CREATED"
                },
                "userId": {
                    "S": createDefinition.nickname
                },
                "title": {
                    "S": createDefinition.title
                }
            };
            if (createDefinition.description) {
                item.description = {
                    "S": createDefinition.description
                }
            }
            console.log(`putting item into schedules-${process.env.REGION}`, item)
            await dynamoDB.putItem({
                TableName: `schedules-${process.env.REGION}`,
                Item: item,
            }).promise();
            return {
                scheduleCode: encoded,
                createdAt: createdTime,
                state: "CREATED",
                userId: createDefinition.nickname,
                title: createDefinition.title,
                description: createDefinition.description
            }
        } catch (error) {
            console.error(error);
            return await createNewSchedule(createDefinition, retries + 1);
        }
    } else {
        throw new Error("Max retries exceeded");
    }
}

const response400 = {
    statusCode: 400,
    body: JSON.stringify({
        fields: {
            title: "string",
            nickname: "string",
            description: "string"
        },
        required: ["title", "nickname"]
    })
}

const createScheduleHandler = corsWrapper(createSchedule);
export { createScheduleHandler }