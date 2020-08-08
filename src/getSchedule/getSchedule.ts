import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { corsWrapper } from "../corsWrapper/corsWrapper";
import { IScheduleDefinition } from "../interfaces/IScheduleDefinition";

const docDynamoDb = new DynamoDB.DocumentClient();

const getSchedule = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const scheduleCode = event.pathParameters?.scheduleCode;

    if (!scheduleCode) return reponse400;

    try {
        const response = await getScheduleFromDynamo(scheduleCode);
        return {
            statusCode: 200,
            body: JSON.stringify(response)
        }
    } catch (error) {
        console.error("ERROR IN getSchedule", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                errorCode: "GET_SCHEDULE.SERVICE_ERROR"
            })
        }
    }
}

async function getScheduleFromDynamo(scheduleCode: string): Promise<IScheduleDefinition> {
    const tableName = `schedules-${process.env.REGION}`;
    const response = await docDynamoDb.get({
        TableName: tableName,
        Key: {
            "schedule-code": scheduleCode
        }
    }).promise();
    console.log(response);
    if (response.Item) {
        return response.Item as IScheduleDefinition;
    } else {
        throw new Error("MISSING_SCHEDULE");
    }

}

const reponse400 = {
    statusCode: 400,
    body: JSON.stringify({ errorCode: "GET_SCHEDULE.MISSING_CODE" })
}

const getScheduleHandler = corsWrapper(getSchedule)
export { getScheduleHandler }