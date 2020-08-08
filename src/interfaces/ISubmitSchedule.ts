import { IAppointment } from "./IAppointment";

export interface ISubmitSchedule {
    nickname: string;
    userId: string;
    appointments: IAppointment[];
}
