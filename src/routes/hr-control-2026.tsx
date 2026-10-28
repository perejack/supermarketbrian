import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/hr-control-2026")({
  component: () => <Navigate to="/admin" />,
});
