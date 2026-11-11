import { describe, expect, it, vi } from "vitest";
import { createInMemoryEventBus } from "./bus";

type Events = { "thing.happened": { id: string }; "other.happened": { n: number } };

describe("in-memory event bus", () => {
  it("delivers a payload to every subscriber of that event only", async () => {
    const bus = createInMemoryEventBus<Events>();
    const first = vi.fn();
    const second = vi.fn();
    const unrelated = vi.fn();
    bus.subscribe("thing.happened", first);
    bus.subscribe("thing.happened", second);
    bus.subscribe("other.happened", unrelated);

    await bus.publish("thing.happened", { id: "a" });

    expect(first).toHaveBeenCalledExactlyOnceWith({ id: "a" });
    expect(second).toHaveBeenCalledExactlyOnceWith({ id: "a" });
    expect(unrelated).not.toHaveBeenCalled();
  });

  it("stops delivering after unsubscribe", async () => {
    const bus = createInMemoryEventBus<Events>();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe("thing.happened", handler);
    unsubscribe();
    await bus.publish("thing.happened", { id: "a" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("isolates a failing handler from the publisher and other handlers", async () => {
    const report = vi.fn();
    const bus = createInMemoryEventBus<Events>(report);
    const healthy = vi.fn();
    const failure = new Error("boom");
    bus.subscribe("thing.happened", () => {
      throw failure;
    });
    bus.subscribe("thing.happened", async () => {
      throw failure;
    });
    bus.subscribe("thing.happened", healthy);

    await expect(bus.publish("thing.happened", { id: "a" })).resolves.toBeUndefined();

    expect(healthy).toHaveBeenCalledOnce();
    expect(report).toHaveBeenCalledTimes(2);
    expect(report).toHaveBeenCalledWith(failure, "thing.happened");
  });

  it("does nothing when nobody listens", async () => {
    const bus = createInMemoryEventBus<Events>();
    await expect(bus.publish("other.happened", { n: 1 })).resolves.toBeUndefined();
  });
});
