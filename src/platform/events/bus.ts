/**
 * Event bus port. Modules depend on this interface only, so the in-memory
 * implementation can be swapped for Postgres LISTEN/NOTIFY or Redis when the
 * app runs on more than one instance, without touching any module.
 */
export type EventHandler<TPayload> = (payload: TPayload) => void | Promise<void>;

export interface EventBus<TEvents extends Record<string, unknown>> {
  publish<K extends keyof TEvents>(name: K, payload: TEvents[K]): Promise<void>;
  /** Returns a function that removes the subscription. */
  subscribe<K extends keyof TEvents>(name: K, handler: EventHandler<TEvents[K]>): () => void;
}

export type EventErrorReporter = (error: unknown, eventName: string) => void;

/**
 * Single-process bus. A failing handler never breaks the publisher or the
 * other handlers: the error is reported and delivery continues.
 */
export function createInMemoryEventBus<TEvents extends Record<string, unknown>>(
  reportError: EventErrorReporter = (error, eventName) => {
    console.error(`Event handler failed for "${eventName}"`, error);
  },
): EventBus<TEvents> {
  const handlers = new Map<keyof TEvents, Set<EventHandler<never>>>();

  return {
    async publish(name, payload) {
      const registered = handlers.get(name);
      if (!registered) return;
      await Promise.all(
        [...registered].map(async (handler) => {
          try {
            await (handler as EventHandler<typeof payload>)(payload);
          } catch (error) {
            reportError(error, String(name));
          }
        }),
      );
    },
    subscribe(name, handler) {
      const registered = handlers.get(name) ?? new Set();
      registered.add(handler as EventHandler<never>);
      handlers.set(name, registered);
      return () => {
        registered.delete(handler as EventHandler<never>);
      };
    },
  };
}
