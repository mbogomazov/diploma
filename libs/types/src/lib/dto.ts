export type GetTaskIdDto = { id: string };
export type GetResultPendingDto = { status: 'pending' };
export type GetResultCompoleteDto = { status: 'complete'; result: string };
export type GetResultDto = GetResultPendingDto | GetResultCompoleteDto;
