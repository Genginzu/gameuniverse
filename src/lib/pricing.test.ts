/**
 * Tests for pricing utility functions
 * These tests verify that the database functions work correctly
 */

import { describe, test, expect, beforeAll } from "bun:test";
import {
  getGamePrices,
  getBestPrice,
  compareGamePrices,
  getActiveStores,
  searchStores,
  createStore,
  updateStore,
  validateStoreData,
  getStoreStats,
  createDetailedPriceComparison,
} from "./pricing";
import type { StorePayload } from "./pricing-types";

// Test data - these should exist in the seed data
const TEST_GAME_SLUG = "the-witcher-3";
const TEST_STORE_NAME = "Steam";

describe("Pricing Functions", () => {
  test("getActiveStores should return active stores", async () => {
    const stores = await getActiveStores();

    expect(stores).toBeDefined();
    expect(Array.isArray(stores)).toBe(true);
    expect(stores.length).toBeGreaterThan(0);

    // Check that all returned stores are active
    stores.forEach((store) => {
      expect(store.is_active).toBe(true);
      expect(store.name).toBeDefined();
      expect(store.id).toBeDefined();
    });

    // Check that Steam is in the list
    const steamStore = stores.find((store) => store.name === "Steam");
    expect(steamStore).toBeDefined();
    expect(steamStore?.website_url).toBe("https://store.steampowered.com");
  });

  test("searchStores should find stores by name", async () => {
    const stores = await searchStores("Steam");

    expect(stores).toBeDefined();
    expect(Array.isArray(stores)).toBe(true);
    expect(stores.length).toBeGreaterThan(0);

    // Should find Steam store
    const steamStore = stores.find((store) => store.name === "Steam");
    expect(steamStore).toBeDefined();
  });

  test("searchStores should find stores by partial name", async () => {
    const stores = await searchStores("Epic");

    expect(stores).toBeDefined();
    expect(Array.isArray(stores)).toBe(true);

    // Should find Epic Games Store
    const epicStore = stores.find((store) => store.name.includes("Epic"));
    expect(epicStore).toBeDefined();
  });

  // Note: We can't easily test the game pricing functions without knowing the exact game IDs
  // from the database, as they are UUIDs generated during seeding.
  // In a real scenario, we would either:
  // 1. Query for a known game first to get its ID
  // 2. Use a fixed UUID in test data
  // 3. Create test data specifically for testing

  test("createStore should validate and create a new store", async () => {
    const uniqueName = `Test Store ${Date.now()}`;
    const storeData: StorePayload = {
      name: uniqueName,
      website_url: "https://teststore.com",
      logo_url: "https://teststore.com/logo.png",
    };

    const result = await createStore(storeData);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.store_id).toBeDefined();
    expect(result.message).toContain("succès");
  });

  test("createStore should reject duplicate store names", async () => {
    // Try to create a store with the same name as Steam
    const storeData: StorePayload = {
      name: "Steam",
      website_url: "https://duplicate.com",
    };

    const result = await createStore(storeData);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.message).toContain("existe déjà");
  });

  test("createStore should reject invalid URLs", async () => {
    const uniqueName = `Invalid URL Store ${Date.now()}`;
    const storeData: StorePayload = {
      name: uniqueName,
      website_url: "not-a-valid-url",
    };

    const result = await createStore(storeData);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.message).toContain("http");
  });

  test("validateStoreData should validate store information", async () => {
    const validStoreData: StorePayload = {
      name: "Valid Store",
      website_url: "https://validstore.com",
      logo_url: "https://validstore.com/logo.png",
    };

    const result = await validateStoreData(validStoreData);

    expect(result).toBeDefined();
    expect(result.is_valid).toBe(true);
    // The function returns a success message instead of null for valid data
    expect(result.error_message).toBeDefined();
  });

  test("validateStoreData should reject invalid data", async () => {
    const invalidStoreData: StorePayload = {
      name: "", // Empty name should be invalid
      website_url: "not-a-url",
    };

    const result = await validateStoreData(invalidStoreData);

    expect(result).toBeDefined();
    expect(result.is_valid).toBe(false);
    expect(result.error_message).toBeDefined();
  });
});
