import fetch from "node-fetch";

export async function sendPushNotification(expoPushToken, data = {}) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "🚗 Garage Alert",
    body: "A driver nearby needs assistance!",
    data, // extra data like coordinates
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}
