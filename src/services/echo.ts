import api, { devIP } from "@/services/api";
import Echo from "laravel-echo";
import PusherModule from "pusher-js/react-native";

const PusherClient: any = (PusherModule as any).Pusher;

const [REVERB_HOST] = devIP.split(":");
const REVERB_PORT = 8080;
const REVERB_KEY = "yiejtpea0wwzggex5w53";

let echo: Echo<any> | null = null;

try {
  if (typeof PusherClient !== "function") {
    throw new Error(
      `PusherClient is not a constructor (typeof=${typeof PusherClient})`,
    );
  }

  const pusherClient = new PusherClient(REVERB_KEY, {
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: false,
    enabledTransports: ["ws"],
    disableStats: true,
    cluster: "mt1",

    channelAuthorization: {
      customHandler: (
        params: { socketId: string; channelName: string },
        callback: (error: Error | null, authData: any) => void,
      ) => {
        api
          .post("/broadcasting/auth", {
            socket_id: params.socketId,
            channel_name: params.channelName,
          })
          .then((res) => callback(null, res.data))
          .catch((err) => callback(err, null));
      },
    },
  });

  echo = new Echo({
    broadcaster: "reverb",
    key: REVERB_KEY,
    client: pusherClient,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: false,
    enabledTransports: ["ws"],
  });

  console.log("✅ Echo initialized successfully");
} catch (err) {
  console.error("❌ Echo/Pusher setup failed — real-time chat disabled:", err);
  echo = null;
}

export default echo;
