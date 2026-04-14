import { describe, expect, it } from "vitest";
import { vishuTheme } from "./vishuTheme";

describe("vishuTheme", () => {
  it("has kasavu gold token", () => {
    expect(vishuTheme.colors.kasavuGold).toBeTruthy();
  });
});
