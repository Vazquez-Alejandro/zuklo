import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Zuklo")).toBeVisible();
    await expect(page.locator("text=Alquileres")).toBeVisible();
  });

  test("has links to login and signup", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
  });

  test("has terms and privacy links in footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/terms"]')).toBeVisible();
    await expect(page.locator('a[href="/privacy"]')).toBeVisible();
  });
});

test.describe("Auth flow", () => {
  test("signup page renders", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("text=Creá tu cuenta")).toBeVisible();
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Iniciar sesión")).toBeVisible();
  });

  test("signup requires terms acceptance", async ({ page }) => {
    await page.goto("/signup");
    await page.fill('input[id="name"]', "Test User");
    await page.fill('input[id="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[id="password"]', "test123456");
    await page.fill('input[id="confirmPassword"]', "test123456");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Debés aceptar")).toBeVisible();
  });
});

test.describe("Legal pages", () => {
  test("terms page renders", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("text=Términos y Condiciones")).toBeVisible();
  });

  test("privacy page renders", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("text=Política de Privacidad")).toBeVisible();
  });
});

test.describe("Properties", () => {
  test("properties page loads", async ({ page }) => {
    await page.goto("/properties");
    await expect(page.locator("text=Propiedades")).toBeVisible();
  });
});
