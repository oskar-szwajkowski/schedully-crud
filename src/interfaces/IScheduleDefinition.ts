export interface IScheduleDefinition {
    scheduleCode: string;
    createdAt: string;
    state: "CREATED" | "SUBMITTED" | "SCHEDULED"
    userId: string;
    title: string;
    description?: string;
}
