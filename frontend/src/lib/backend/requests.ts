import { nanoid } from "nanoid";
import { toast } from "sonner";

import { backendClient } from "@/lib/backend/client";

export async function sendHttpRequest() {
  try {
    const response = await backendClient.sendHttpRequest({
      id: nanoid(),

      method: "GET",

      url: "https://jsonplaceholder.typicode.com/todos/1",

      headers: {},
    });

    console.log(response);
  } catch (error) {
    toast.error("Request failed");
  }
}
