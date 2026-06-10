import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebhookService } from "../../server/services/webhook.service";
import axios from "axios";

// Mock axios to check dispatcher tracking
vi.mock("axios");

describe("WebhookService Unit Tests", () => {
  const workspaceId = "test_workspace_99";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully register a new webhook subscription channel", async () => {
    const url = "https://hooks.zapier.com/catch/test/123";
    const events = ["client.created", "payment.completed"];

    const sub = await WebhookService.createSubscription(workspaceId, url, events);

    expect(sub).toBeDefined();
    expect(sub.id).toBeDefined();
    expect(sub.url).toBe(url);
    expect(sub.events).toContain("client.created");
    expect(sub.events).toContain("payment.completed");
    expect(sub.isActive).toBe(true);
  });

  it("should retrieve active webhook subscriptions matched by tenant workspace", async () => {
    const activeSubs = await WebhookService.getSubscriptions(workspaceId);
    expect(Array.isArray(activeSubs)).toBe(true);
    expect(activeSubs.length).toBeGreaterThan(0);
    const hasMatch = activeSubs.some(s => s.workspaceId === workspaceId);
    expect(hasMatch).toBe(true);
  });

  it("should register successfully and disable a registered webhook subscription", async () => {
    const url = "https://hooks.make.com/test/987";
    const sub = await WebhookService.createSubscription(workspaceId, url, ["*"]);

    expect(sub.isActive).toBe(true);
    const deleteResult = await WebhookService.deleteSubscription(workspaceId, sub.id);
    expect(deleteResult).toBe(true);
  });

  it("should asynchronously dispatch outbound POST events to matching active webhooks", async () => {
    const dummyUrl = "https://hooks.n8n.io/test/456";
    const targetEvent = "payment.completed";
    
    // Register subscription for matching target event
    await WebhookService.createSubscription(workspaceId, dummyUrl, [targetEvent]);

    // Setup mock resolution for axios post
    const mockPostResult = { data: { success: true } };
    vi.mocked(axios.post).mockResolvedValue(mockPostResult);

    // Trigger the simulated payment completed event
    const payload = { amount: "$99.00", currency: "USD", planName: "Agency Tier Pro" };
    await WebhookService.triggerEvent(workspaceId, targetEvent, payload);

    // Verify axios called the target webhook URL
    expect(axios.post).toHaveBeenCalled();
  });
});
