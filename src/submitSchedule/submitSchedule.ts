import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ISubmitSchedule } from "../interfaces/ISubmitSchedule";
import { corsWrapper } from "../corsWrapper/corsWrapper";

const docDynamoDB = new DynamoDB.DocumentClient()

const submitSchedule = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) return response400;

    const body: ISubmitSchedule = JSON.parse(event.body);

    if (!body.userId || !body.nickname || !body.appointments) return response400;

    const scheduleCode = event.pathParameters?.scheduleCode;

    if (!scheduleCode) return response400;

    try {
        await handleScheduleSubmitted(body, scheduleCode);
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: `Schedule ${scheduleCode} submitted for user ${body.userId}`
            })
        }

    } catch (error) {
        console.error("ERROR IN submitSchedule", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorCode: "SUBMIT_SCHEDULE.SERVICE_ERROR",
            })
        }
    }
}

async function handleScheduleSubmitted(scheduleSubmission: ISubmitSchedule, scheduleCode: string) {
    const dbScheduleSubmission = DynamoDB.Converter.marshall(scheduleSubmission);
    await docDynamoDB.put({
        TableName: `schedules-submissions-${process.env.REGION}`,
        Item: {
            ...dbScheduleSubmission,
            "schedule-code": scheduleCode,
            "userId": scheduleSubmission.userId
        },
    }).promise()
}

const response400 = {
    statusCode: 400,
    body: JSON.stringify({
        fields: {
            userId: "string",
            nickname: "string",
            appointments: {
                type: "array",
                item: {
                    startDate: "string",
                    endDate: "string"
                }
            }
        },
        required: ["userId", "nickname", "appointments"]
    })
}

const submitScheduleHandler = corsWrapper(submitSchedule);
export { submitScheduleHandler }