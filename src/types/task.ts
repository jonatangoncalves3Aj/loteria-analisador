export type TaskId = string;
export type GroupId = string;

export interface Task {
  id: TaskId;
  name: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  progress: number;
  resourceIds: string[];
  groupId: GroupId | null;
  isMilestone: boolean;
  note: string;
  color: string | null;
  wbsIndex: number[];
}

export interface TaskGroup {
  id: GroupId;
  name: string;
  collapsed: boolean;
  parentGroupId: GroupId | null;
  wbsIndex: number[];
}
