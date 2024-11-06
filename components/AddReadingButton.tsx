"use client";

import { Button } from "@/components/ui/button";
import { addRandomMeterReading } from "@/lib/meter";
import { useState } from "react";

export function AddReadingButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await addRandomMeterReading();
    } catch (error) {
      console.error("Error adding reading:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isLoading} className="">
      {isLoading ? "Adding..." : "Add Random Reading"}
    </Button>
  );
}
