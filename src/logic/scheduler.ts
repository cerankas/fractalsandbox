import { getMs } from "~/math/util";

export interface SchedulerTask {
  process: () => void;
  isPrepared: () => boolean;
  isFinished: () => boolean;
}

export default class BackgroundScheduler {
  queue = new Array<SchedulerTask>();
  timer: NodeJS.Timeout | null = null;
  start = 0;

  addTask(task: SchedulerTask) {
    this.queue.push(task);
  }

  run() {
    if (this.timer === null) {
      this.scheduleNextCall();
      this.start = getMs();
    }
  }

  scheduleNextCall() { this.timer = setTimeout(this.process, 1); }
 
  getTaskToProcess() {
    for (const task of this.queue) if (!task.isPrepared()) return task;
    for (const task of this.queue) if (!task.isFinished()) return task;
    return null;
  }

  process = () => {
    const start = getMs();
    
    while (getMs() - start < 40) {
      const task = this.getTaskToProcess();
      if (task) {
        task.process();
      }
      else {
        this.timer = null;
        console.log(getMs() - this.start);
        return;
      }
    }
    this.scheduleNextCall();
  }
}