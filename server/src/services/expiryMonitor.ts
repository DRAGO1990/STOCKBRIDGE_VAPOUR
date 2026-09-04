import prisma from '../lib/prisma';
import { getListingAgeInDays, getDaysUntilExpiry, shouldAutoUnlist } from '../utils/urgency';
import { emitNotificationToUser } from '../socket';

export interface ExpiryCheckResult {
  checkedCount: number;
  unlistedCount: number;
  notificationsCreated: number;
}

/**
 * Periodically checks currently active listings and automatically unlists qualifying products.
 *
 * Qualification rule:
 * 1. listingAgeInDays >= 15 (from createdAt)
 * 2. daysUntilExpiry < 11 (from expiryDate)
 * 3. listing is active and genuinely unsold (no active pending/confirmed reservations)
 *
 * When triggered:
 * - Automatically unlists product from marketplace (status = 'expiry_unlisted', active = false)
 * - Keeps listing in DB (seller can still see it in My Listings)
 * - Creates persistent seller notification (idempotent, no duplicates)
 * - Emits real-time Socket.IO notification if seller is online
 */
export async function runAutoExpiryUnlistingCheck(): Promise<ExpiryCheckResult> {
  const result: ExpiryCheckResult = {
    checkedCount: 0,
    unlistedCount: 0,
    notificationsCreated: 0,
  };

  try {
    // 1. Fetch only genuinely active listings
    const activeListings = await prisma.listing.findMany({
      where: {
        status: 'active',
        active: true,
      },
      select: {
        id: true,
        sellerId: true,
        title: true,
        createdAt: true,
        expiryDate: true,
        status: true,
        active: true,
      },
    });

    result.checkedCount = activeListings.length;
    console.log(`[ExpiryMonitor] Checked ${activeListings.length} active listings`);

    for (const listing of activeListings) {
      if (!listing.expiryDate) continue;

      const listingAge = getListingAgeInDays(listing.createdAt);
      const daysUntilExpiry = getDaysUntilExpiry(listing.expiryDate);

      // Check condition: listingAge >= 15 AND daysUntilExpiry < 11 AND active/unsold
      if (!shouldAutoUnlist(listing.createdAt, listing.expiryDate, listing.status, listing.active)) {
        continue;
      }

      // Check for active reservations (pending or confirmed).
      // Preserve active reservation workflow rather than blindly auto-unlisting it.
      const activeReservation = await prisma.reservation.findFirst({
        where: {
          listingId: listing.id,
          status: { in: ['pending', 'confirmed'] },
        },
      });

      if (activeReservation) {
        // Skip listing while it has an active reservation
        continue;
      }

      // Execute unlisting and notification creation atomically
      await prisma.$transaction(async (tx) => {
        // Concurrency-safe atomic update: only update if STILL active & unsold
        const updateResult = await tx.listing.updateMany({
          where: {
            id: listing.id,
            status: 'active',
            active: true,
          },
          data: {
            status: 'expiry_unlisted',
            active: false,
          },
        });

        // If another transaction modified the listing in the meantime, abort
        if (updateResult.count === 0) {
          return;
        }

        result.unlistedCount++;
        console.log(`[ExpiryMonitor] Auto-unlisted listing ${listing.id} - ${daysUntilExpiry} days until expiry`);

        // Check if an unlist notification already exists to guarantee idempotency
        const existingNotification = await tx.notification.findFirst({
          where: {
            userId: listing.sellerId,
            listingId: listing.id,
            type: 'LISTING_AUTO_UNLISTED',
          },
        });

        if (!existingNotification) {
          const notification = await tx.notification.create({
            data: {
              userId: listing.sellerId,
              listingId: listing.id,
              type: 'LISTING_AUTO_UNLISTED',
              title: 'Product automatically unlisted',
              message: `Your listing '${listing.title}' has been automatically unlisted because it has remained unsold for 15 days or more and now has less than 11 days remaining until expiry.`,
            },
          });

          result.notificationsCreated++;
          console.log(`[ExpiryMonitor] Notification created for seller ${listing.sellerId}`);

          // Emit real-time notification if seller is currently online
          try {
            emitNotificationToUser(listing.sellerId, {
              type: 'LISTING_AUTO_UNLISTED',
              notification,
            });
          } catch (socketErr) {
            console.error('[ExpiryMonitor] Socket notification error:', socketErr);
          }
        }
      });
    }
  } catch (err) {
    console.error('[ExpiryMonitor] Error during auto-expiry check:', err);
  }

  return result;
}
