export class OutgoingQueue {

  private queue: ArrayBuffer[] = [];

  push(data: ArrayBuffer) {
    this.queue.push(data);
  }

  pop() {
    return this.queue.shift();
  }

  size() {
    return this.queue.length;
  }
}