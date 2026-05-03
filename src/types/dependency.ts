import type { TaskId } from './task';

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface Dependency {
  id: string;
  predecessorId: TaskId;
  successorId: TaskId;
  type: DependencyType;
  lagDays: number;
}
