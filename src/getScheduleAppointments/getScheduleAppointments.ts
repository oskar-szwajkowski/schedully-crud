import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { IScheduleAppointments } from "../interfaces/IScheduleAppointments";
import { ISubmitSchedule } from "../interfaces/ISubmitSchedule";
import { DynamoDB } from "aws-sdk";
import { corsWrapper } from "../corsWrapper/corsWrapper";

const docDynamoDb = new DynamoDB.DocumentClient();

const getScheduleAppointments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const scheduleCode = event.pathParameters?.scheduleCode;

    if (!scheduleCode) return reponse400;

    try {
        const response = await getScheduleSubmissions(scheduleCode);
        return {
            statusCode: 200,
            body: JSON.stringify(response)
        }
    } catch (error) {
        console.error("ERROR IN getScheduleAppointments", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorCode: "GET_SCHEDULE.SERVICE_ERROR",
            })
        }
    }
}

async function getScheduleSubmissions(scheduleCode: string): Promise<IScheduleAppointments> {
    const tableName = `schedules-submissions-${process.env.REGION}`;
    const response = await docDynamoDb.query({
        TableName: tableName,
        KeyConditionExpression: "#schedulecode = :schedulecode",
        ExpressionAttributeNames: {
            "#schedulecode": "schedule-code"
        },
        ExpressionAttributeValues: {
            ":schedulecode": scheduleCode
        }
    }).promise();
    return {
        submissions: (response.Items || []).map(item => DynamoDB.Converter.unmarshall(item)) as ISubmitSchedule[]
    };
}

const reponse400 = {
    statusCode: 400,
    body: JSON.stringify({ errorCode: "GET_SCHEDULE.MISSING_CODE" })
}

const getScheduleAppointmentsHandler = corsWrapper(getScheduleAppointments)
export { getScheduleAppointmentsHandler }
