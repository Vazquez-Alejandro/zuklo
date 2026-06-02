import admin from "firebase-admin";

let initialized = false;

function getFirebaseAdmin(): admin.messaging.Messaging {
  if (!initialized) {
    if (!admin.apps.length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(
            JSON.parse(serviceAccount)
          ),
        });
      } else {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
    }
    initialized = true;
  }
  return admin.messaging();
}

export interface PushNotification {
  token: string;
  title: string;
  body: string;
  imageUrl?: string;
  deepLink: string;
  data?: Record<string, string>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  deepLink: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(
  notification: PushNotification
): Promise<boolean> {
  try {
    const messaging = getFirebaseAdmin();

    const message: admin.messaging.Message = {
      token: notification.token,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      data: {
        deepLink: notification.deepLink,
        ...(notification.data || {}),
      },
      android: {
        priority: "high",
        notification: {
          channelId: "property-alerts",
          priority: "high",
        },
      },
      webpush: {
        headers: {
          TTL: "86400",
        },
        notification: {
          title: notification.title,
          body: notification.body,
          icon: "/icons/notification-icon.png",
          badge: "/icons/badge-icon.png",
          actions: [
            {
              action: "view",
              title: "Ver propiedad",
            },
            {
              action: "dismiss",
              title: "Cerrar",
            },
          ],
        },
      },
    };

    await messaging.send(message);
    return true;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
}

export async function sendPushToMultipleDevices(
  tokens: string[],
  notification: Omit<PushNotification, "token">
): Promise<{ success: number; failed: number }> {
  const messaging = getFirebaseAdmin();

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: notification.title,
      body: notification.body,
      ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
    },
    data: {
      deepLink: notification.deepLink,
      ...(notification.data || {}),
    },
    android: {
      priority: "high",
      notification: {
        channelId: "property-alerts",
        priority: "high",
      },
    },
    webpush: {
      headers: {
        TTL: "86400",
      },
      notification: {
        title: notification.title,
        body: notification.body,
        icon: "/icons/notification-icon.png",
      },
    },
  };

  const response = await messaging.sendEachForMulticast(message);

  return {
    success: response.successCount,
    failed: response.failureCount,
  };
}

export function buildPropertyNotificationPayload(
  property: {
    id: string;
    title: string;
    price: number;
    currency: string;
    city: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    mainImage: string;
    url: string;
  },
  filterName: string
): NotificationPayload {
  const priceStr = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: property.currency,
    maximumFractionDigits: 0,
  }).format(property.price);

  const features = [];
  if (property.bedrooms > 0) features.push(`${property.bedrooms} dorm`);
  if (property.bathrooms > 0) features.push(`${property.bathrooms} baños`);
  if (property.area > 0) features.push(`${property.area} m²`);

  return {
    title: `🏠 Nueva propiedad: ${filterName}`,
    body: `${property.title} — ${priceStr} | ${features.join(" • ")}`,
    imageUrl: property.mainImage,
    deepLink: `zuklo://property/${property.id}`,
    data: {
      propertyId: property.id,
      filterName,
      price: String(property.price),
      city: property.city,
    },
  };
}

export async function sendPropertyAlert(
  tokens: string[],
  property: Parameters<typeof buildPropertyNotificationPayload>[0],
  filterName: string
): Promise<{ success: number; failed: number }> {
  const payload = buildPropertyNotificationPayload(property, filterName);
  return sendPushToMultipleDevices(tokens, payload);
}
