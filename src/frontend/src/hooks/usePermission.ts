import { useApp } from "../contexts/AppContext";

export function usePermission(
  module: string,
  action: "view" | "edit" | "delete",
): boolean {
  const { checkPermission } = useApp();
  return checkPermission(module, action);
}
