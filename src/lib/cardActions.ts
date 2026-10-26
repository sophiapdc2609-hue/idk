import { createContext } from "react";
export const CardActions = createContext<{
  edit: (id: string) => void;
  draw: (id: string) => void;
}>({ edit: () => {}, draw: () => {} });
