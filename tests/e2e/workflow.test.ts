import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebhookService } from "../../server/services/webhook.service";
import axios from "axios";

vi.mock("axios");

describe("E2E User Automation Workflow Tests", () => {
  const workspaceId = "tenant_e2e_88";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should capture client.created action, find matching webhook triggers, and propagate telemetry to third-party integrations", async () => {
    // 1. Arrange webhook registration
    const targetUrl = "https://hooks.zapier.com/catch/test/e2e-client-creation";
    await WebhookService.createSubscription(workspaceId, targetUrl, ["client.created"]);

    // Mock axios post execution tracker
    let dispatchedPayload: any = null;
    vi.mocked(axios.post).mockImplementation(async (url, data) => {
      if (url === targetUrl) {
        dispatchedPayload = data;
      }
      return { data: { success: true } };
    });

    // 2. Act: Simulate Client CRM creation
    const newClientPayload = {
      id: "client_9941",
      firstName: "Steve",
      lastName: "Jobs",
      email: "steve@apple.com",
      phone: "555-w0rld",
      tag: "Zapier Ingest",
      notes: "Enqueued through automated integration portal."
    };

    // This simulates the triggerEvent happening in ClientService.createClient
    await WebhookService.triggerEvent(workspaceId, "client.created", newClientPayload);

    // 3. Assert: The workflow correctly dispatched JSON telemetry to Zapier
    expect(axios.post).toHaveBeenCalled();
    expect(dispatchedPayload).toBeDefined();
    expect(dispatchedPayload.event).toBe("client.created");
    expect(dispatchedPayload.workspaceId).toBe(workspaceId);
    expect(dispatchedPayload.data.id).toBe("client_9941");
    expect(dispatchedPayload.data.firstName).toBe("Steve");
    expect(dispatchedPayload.data.email).toBe("steve@apple.com");
  });

  it("should securely propagate billing payment.completed events to external Make/n8n channels upon purchase", async () => {
    // 1. Arrange Webhook subscription for payment
    const targetUrl = "https://hooks.make.com/catch/test/e2e-completed-payment";
    await WebhookService.createSubscription(workspaceId, targetUrl, ["payment.completed"]);

    let dispatchedPayload: any = null;
    vi.mocked(axios.post).mockImplementation(async (url, data) => {
      if (url === targetUrl) {
        dispatchedPayload = data;
      }
      return { data: { success: true } };
    });

    // 2. Act: Simulate standard payment completion event
    const billingTxPayload = {
      transactionId: "INV-9952",
      amount: "$199.00",
      status: "Paid",
      method: "Stripe Subscriptions",
      planName: "Enterprise Plan Multi-Tenant",
      timestamp: new Date().toISOString()
    };

    await WebhookService.triggerEvent(workspaceId, "payment.completed", billingTxPayload);

    // 3. Assert check output consistency
    expect(axios.post).toHaveBeenCalled();
    expect(dispatchedPayload).toBeDefined();
    expect(dispatchedPayload.event).toBe("payment.completed");
    expect(dispatchedPayload.data.transactionId).toBe("INV-9952");
    expect(dispatchedPayload.data.amount).toBe("$199.00");
    expect(dispatchedPayload.data.planName).toBe("Enterprise Plan Multi-Tenant");
  });
});
