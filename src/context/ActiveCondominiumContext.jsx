import { createContext } from "react";

export const ActiveCondominiumContext = createContext({
  activeCondominiumId: null,
  source: "none",
});

