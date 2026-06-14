import { Router, Response, NextFunction, Request } from "express";
import { publicRateLimiter } from "../middleware/rateLimiters";
import { AppointmentService } from "../services/appointment.service";
import { ClientService } from "../services/client.service";
import { ClientActivityService } from "../services/clientActivity.service";
import { getSupabaseServerClient } from "../middleware/requireAuth";
import { ApiError } from "../types/errors";

const publicBookingRouter = Router();

// Resolve workspace from slug - queries database for workspace by slug
const getWorkspaceBySlug = async (slug: string) => {
  try {
    const supabase = getSupabaseServerClient();
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("id, name, slug, description, contact_email, contact_phone")
      .eq("slug", slug.toLowerCase())
      .eq("is_active", true)
      .single();

    if (error || !workspace) {
      return null;
    }

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      contactEmail: workspace.contact_email,
      contactPhone: workspace.contact_phone,
    };
  } catch (err) {
    console.warn("[PublicBooking] Workspace lookup failed:", err);
    return null;
  }
};

/**
 * GET /api/public/booking/:slug
 * Retrieves workspace context, lists of available services, and mock schedules for the chosen slug.
 */
publicBookingRouter.get("/:slug", publicRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug || "salon-a";
    const workspace = await getWorkspaceBySlug(slug);
    
    if (!workspace) {
      throw new ApiError(404, "Workspace not found or inactive.");
    }

    let dbServices: any[] = [];
    try {
      const result = await AppointmentService.getServices(workspace.id, { limit: 100 });
      dbServices = result.data;
    } catch (dbErr) {
      console.warn("[PublicBooking] Supabase fetch omitted or failed, falling back to mock services:", dbErr);
    }

    // Default high-polish styling services for Salon A or custom workflows
    if (!dbServices || dbServices.length === 0) {
      dbServices = [
        {
          id: "srv-00000000-0000-0000-0000-000000000001",
          workspaceId: workspace.id,
          name: "Signature Styling & Hair Cut",
          durationMinutes: 45,
          price: 95.0,
          createdAt: new Date().toISOString()
        },
        {
          id: "srv-00000000-0000-0000-0000-000000000002",
          workspaceId: workspace.id,
          name: "Bespoke Balayage & Colour Design",
          durationMinutes: 120,
          price: 240.0,
          createdAt: new Date().toISOString()
        },
        {
          id: "srv-00000000-0000-0000-0000-000000000003",
          workspaceId: workspace.id,
          name: "Revitalising Scalp & Hydration Therapy",
          durationMinutes: 60,
          price: 110.0,
          createdAt: new Date().toISOString()
        },
        {
          id: "srv-00000000-0000-0000-0000-000000000004",
          workspaceId: workspace.id,
          name: "Bespoke Bridal Styling Trial",
          durationMinutes: 90,
          price: 180.0,
          createdAt: new Date().toISOString()
        }
      ];
    }

    // Generate upcoming eligible booking dates (next 10 days excluding Sundays)
    const availableDates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() !== 0) { // Skip sundays for Salon A
        availableDates.push(d.toISOString().split("T")[0]);
      }
    }

    // Standard business slot representations
    const availableTimeSlots = [
      "09:00 AM", "10:00 AM", "11:00 AM", 
      "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
    ];

    res.json({
      workspace,
      services: dbServices,
      availableDates,
      availableTimeSlots
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/public/booking/book
 * Submits self-booking information. Matches or creates a client, then registers the appointment.
 */
publicBookingRouter.post("/book", publicRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      slug, 
      firstName, 
      lastName, 
      email, 
      phone, 
      serviceId, 
      date, 
      timeSlot, 
      notes 
    } = req.body;

    if (!firstName || !email || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required booking details (First name, email, date, and timeslot are required)." });
    }

    const workspace = await getWorkspaceBySlug(slug || "salon-a");
    if (!workspace) {
      throw new ApiError(404, "Workspace not found or inactive.");
    }
    const workspaceId = workspace.id;

    // Convert timeslot string (e.g. "10:00 AM") to start/end ISO times
    const [time, ampm] = timeSlot.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    const startDateTime = new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default to 1-hour session duration

    let clientId = "guest-client-uuid";
    let isMockMode = true;

    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
      if (supabaseUrl && supabaseAnonKey) {
        isMockMode = false;
        
        // Find if client with same email exists in workspace
        const supabase = getSupabaseServerClient();
        const { data: existingClient } = await supabase
          .from("clients")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("email", email)
          .maybeSingle();

        if (existingClient) {
          clientId = existingClient.id;
        } else {
          // Create client
          const newClient = await ClientService.createClient(workspaceId, {
            firstName,
            lastName: lastName || "",
            email,
            phone: phone || ""
          });
          clientId = newClient.id;
        }

        // Create appointment booking
        await AppointmentService.createAppointment(workspaceId, {
          clientId,
          serviceId: serviceId || null,
          staffName: "Senior Stylist (Auto Assigned)",
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes: notes || "Public booking submission"
        });

        // Track self-booking activity
        await ClientActivityService.createActivity(workspaceId, clientId, {
          type: "appointment_created",
          title: "Public Self-Booking Registered",
          description: `Guest scheduled a session on ${date} at ${timeSlot}. Notes: ${notes || "None"}`
        });
      }
    } catch (dbErr) {
      console.warn("[PublicBooking] Supabase writing failed:", dbErr);
      return res.status(500).json({
        error: "Booking could not be saved. Please try again or contact us directly.",
        success: false
      });
    }

    res.json({
      success: true,
      message: "Your styling session is booked successfully!",
      booking: {
        workspaceName: workspace.name,
        clientName: `${firstName} ${lastName || ""}`.trim(),
        date,
        timeSlot,
        startDateTime: startDateTime.toISOString(),
        isMockMode
      }
    });
  } catch (err: any) {
    next(err);
  }
});

export { publicBookingRouter };
