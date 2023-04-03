import { useState } from "react";

export function useActiveTextToSpeech() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleActive = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

  return { activeId, toggleActive };
}
