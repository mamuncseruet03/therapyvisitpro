import { describe, it, expect } from "vitest";
import { getClientIp } from "./logger";

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const headers = new Headers({ "x-forwarded-for": "192.168.1.1, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("192.168.1.1");
  });

  it("extracts single IP from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.50" });
    expect(getClientIp(headers)).toBe("203.0.113.50");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "10.0.0.5" });
    expect(getClientIp(headers)).toBe("10.0.0.5");
  });

  it("returns unknown when no headers present", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4",
      "x-real-ip": "5.6.7.8",
    });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });
});
