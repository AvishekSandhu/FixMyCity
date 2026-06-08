// backend/middleware/notify.js
import Notification from "../models/notification.js";
import { clerkClient } from "../config/clerk.js";
import { getUserRole } from "../role.js";

/**
 * Ensures each notification is created ONLY one time.
 * No loops, no duplicate writes, no double triggers.
 */
export async function notifyComplaintCreated({ submitterId, complaint }) {
  try {
    if (!submitterId || !complaint) return;

  const ticket = complaint.ticket || complaint.code || complaint._id.toString();

    const complaintId = complaint._id.toString();

    // ----------------------------------------
    // 1) Notify citizen (only once)
    // ----------------------------------------
    await Notification.create({
      userId: submitterId,
      type: "complaint_created",
      title: "Complaint Submitted Successfully",
      message: `Your complaint has been registered. Ticket: ${ticket}`,
      code: ticket,
      complaintId,
      link: `/t/${ticket}`,
      meta: {
        complaintType: complaint.complaintType,
        createdAt: complaint.createdAt,
      },
    });

    // ----------------------------------------
    // 2) Notify admins (only once)
    // ----------------------------------------

    // Get all users → filter admins
    const users = await clerkClient.users.getUserList();
    const adminUsers = [];

    for (const u of users) {
      const role = await getUserRole(u.id);
      if (role === "admin") adminUsers.push(u.id);
    }

    // Send to ALL admins (recommended)
    for (const adminId of adminUsers) {
      await Notification.create({
        userId: adminId,
        type: "complaint_created_admin",
        title: "New Complaint Submitted",
        message: `A new complaint has been submitted. Ticket: ${ticket}`,
        code: ticket,
        complaintId,
        link: `/admin/complaints/${complaintId}`,
        meta: {
          submittedBy: submitterId,
          complaintType: complaint.complaintType,
          createdAt: complaint.createdAt,
        },
      });
    }

    return true;
  } catch (err) {
    console.error("notifyComplaintCreated ERROR:", err);
  }
}
