"use client";

import { Button } from "@/components/ui/button";
import React from "react";

const generateImage = async () => {
  try {
    console.log("ImageGen Click");
    const response = await fetch("http://localhost:8000/img-gen", {
      method: "POST",
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
