"use client";

import { createContext, useContext } from "react";

export type UserRole = "admin" | "viewer";

const RoleContext = createContext<UserRole>("admin");

export function useRole(): UserRole {
  return useContext(RoleContext);
}

export default RoleContext;
