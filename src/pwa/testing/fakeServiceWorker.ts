/**
 * Minimal service-worker doubles for tests.
 *
 * They model only what the host layer observes: a registration that gains a
 * waiting worker, a worker that receives messages, and a container that
 * announces a controller change.
 */

export class FakeServiceWorker extends EventTarget {
  readonly messages: unknown[] = [];
  state: ServiceWorkerState = "installing";

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  setState(state: ServiceWorkerState): void {
    this.state = state;
    this.dispatchEvent(new Event("statechange"));
  }
}

export class FakeServiceWorkerRegistration extends EventTarget {
  installing: FakeServiceWorker | null = null;
  waiting: FakeServiceWorker | null = null;

  /** Installs a new worker that then waits behind the active one. */
  installUpdate(): FakeServiceWorker {
    const worker = new FakeServiceWorker();
    this.installing = worker;
    this.dispatchEvent(new Event("updatefound"));
    this.installing = null;
    this.waiting = worker;
    worker.setState("installed");
    return worker;
  }

  /** The waiting worker took over, so it is no longer waiting. */
  finishActivation(): void {
    const worker = this.waiting;
    this.waiting = null;
    worker?.setState("activated");
  }

  asRegistration(): ServiceWorkerRegistration {
    return this as unknown as ServiceWorkerRegistration;
  }
}

export class FakeServiceWorkerContainer extends EventTarget {
  /** The browser handed control of this page to a different worker. */
  changeController(): void {
    this.dispatchEvent(new Event("controllerchange"));
  }

  asContainer(): ServiceWorkerContainer {
    return this as unknown as ServiceWorkerContainer;
  }
}
