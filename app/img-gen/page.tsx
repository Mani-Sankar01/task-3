"use client";

import { Button } from "@/components/ui/button";
import React from "react";

const generateImage = async () => {
  try {
    console.log("ImageGen Click");
    const response = await fetch("https://www.blackbox.ai/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept-language": "en-US,en;q=0.9",
        accept: "*/*",
        cookie: `sessionId=8cc57a5b-25ba-461c-9156-b33696cdbb32; __Host-authjs.csrf-token=1052bdb8f8fe6a2c133b60d993a2a8c23450ba958b7e350f559e392b3bde2006|d965db8aada80be20905ce1c04eea05630cd05c47ead53899939ce5104484974; __Secure-authjs.callback-url=https%3A%2F%2Fwww.blackbox.ai; intercom-id-jlmqxicb=ac9f2dfd-e567-445a-87b0-9e05f4ba69cc; intercom-session-jlmqxicb=; intercom-device-id-jlmqxicb=3772a8d9-eab6-4888-80cc-04f81a449434`,
        origin: "https://www.blackbox.ai",
        referer: "https://www.blackbox.ai/agent/ImageGenerationLV45LJp",
        "user-agent": `Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36`,
        "sec-ch-ua": `"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"`,
      },
      body: JSON.stringify({
        messages: [
          {
            id: "2StlICnjSK2FAbAlvFCq4",
            content:
              "A 3d anime image of a couple having fun in the jungle with beautiful greenery background, couple is walking in fear and a tigher is looking at them from behind, size: 4x9, dark background",
            role: "user",
          },
        ],
        id: "2StlICnjSK2FAbAlvFCq4",
        previewToken: null,
        userId: null,
        codeModelMode: true,
        agentMode: {
          mode: true,
          id: "ImageGenerationLV45LJp",
          name: "Image Generation",
        },
        trendingAgentMode: {},
        isMicMode: false,
        maxTokens: 1024,
        playgroundTopP: null,
        playgroundTemperature: null,
        isChromeExt: false,
        githubToken: null,
        clickedAnswer2: false,
        clickedAnswer3: false,
        clickedForceWebSearch: false,
        visitFromDelta: false,
        mobileClient: false,
        userSelectedModel: "gpt-4o",
        validated: "00f37b34-a166-4efb-bce5-1312d87f2f94",
      }),
    });
    console.log("ImageGen Done");
    console.log(response);
  } catch (error) {
    console.log(error);
  }
};

const page = () => {
  return (
    <div>
      <Button onClick={generateImage}>Image Generation</Button>
    </div>
  );
};

export default page;
