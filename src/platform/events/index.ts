import type { AppEvents } from "@/shared/events";
import { createInMemoryEventBus, type EventBus } from "./bus";

export type { EventBus, EventHandler } from "./bus";
export { createInMemoryEventBus } from "./bus";

let bus: EventBus<AppEvents> | undefined;

/** Process-wide application event bus. */
export function getEventBus(): EventBus<AppEvents> {
  bus ??= createInMemoryEventBus<AppEvents>();
  return bus;
}
