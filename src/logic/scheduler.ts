import { getMs } from "~/math/util";

export interface SchedulerTask {
  process: () => void;
  isPrepared: () => boolean;
  isFinished: () => boolean;
}

export default class BackgroundScheduler {
  queue = new SchedulerQueue();
  timer: NodeJS.Timeout | null = null;

  addTask(task: SchedulerTask) {
    this.queue.addTask(task);
    if (this.isFinished()) this.scheduleNextCall();
  }

  removeTask(task: SchedulerTask) {
    this.queue.removeTask(task);
    if (this.queue.getTaskToProcess() == null) this.timer = null;
  }

  process = () => {
    const startMs = getMs();
    while (getMs() - startMs < 20) {
      const task = this.queue.getTaskToProcess();
      if (task) {
        task.process();
        if (task.isFinished()) this.removeTask(task);
      }
      else {
        this.timer = null;
        return;
      }
    }
    this.scheduleNextCall();
  }

  scheduleNextCall() { 
    this.timer = setTimeout(this.process, 0); 
  }

  isFinished() { 
    return this.timer === null; 
  }
}

class SchedulerQueue {
  queue = new Array<SchedulerTask>();

  getTaskToProcess() {
    for (const task of this.queue) if (!task.isPrepared()) return task;
    for (const task of this.queue) if (!task.isFinished()) return task;
    return null;
  }

  addTask(task: SchedulerTask) {
    if (this.queue.includes(task)) return;
    this.queue.push(task);
  }

  removeTask(task: SchedulerTask) {
    if (!this.queue.includes(task)) return;
    this.queue.splice(this.queue.indexOf(task), 1);
  }
}